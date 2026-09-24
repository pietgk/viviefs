/**
 * Postgres log store. P04 qualifies the postgres dialect via
 * `@effect/sql-pglite` (WASM Postgres, Apache-2.0). Hosted `@effect/sql-pg`
 * is the same LogStore SQL when a server is admitted.
 */
import { PGlite } from '@electric-sql/pglite'
import * as PgliteClient from '@effect/sql-pglite/PgliteClient'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { SqlError, ConnectionError } from 'effect/unstable/sql/SqlError'

/**
 * PGlite owned by this layer. `PGlite.close()` (0.5.8) does not wait for
 * its own query mutex. When a fiber is interrupted mid-query, the Effect
 * client hands back its permit while PGlite is still running the query; a
 * close at that moment shuts Postgres down under the live query and the
 * WASM spins on the main thread, so no timer (and no timeout) fires again.
 * Release waits for in-flight queries, then closes.
 */
const ownedPglite = (dataDir: string | undefined) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const pg = new PGlite(dataDir === undefined ? {} : { dataDir })
        await pg.waitReady
        return pg
      },
      catch: (cause) =>
        new SqlError({
          reason: new ConnectionError({
            cause,
            message: 'PGlite: failed to open',
            operation: 'connect',
          }),
        }),
    }),
    (pg) =>
      Effect.promise(async () => {
        // Queued behind any in-flight query on PGlite's own mutex.
        await pg.query('SELECT 1')
        await pg.close()
      }),
  )

const pgliteClientLayer = (dataDir: string | undefined) =>
  PgliteClient.layerFrom(
    ownedPglite(dataDir).pipe(
      Effect.flatMap((liveClient) => PgliteClient.make({ liveClient })),
    ),
  )

export const pgliteLayer = pgliteClientLayer(undefined)

export const pgliteLogStore = (options: {
  deviceId: string
  dataDir?: string
}) =>
  logStoreLayer.pipe(
    Layer.provideMerge(pgliteClientLayer(options.dataDir)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )
