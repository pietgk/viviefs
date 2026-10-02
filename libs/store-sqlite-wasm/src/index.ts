/**
 * Web SQLite log store: `@effect/sql-sqlite-wasm` with OPFS.
 *
 * Guide: apps/docs/src/content/docs/guides/log-store/index.mdx
 */
export { sqliteWasmOpfsLayer, sqliteWasmLogStore } from './layer.ts'
export {
  DatabaseNotDeleted,
  OPFS_MAX_NAME_LENGTH,
  deleteOpfsDatabase,
  runOpfsWorker,
  workerPort,
  type OpfsWorkerFactory,
  type WorkerPort,
} from './opfs.ts'
