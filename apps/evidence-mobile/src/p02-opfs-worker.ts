/**
 * OPFS worker for `@effect/sql-sqlite-wasm`. P02 web official driver.
 */
import './p02-opfs-import-meta.ts'
import * as OpfsWorker from '@effect/sql-sqlite-wasm/OpfsWorker'
import * as Effect from 'effect/Effect'

const port = self as unknown as MessagePort &
  EventTarget & { close: () => void }

Effect.runFork(
  OpfsWorker.run({
    port,
    dbName: 'viviefs-p02.sqlite',
  }),
)
