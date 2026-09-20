import { sqliteWasmOpfsLayer } from '@viviefs/store-sqlite-wasm'
import * as Effect from 'effect/Effect'

export const officialSqliteLayer = (filename: string) =>
  sqliteWasmOpfsLayer(
    Effect.acquireRelease(
      Effect.sync(
        () =>
          new Worker(new URL('./p02-opfs-worker.ts', import.meta.url), {
            type: 'module',
            name: filename,
          }),
      ),
      (worker) => Effect.sync(() => worker.terminate()),
    ),
  )
