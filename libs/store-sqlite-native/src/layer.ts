/**
 * Official native SQLite driver: `@effect/sql-sqlite-react-native` on
 * op-sqlite 18.2.5. P02 exemplar of the native log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Layer from 'effect/Layer'

export const sqliteNativeLayer = (filename: string) =>
  SqliteClient.layer({ filename })

export const sqliteNativeLogStore = (options: {
  filename: string
  deviceId: string
}) =>
  logStoreLayer.pipe(
    Layer.provide(sqliteNativeLayer(options.filename)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
