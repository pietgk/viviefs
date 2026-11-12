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
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { layerMemory } from '@viviefs/blobs'
import { evidenceCatalog, liveClock } from '@viviefs/datom'
import { ProviderAccount } from '@viviefs/identity'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { Memberships, syncHttpLayer } from '@viviefs/sync-server'

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
  /**
   * Browser origins allowed to call `/rpc` (the web app in the lab). Only
   * the bearer token authenticates; no cookies, so no credentials mode.
   */
  readonly corsOrigins?: ReadonlyArray<string>
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
  const server = syncHttpLayer(evidenceCatalog, {
    path: RPC_PATH,
    corsOrigins: options.corsOrigins ?? [],
  })
  // The app chooses the platform: PGlite, an in-memory blob store, this
  // issuer's verifier and Node's HTTP server (D220).
  return seedLayer(options.seed).pipe(
    Layer.provideMerge(server),
    Layer.provide(layerMemory),
    Layer.provide(verifier),
    Layer.provideMerge(store),
    Layer.provideMerge(
      NodeHttpServer.layer(createServer, {
        host: options.host,
        port: options.port,
      }),
    ),
  )
}
