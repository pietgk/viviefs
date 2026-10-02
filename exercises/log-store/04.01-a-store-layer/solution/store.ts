import { join } from 'node:path'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import { sqliteNodeLayer } from '@viviefs/store-sqlite-node'
import * as Layer from 'effect/Layer'

/**
 * A log store on node:sqlite, built from its parts: the shared `LogStore`
 * over a `SqlClient`, the system's randomness and this replica's device id.
 * `directory` is where this store may keep its files.
 */
export const logStoreIn = (directory: string, deviceId: string) =>
  logStoreLayer.pipe(
    // A file outlives the process; `:memory:` is gone at every restart.
    Layer.provideMerge(sqliteNodeLayer(join(directory, 'log.sqlite'))),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(deviceId)),
  )
