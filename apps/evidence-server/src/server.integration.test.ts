import { describe, expect, it } from '@effect/vitest'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as HttpServer from 'effect/unstable/http/HttpServer'
import * as RpcClient from 'effect/unstable/rpc/RpcClient'
import * as RpcSerialization from 'effect/unstable/rpc/RpcSerialization'
import { Attr, LogStore, liveClock } from '@viviefs/datom'
import { renameList } from '@viviefs/evidence-model'
import type { SignInSession } from '@viviefs/identity'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { bearerAuthenticationClient } from '@viviefs/sync-client'
import { SyncRpcs } from '@viviefs/sync-protocol'
import { Memberships } from '@viviefs/sync-server'
import {
  fakeSignInSession,
  tokenSignInSession,
  type FakeIssuer,
} from '@viviefs/testing/identity'
import { serveFakeIssuer } from '@viviefs/testing/node'
import { RPC_PATH, evidenceServerLayer } from './server.ts'

const AUDIENCE = 'viviefs-sync'

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

const started = (fake: FakeIssuer) =>
  Effect.gen(function* () {
    const server = yield* Layer.build(
      evidenceServerLayer({
        host: '127.0.0.1',
        port: 0,
        issuer: fake.issuer,
        audience: AUDIENCE,
        seed: [{ org: 'acme', account: fake.account('alice') }],
      }),
    )
    const address = Context.get(server, HttpServer.HttpServer).address
    if (address._tag === 'UnixPathAddress') throw new Error('not a TCP address')
    const person = yield* Context.get(server, Memberships).personOf(
      fake.account('alice'),
    )
    return {
      url: `http://127.0.0.1:${address.port}${RPC_PATH}`,
      person: person ?? '',
    }
  })

describe('evidence server over HTTP', () => {
  it.live(
    'authenticates every call and serves only members',
    () =>
      Effect.gen(function* () {
        const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
        const { url, person } = yield* started(fake)
        const alice = yield* clientFor(url, fakeSignInSession(fake, 'alice'))

        const device = yield* Layer.build(
          pgliteLogStore({ deviceId: 'alice-phone' }).pipe(
            Layer.provide(liveClock),
          ),
        )
        const store = Context.get(device, LogStore)
        const changeset = yield* renameList(
          { title: null },
          { org: 'acme', list: 'one', title: 'over http' },
          {
            cs: yield* store.mint(),
            memberTx: yield* store.mint(),
            extraTx: yield* store.mint(),
            commitTx: yield* store.mint(),
            actor: person,
            device: 'alice-phone',
            basis: 0,
          },
        )
        const ack = yield* alice.Append({
          ...changeset,
          datoms: [...changeset.datoms],
        })
        expect(ack.cursor).toBeGreaterThan(0)

        const pages = yield* Stream.runCollect(
          alice.Pull({ org: 'acme', cursor: 0 }),
        )
        const page = pages[0]
        const title = page?.datoms.find((d) => d.a === Attr.listTitle)
        expect(title?.v).toBe('over http')
        const envelope = page?.envelopes.find(
          (e) => e.cs === changeset.envelope.cs,
        )
        expect(envelope?.actor).toBe(person)
        expect(envelope?.acceptedAt).toBeTypeOf('number')

        const otherOrg = yield* tagOf(
          Stream.runCollect(alice.Pull({ org: 'other', cursor: 0 })),
        )
        expect(otherOrg).toBe('MembershipMissing')

        const bob = yield* clientFor(url, fakeSignInSession(fake, 'bob'))
        const neverGranted = yield* tagOf(
          Stream.runCollect(bob.Pull({ org: 'acme', cursor: 0 })),
        )
        expect(neverGranted).toBe('MembershipMissing')

        const anonymous = yield* clientFor(
          url,
          tokenSignInSession(Effect.succeed('')),
        )
        const missing = yield* Effect.match(
          Stream.runCollect(anonymous.Pull({ org: 'acme', cursor: 0 })),
          {
            onSuccess: () => 'ok',
            onFailure: (error) =>
              error._tag === 'TokenRejected'
                ? `TokenRejected ${error.reason}`
                : error._tag,
          },
        )
        expect(missing).toBe('TokenRejected missing')
      }),
    60_000,
  )

  it.live(
    'lets only the configured browser origins call /rpc',
    () =>
      Effect.gen(function* () {
        const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
        const allowedOrigin = (corsOrigins: ReadonlyArray<string>) =>
          Effect.gen(function* () {
            const server = yield* Layer.build(
              evidenceServerLayer({
                host: '127.0.0.1',
                port: 0,
                issuer: fake.issuer,
                audience: AUDIENCE,
                seed: [],
                corsOrigins,
              }),
            )
            const address = Context.get(server, HttpServer.HttpServer).address
            if (address._tag === 'UnixPathAddress') throw new Error('not TCP')
            const response = yield* Effect.promise(() =>
              fetch(`http://127.0.0.1:${address.port}${RPC_PATH}`, {
                method: 'OPTIONS',
                headers: {
                  origin: 'http://localhost:8081',
                  'access-control-request-method': 'POST',
                  'access-control-request-headers': 'authorization,content-type',
                },
              }),
            )
            return {
              origin: response.headers.get('access-control-allow-origin'),
              headers: response.headers.get('access-control-allow-headers'),
            }
          }).pipe(Effect.scoped)
        const allowed = yield* allowedOrigin(['http://localhost:8081'])
        expect(allowed.origin).toBe('http://localhost:8081')
        expect(allowed.headers).toContain('authorization')
        expect((yield* allowedOrigin([])).origin).toBeNull()
      }),
    60_000,
  )
})
