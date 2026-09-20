/**
 * Official web SQLite driver: `@effect/sql-sqlite-wasm` over an OPFS worker.
 * P02 exemplar of the wasm log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-wasm/SqliteClient'
import type * as Effect from 'effect/Effect'
import type * as Scope from 'effect/Scope'

export const sqliteWasmOpfsLayer = (
  worker: Effect.Effect<Worker, never, Scope.Scope>,
) => SqliteClient.layer({ worker })
