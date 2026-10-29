/**
 * OPFS worker for `@effect/sql-sqlite-wasm`. P02 web official driver.
 */
import './p02-opfs-import-meta.ts'
import * as OpfsWorker from '@effect/sql-sqlite-wasm/OpfsWorker'
import * as Effect from 'effect/Effect'
import { workerPort } from '@viviefs/store-sqlite-wasm'

const port = workerPort()

Effect.runFork(
  OpfsWorker.run({
    port,
    dbName: 'viviefs-p02.sqlite',
  }),
)
