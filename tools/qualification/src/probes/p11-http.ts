/**
 * P11 over HTTP with real tokens: the Node leg of check 3 against the lab's
 * evidence server (`p11-lab.ts`), which verifies Keycloak's tokens through
 * OIDC discovery and JWKS. alice is granted `acme` by her pinned id; bob
 * signs in but was never granted anything. Tokens come from the lab's
 * password-grant probe client, so no browser is involved; the device checks
 * cover the PKCE sign-in.
 */
import { join } from 'node:path'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as RpcClient from 'effect/unstable/rpc/RpcClient'
import * as RpcSerialization from 'effect/unstable/rpc/RpcSerialization'
import { LogStore, liveClock } from '@viviefs/datom'
import { renameList } from '@viviefs/evidence-model'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { SyncRpc, syncRpcClientLayer } from '@viviefs/sync-client'
import { tokenSignInSession } from '@viviefs/identity/suites'
import type { CheckResult } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import { LAB_USERS } from './keycloak.ts'
import type { P11Lab } from './p11-lab.ts'
import { require, runCheck } from './sync-world.ts'

export const P11_HTTP_CHECK_NAMES = [
  'member acked over HTTP',
  'cross-organization denied over HTTP',
  'never granted over HTTP',
  'foreign issuer refused over HTTP',
] as const

const DEVICE = 'p11-http'

const outcome = <A, E extends { readonly _tag: string }, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<string, never, R> =>
  Effect.match(effect, {
    onSuccess: () => 'ok',
    onFailure: (error) => {
      const reason = (error as { readonly reason?: unknown }).reason
      return typeof reason === 'string' ? `${error._tag} ${reason}` : error._tag
    },
  })

/** `SyncRpc` to the lab server, every call carrying a token from `token`. */
const clientWith = (
  serverUrl: string,
  token: () => Promise<string>,
): Effect.Effect<SyncRpc['Service'], never, Scope.Scope> =>
  Effect.map(
    Layer.build(
      syncRpcClientLayer.pipe(
        Layer.provide(
          RpcClient.layerProtocolHttp({ url: serverUrl }).pipe(
            Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
          ),
        ),
        Layer.provide(tokenSignInSession(Effect.promise(token))),
      ),
    ),
    (context) => Context.get(context, SyncRpc),
  )

const titled = (store: LogStore['Service'], org: string, actor: string, title: string) =>
  Effect.gen(function* () {
    const changeset = yield* renameList(
      { title: null },
      { org, list: `${DEVICE}-${org}`, title },
      {
        cs: yield* store.mint(),
        memberTx: yield* store.mint(),
        extraTx: yield* store.mint(),
        commitTx: yield* store.mint(),
        actor,
        device: DEVICE,
        basis: 0,
      },
    )
    return { ...changeset, datoms: [...changeset.datoms] }
  })

export const runP11HttpChecks = (lab: P11Lab): Promise<ReadonlyArray<CheckResult>> =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const { keycloak, serverUrl } = lab
        const directory = yield* withTempDirectory('viviefs-p11-http-')
        const store = Context.get(
          yield* Layer.build(
            sqliteNodeLogStore({
              filename: join(directory, 'device.sqlite'),
              deviceId: DEVICE,
            }).pipe(Layer.provide(liveClock)),
          ),
          LogStore,
        )
        const alice = yield* clientWith(serverUrl, () => keycloak.token('alice'))
        const bob = yield* clientWith(serverUrl, () => keycloak.token('bob'))
        const stranger = yield* clientWith(serverUrl, () => keycloak.foreignIssuerToken())
        let person = ''

        const member = Effect.gen(function* () {
          const statement = yield* alice.caller
          yield* require(
            statement.account.issuer === keycloak.issuer &&
              statement.account.subject === LAB_USERS.alice.id &&
              statement.person !== null &&
              JSON.stringify(statement.organizations) === '["acme"]',
            JSON.stringify(statement),
          )
          person = statement.person ?? ''
          const changeset = yield* titled(store, 'acme', person, 'over http')
          const ack = yield* alice.append(changeset)
          const page = yield* alice.pull({ org: 'acme', cursor: 0 })
          const envelope = page.envelopes.find((e) => e.cs === changeset.envelope.cs)
          yield* require(
            ack.cursor > 0 &&
              envelope?.actor === person &&
              typeof envelope.acceptedAt === 'number',
            JSON.stringify({ ack, envelope }),
          )
          return { cursor: ack.cursor, acceptedAt: 'stamped' }
        })

        const crossOrganization = Effect.gen(function* () {
          const denied = {
            append: yield* outcome(alice.append(yield* titled(store, 'other', person, 'theirs'))),
            pull: yield* outcome(alice.pull({ org: 'other', cursor: 0 })),
          }
          yield* require(
            denied.append === 'MembershipMissing' && denied.pull === 'MembershipMissing',
            JSON.stringify(denied),
          )
          return denied
        })

        const neverGranted = Effect.gen(function* () {
          const statement = yield* bob.caller
          const pull = yield* outcome(bob.pull({ org: 'acme', cursor: 0 }))
          yield* require(
            statement.account.subject === LAB_USERS.bob.id &&
              statement.person === null &&
              statement.organizations.length === 0 &&
              pull === 'MembershipMissing',
            JSON.stringify({ statement, pull }),
          )
          return { person: null, pull }
        })

        const foreignIssuer = Effect.gen(function* () {
          const pull = yield* outcome(stranger.pull({ org: 'acme', cursor: 0 }))
          yield* require(pull.startsWith('TokenRejected'), pull)
          return { pull }
        })

        return yield* Effect.all(
          [
            runCheck('P11', 'member acked over HTTP', 'httpMember', member),
            runCheck('P11', 'cross-organization denied over HTTP', 'httpCross', crossOrganization),
            runCheck('P11', 'never granted over HTTP', 'httpNeverGranted', neverGranted),
            runCheck('P11', 'foreign issuer refused over HTTP', 'httpForeignIssuer', foreignIssuer),
          ],
          { concurrency: 1 },
        )
      }),
    ),
  )
