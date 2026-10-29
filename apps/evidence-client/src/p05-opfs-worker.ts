/**
 * OPFS worker for the P05 wasm log store.
 */
import './p02-opfs-import-meta.ts'
import * as OpfsWorker from '@effect/sql-sqlite-wasm/OpfsWorker'
import * as Effect from 'effect/Effect'
import { workerPort } from '@viviefs/store-sqlite-wasm'

const port = workerPort()

Effect.runFork(
  OpfsWorker.run({
    port,
    dbName: self.name || 'viviefs-p05.sqlite',
  }),
)
