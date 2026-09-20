/**
 * Node SQLite log store: `@effect/sql-sqlite-node` plus the shared LogStore.
 */
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Layer from 'effect/Layer'

export const sqliteNodeLayer = (filename: string) =>
  SqliteClient.layer({ filename })

export const sqliteNodeLogStore = (options: {
  filename: string
  deviceId: string
}) =>
  logStoreLayer.pipe(
    Layer.provideMerge(sqliteNodeLayer(options.filename)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
