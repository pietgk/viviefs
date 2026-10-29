import { sqliteWasmLogStore } from '@viviefs/store-sqlite-wasm'
import * as Effect from 'effect/Effect'

export const p04LogStore = (deviceId: string) => {
  const dbName = `viviefs-p04-${Date.now()}.sqlite`
  return sqliteWasmLogStore({
    deviceId,
    worker: Effect.acquireRelease(
      Effect.sync(
        () =>
          new Worker(new URL('./p04-opfs-worker.ts', import.meta.url), {
            type: 'module',
            name: dbName,
          }),
      ),
      (worker) => Effect.sync(() => worker.terminate()),
    ),
  })
}
