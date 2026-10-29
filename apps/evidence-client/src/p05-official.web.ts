import { sqliteWasmLogStore } from '@viviefs/store-sqlite-wasm'
import * as Effect from 'effect/Effect'

export const p05LogStore = (deviceId: string) => {
  const dbName = `viviefs-p05-${Date.now()}.sqlite`
  return sqliteWasmLogStore({
    deviceId,
    worker: Effect.acquireRelease(
      Effect.sync(
        () =>
          new Worker(new URL('./p05-opfs-worker.ts', import.meta.url), {
            type: 'module',
            name: dbName,
          }),
      ),
      (worker) => Effect.sync(() => worker.terminate()),
    ),
  })
}
