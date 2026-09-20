/**
 * Postgres log store. P04 qualifies the postgres dialect via
 * `@effect/sql-pglite` (WASM Postgres, Apache-2.0). Hosted `@effect/sql-pg`
 * is the same LogStore SQL when a server is admitted.
 */
import * as PgliteClient from '@effect/sql-pglite/PgliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Layer from 'effect/Layer'

export const pgliteLayer = PgliteClient.layer({})

export const pgliteLogStore = (options: {
  deviceId: string
  dataDir?: string
}) =>
  logStoreLayer.pipe(
    Layer.provide(PgliteClient.layer({ dataDir: options.dataDir })),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
