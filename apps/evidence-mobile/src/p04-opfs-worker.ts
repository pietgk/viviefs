/**
 * OPFS worker for the P04 wasm log store.
 */
import './p02-opfs-import-meta.ts'
import * as OpfsWorker from '@effect/sql-sqlite-wasm/OpfsWorker'
import * as Effect from 'effect/Effect'
import { workerPort } from '@viviefs/store-sqlite-wasm'

const port = workerPort()

Effect.runFork(
  OpfsWorker.run({
    port,
    dbName: self.name || 'viviefs-p04.sqlite',
  }),
)
