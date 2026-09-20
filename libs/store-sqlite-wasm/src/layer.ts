/**
 * Official web SQLite driver: `@effect/sql-sqlite-wasm` over an OPFS worker.
 * P02 exemplar of the wasm log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-wasm/SqliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import type * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'

export const sqliteWasmOpfsLayer = (
  worker: Effect.Effect<Worker, never, Scope.Scope>,
) => SqliteClient.layer({ worker })

export const sqliteWasmLogStore = (options: {
  worker: Effect.Effect<Worker, never, Scope.Scope>
  deviceId: string
}) =>
  logStoreLayer.pipe(
    Layer.provide(sqliteWasmOpfsLayer(options.worker)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
