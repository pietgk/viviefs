/**
 * The sync server as one Layer (D220): the sync RPCs over HTTP at `path`,
 * their handlers, bearer authentication, authority and memberships. It needs
 * a log store, a blob store, a token verifier and an HTTP server; a
 * composition root (an app, a probe, a test) provides those and launches it,
 * the way Effect composes a service's layer with its platform
 * (`HttpRouter.serve(...).pipe(Layer.provide(NodeHttpServer.layer(...)))`).
 */
import * as Layer from 'effect/Layer'
import * as HttpRouter from 'effect/http/HttpRouter'
import * as RpcSerialization from 'effect/rpc/RpcSerialization'
import * as RpcServer from 'effect/rpc/RpcServer'
import type { Catalog } from '@viviefs/datom'
import { SyncRpcs } from '@viviefs/sync-protocol'
import { syncServerLayer } from './server.ts'

export type SyncHttpOptions = {
  /** Where the RPCs are served, such as `/rpc`. */
  readonly path: HttpRouter.PathInput
  /**
   * Browser origins allowed to call the RPCs (a web app). Only the bearer
   * token authenticates; no cookies, so no credentials mode.
   */
  readonly corsOrigins?: ReadonlyArray<string>
}

export const syncHttpLayer = (catalog: Catalog, options: SyncHttpOptions) => {
  const cors =
    options.corsOrigins === undefined || options.corsOrigins.length === 0
      ? Layer.empty
      : HttpRouter.cors({
          allowedOrigins: options.corsOrigins,
          allowedMethods: ['POST'],
          // Trace context headers: device spans continue on the server (P10).
          allowedHeaders: ['authorization', 'content-type', 'traceparent', 'b3'],
        })
  const rpc = RpcServer.layerHttp({ group: SyncRpcs, path: options.path, protocol: 'http' }).pipe(Layer.provide(cors))
  return HttpRouter.serve(rpc, { disableListenLog: true }).pipe(
    Layer.provideMerge(syncServerLayer(catalog)),
    Layer.provide(RpcSerialization.layerNdjson),
  )
}
