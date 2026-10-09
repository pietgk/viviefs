/**
 * I71: an `Append` that passed the membership check can still be appended
 * after a `revoke` committed. The server below is the evidence server's
 * composition (sync RPCs over HTTP, PGlite log, OIDC verifier against a fake
 * issuer) with one test seam: the server's log store holds a device's append
 * until the test releases it. That pins the interleaving without sleeps:
 * the member's `Append` has passed `requireMembership` and every accept check
 * and waits at `store.append`, the operator's `revoke` runs to completion,
 * then the append goes on.
 */
import { createServer } from 'node:http'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import { describe, expect, it } from '@effect/vitest'
import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as HttpRouter from 'effect/http/HttpRouter'
import * as HttpServer from 'effect/http/HttpServer'
import * as RpcClient from 'effect/rpc/RpcClient'
import * as RpcSerialization from 'effect/rpc/RpcSerialization'
import * as RpcServer from 'effect/rpc/RpcServer'
import * as SqlClient from 'effect/sql/SqlClient'
import { layerMemory } from '@viviefs/blobs'
import { Attr, LogStore, evidenceCatalog, liveClock } from '@viviefs/datom'
import { renameList } from '@viviefs/evidence-model'
import type { SignInSession } from '@viviefs/identity'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import { fakeSignInSession } from '@viviefs/identity/suites'
import { serveFakeIssuer } from '@viviefs/identity/suites/node'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { bearerAuthenticationClient } from '@viviefs/sync-client'
import { SyncRpcs } from '@viviefs/sync-protocol'
import { Memberships, syncServerLayer } from '@viviefs/sync-server'
import { runUnscoped } from '@viviefs/testing'
import { RPC_PATH } from './server.ts'

const AUDIENCE = 'viviefs-sync'
const ORG = 'acme'

/** The test's hold on device appends: `reached` when one waits, `release` lets it go. */
type Hold = {
  readonly reached: Deferred.Deferred<void>
  readonly release: Deferred.Deferred<void>
}

/**
 * The server's PGlite log store, except that an append from a device waits
 * for `hold.release`. The server's own appends (grant, revoke) pass straight
 * through.
 */
const heldLogStore = (hold: Hold) =>
  Layer.effectContext(
    Effect.gen(function* () {
      const store = yield* LogStore
      const sql = yield* SqlClient.SqlClient
      const held = LogStore.of({
        ...store,
        append: (datoms, envelope) =>
          envelope.actor === 'server'
            ? store.append(datoms, envelope)
            : Deferred.succeed(hold.reached, undefined).pipe(
                Effect.andThen(Deferred.await(hold.release)),
                Effect.andThen(store.append(datoms, envelope)),
              ),
      })
      return Context.make(LogStore, held).pipe(
        Context.add(SqlClient.SqlClient, sql),
      )
    }),
  ).pipe(
    Layer.provide(
      pgliteLogStore({ deviceId: 'evidence-server' }).pipe(
        Layer.provide(liveClock),
      ),
    ),
  )

/** `evidenceServerLayer`'s composition on the held log store. */
const heldServerLayer = (issuer: string, hold: Hold) => {
  const verifier = oidcTokenVerifier({ issuer, audience: AUDIENCE }).pipe(
    Layer.provide(FetchHttpClient.layer),
  )
  const sync = syncServerLayer(evidenceCatalog).pipe(
    Layer.provide(layerMemory),
    Layer.provide(verifier),
  )
  const rpc = RpcServer.layerHttp({
    group: SyncRpcs,
    path: RPC_PATH,
    protocol: 'http',
  })
  return HttpRouter.serve(rpc, { disableListenLog: true }).pipe(
    Layer.provideMerge(sync),
    Layer.provide(RpcSerialization.layerNdjson),
    Layer.provideMerge(heldLogStore(hold)),
    Layer.provideMerge(
      NodeHttpServer.layer(createServer, { host: '127.0.0.1', port: 0 }),
    ),
  )
}

const clientFor = (url: string, session: Layer.Layer<SignInSession>) =>
  RpcClient.make(SyncRpcs).pipe(
    Effect.provide(
      Layer.mergeAll(
        RpcClient.layerProtocolHttp({ url }).pipe(
          Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
        ),
        bearerAuthenticationClient.pipe(Layer.provide(session)),
      ),
    ),
  )

const tagOf = <A, E extends { readonly _tag: string }>(
  effect: Effect.Effect<A, E>,
) =>
  Effect.match(effect, {
    onSuccess: () => 'ok',
    onFailure: (error) => error._tag,
  })

