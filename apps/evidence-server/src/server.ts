/**
 * Evidence server composition (P11, ADR-0022). The authenticated sync RPCs
 * over HTTP at `/rpc`, on a Postgres log (PGlite in the lab), an in-memory
 * blob store, and a token verifier for one OIDC issuer. A seed grants the
 * lab's first memberships; afterwards only the operator grants.
 */
import { createServer } from 'node:http'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as HttpRouter from 'effect/unstable/http/HttpRouter'
import * as RpcSerialization from 'effect/unstable/rpc/RpcSerialization'
import * as RpcServer from 'effect/unstable/rpc/RpcServer'
import { layerMemory } from '@viviefs/blobs'
import { evidenceCatalog, liveClock } from '@viviefs/datom'
import { ProviderAccount } from '@viviefs/identity'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { SyncRpcs } from '@viviefs/sync-protocol'
import { Memberships, syncServerLayer } from '@viviefs/sync-server'

export const RPC_PATH = '/rpc'

/** One membership the lab starts with. */
export const SeedGrant = Schema.Struct({
  org: Schema.String,
  account: ProviderAccount,
})
export type SeedGrant = typeof SeedGrant.Type

export type EvidenceServerOptions = {
  readonly host: string
  readonly port: number
  readonly issuer: string
  readonly audience: string
  /** PGlite data directory; in memory when absent. */
  readonly dataDir?: string
  readonly seed: ReadonlyArray<SeedGrant>
}

const seedLayer = (seed: ReadonlyArray<SeedGrant>) =>
  Layer.effectDiscard(
    Effect.gen(function* () {
      const memberships = yield* Memberships
      yield* Effect.forEach(
        seed,
        (grant) => memberships.grant(grant.org, grant.account),
        { discard: true },
      )
    }),
  )

export const evidenceServerLayer = (options: EvidenceServerOptions) => {
  const store = pgliteLogStore({
    deviceId: 'evidence-server',
    ...(options.dataDir === undefined ? {} : { dataDir: options.dataDir }),
  }).pipe(Layer.provide(liveClock))
  const verifier = oidcTokenVerifier({
    issuer: options.issuer,
    audience: options.audience,
  }).pipe(Layer.provide(FetchHttpClient.layer))
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
    Layer.provideMerge(seedLayer(options.seed)),
    Layer.provideMerge(sync),
    Layer.provide(RpcSerialization.layerNdjson),
    Layer.provideMerge(store),
    Layer.provideMerge(
      NodeHttpServer.layer(createServer, {
        host: options.host,
        port: options.port,
      }),
    ),
  )
}
