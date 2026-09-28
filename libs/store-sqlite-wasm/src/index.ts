/**
 * Web SQLite log store: `@effect/sql-sqlite-wasm` with OPFS.
 */
export { sqliteWasmOpfsLayer, sqliteWasmLogStore } from './layer.ts'
export {
  DatabaseNotDeleted,
  OPFS_MAX_NAME_LENGTH,
  deleteOpfsDatabase,
  runOpfsWorker,
  type OpfsWorkerFactory,
} from './opfs.ts'