type Observed = {
  /** The held `Append`'s outcome: `ok` or the error's tag. */
  readonly heldAppend: string
  /** Whether `revoke` returned while the `Append` was held at `store.append`. */
  readonly revokedWhileHeld: boolean
  /** Alice's membership right after `revoke` returned. */
  readonly memberAfterRevoke: boolean
  /** Log position of the revocation's datom. */
  readonly revokedAt: number
  /** Log positions of the held changeset's datoms. */
  readonly landedAt: ReadonlyArray<number>
  /** An `Append` sent after the revoke: `ok` or the error's tag. */
  readonly lateAppend: string
}

/**
 * Alice, a member of `acme`, sends an `Append` over HTTP. It passes the
 * membership check and waits at `store.append`; the operator revokes her;
 * the append goes on. Then she sends another `Append`.
 */
const appendRacingRevoke: Effect.Effect<Observed, unknown> = Effect.gen(
  function* () {
    const hold: Hold = {
      reached: yield* Deferred.make<void>(),
      release: yield* Deferred.make<void>(),
    }
    const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
    const server = yield* Layer.build(heldServerLayer(fake.issuer, hold))
    const address = Context.get(server, HttpServer.HttpServer).address
    if (address._tag === 'UnixPathAddress') throw new Error('not a TCP address')
    const url = `http://127.0.0.1:${address.port}${RPC_PATH}`
    const memberships = Context.get(server, Memberships)
    const log = Context.get(server, LogStore)

    const account = fake.account('alice')
    const person = yield* memberships.grant(ORG, account)
    const alice = yield* clientFor(url, fakeSignInSession(fake, 'alice'))

    const device = Context.get(
      yield* Layer.build(
        pgliteLogStore({ deviceId: 'alice-phone' }).pipe(
          Layer.provide(liveClock),
        ),
      ),
      LogStore,
    )
    const changeset = (title: string) =>
      Effect.gen(function* () {
        const made = yield* renameList(
          { title: null },
          { org: ORG, list: 'one', title },
          {
            cs: yield* device.mint(),
            memberTx: yield* device.mint(),
            extraTx: yield* device.mint(),
            commitTx: yield* device.mint(),
            actor: person,
            device: 'alice-phone',
            basis: 0,
          },
        )
        return { ...made, datoms: [...made.datoms] }
      })

    const raced = yield* changeset('before the revoke')
    const append = yield* Effect.forkChild(tagOf(alice.Append(raced)))
    yield* Deferred.await(hold.reached)

    const revoke = yield* Effect.forkChild(memberships.revoke(ORG, account))
    // Without a shared lock `revoke` returns at once. If a fix makes it wait
    // for the held append instead, give up waiting and release the append.
    const revoked = yield* Fiber.join(revoke).pipe(
      Effect.timeoutOption('5 seconds'),
    )
    const memberAfterRevoke = yield* memberships.isMember(person, ORG)
    yield* Deferred.succeed(hold.release, undefined)
    const heldAppend = yield* Fiber.join(append)
    yield* Fiber.join(revoke)

    const lateAppend = yield* tagOf(
      alice.Append(yield* changeset('after the revoke')),
    )

    const rows = yield* log.streamFrom(0)
    const revocation = rows.find(
      (row) => row.a === Attr.membershipGranted && row.op === 'retract',
    )
    return {
      heldAppend,
      revokedWhileHeld: Option.isSome(revoked),
      memberAfterRevoke,
      revokedAt: revocation?.seq ?? 0,
      landedAt: rows
        .filter((row) => row.cs === raced.envelope.cs)
        .map((row) => row.seq),
      lateAppend,
    }
  },
).pipe(Effect.scoped)

describe('an append racing a membership revoke (I71)', () => {
  it.live(
    'holds an append that passed the membership check while the revoke commits',
    () =>
      Effect.gen(function* () {
        const observed = yield* runUnscoped(appendRacingRevoke)
        // The race happened: the revoke committed, and only after the held
        // append had passed the membership check.
        expect(observed.revokedAt).toBeGreaterThan(0)
        // Control: an append that starts after the revoke is refused.
        expect(observed.lateAppend).toBe('MembershipMissing')
      }),
    60_000,
  )

  // Known bug I71: `Append` checks membership, then appends, and nothing
  // orders a concurrent `revoke` between the two. Today the held changeset
  // lands right after the revocation's datom, so the assertion fails and
  // `it.live.fails` keeps verify green. When a fix closes the window the
  // assertion holds, this test turns red, and it becomes `it.live`.
  it.live.fails(
    'never appends a changeset after the revocation of its actor',
    () =>
      Effect.gen(function* () {
        const observed = yield* runUnscoped(appendRacingRevoke)
        const afterRevocation = observed.landedAt.filter(
          (seq) => seq > observed.revokedAt,
        )
        expect(afterRevocation, JSON.stringify(observed)).toEqual([])
      }),
    60_000,
  )
})
