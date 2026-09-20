import * as Effect from 'effect/Effect'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'

const migrateSqlite = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS datoms (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    v TEXT NOT NULL,
    tx TEXT NOT NULL UNIQUE,
    op TEXT NOT NULL,
    cs TEXT NOT NULL
  )`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_eavt ON datoms (e, a, v, tx)`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_aevt ON datoms (a, e, v, tx)`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_cs ON datoms (cs)`
  yield* sql`CREATE TABLE IF NOT EXISTS changesets (
    cs TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    device TEXT NOT NULL,
    lease_epoch INTEGER,
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    sampled INTEGER NOT NULL,
    command TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS hlc_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_pt INTEGER NOT NULL,
    last_c INTEGER NOT NULL,
    last_tx TEXT NOT NULL,
    offset_ms INTEGER NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS device_cursors (
    device TEXT PRIMARY KEY,
    seq INTEGER NOT NULL
  )`
})

const migratePg = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS datoms (
    seq BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    v TEXT NOT NULL,
    tx TEXT NOT NULL UNIQUE,
    op TEXT NOT NULL,
    cs TEXT NOT NULL
  )`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_eavt ON datoms (e, a, v, tx)`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_aevt ON datoms (a, e, v, tx)`
  yield* sql`CREATE INDEX IF NOT EXISTS datoms_cs ON datoms (cs)`
  yield* sql`CREATE TABLE IF NOT EXISTS changesets (
    cs TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    device TEXT NOT NULL,
    lease_epoch INTEGER,
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    sampled INTEGER NOT NULL,
    command TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS hlc_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_pt BIGINT NOT NULL,
    last_c INTEGER NOT NULL,
    last_tx TEXT NOT NULL,
    offset_ms BIGINT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS device_cursors (
    device TEXT PRIMARY KEY,
    seq BIGINT NOT NULL
  )`
})

/**
 * Creates the P04 log-store tables. Column names are pinned here (D58
 * `changesets` plus the datoms / hlc_state / device_cursors tables).
 */
export const migrateLogStore: Effect.Effect<
  void,
  SqlError,
  SqlClient.SqlClient
> = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.onDialectOrElse({
    sqlite: () => migrateSqlite,
    pg: () => migratePg,
    orElse: () => migrateSqlite,
  })
})
