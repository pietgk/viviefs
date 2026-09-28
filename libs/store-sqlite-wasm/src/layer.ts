/**
 * Official web SQLite driver: `@effect/sql-sqlite-wasm` over an OPFS worker.
 * P02 exemplar of the wasm log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-wasm/SqliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'

/** How long the OPFS worker may take to open its database. */
const READY_TIMEOUT = '30 seconds'

/**
 * The client waits for the worker's ready message and does not notice a
 * worker that failed before sending it, so opening is bounded here.
 */
export const sqliteWasmOpfsLayer = (
  worker: Effect.Effect<Worker, never, Scope.Scope>,
) =>
  Layer.effectContext(
    Layer.build(SqliteClient.layer({ worker })).pipe(
      Effect.timeoutOrElse({
        duration: READY_TIMEOUT,
        orElse: () =>
          Effect.die(
            new Error(`the OPFS worker did not open its database within ${READY_TIMEOUT}`),
          ),
      }),
    ),
  )

export const sqliteWasmLogStore = (options: {
  worker: Effect.Effect<Worker, never, Scope.Scope>
  deviceId: string
}) =>
  logStoreLayer.pipe(
    Layer.provideMerge(sqliteWasmOpfsLayer(options.worker)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
