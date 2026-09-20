import * as Effect from 'effect/Effect'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'

const migrateSqlite = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS projected_facts (
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    v TEXT NOT NULL,
    op TEXT NOT NULL,
    cs TEXT NOT NULL,
    commit_tx TEXT NOT NULL,
    member_tx TEXT NOT NULL,
    commit_seq INTEGER NOT NULL,
    PRIMARY KEY (e, a, v, cs)
  )`
  yield* sql`CREATE INDEX IF NOT EXISTS projected_facts_ea ON projected_facts (e, a)`
  yield* sql`CREATE TABLE IF NOT EXISTS projection_conflicts (
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    payload TEXT NOT NULL,
    tx TEXT NOT NULL,
    cs TEXT NOT NULL,
    PRIMARY KEY (e, a, tx)
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS changeset_status (
    cs TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    commit_tx TEXT,
    basis INTEGER,
    actor TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS projection_cursor (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    seq INTEGER NOT NULL
  )`
})

const migratePg = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS projected_facts (
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    v TEXT NOT NULL,
    op TEXT NOT NULL,
    cs TEXT NOT NULL,
    commit_tx TEXT NOT NULL,
    member_tx TEXT NOT NULL,
    commit_seq BIGINT NOT NULL,
    PRIMARY KEY (e, a, v, cs)
  )`
  yield* sql`CREATE INDEX IF NOT EXISTS projected_facts_ea ON projected_facts (e, a)`
  yield* sql`CREATE TABLE IF NOT EXISTS projection_conflicts (
    e TEXT NOT NULL,
    a TEXT NOT NULL,
    payload TEXT NOT NULL,
    tx TEXT NOT NULL,
    cs TEXT NOT NULL,
    PRIMARY KEY (e, a, tx)
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS changeset_status (
    cs TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    commit_tx TEXT,
    basis BIGINT,
    actor TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS projection_cursor (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    seq BIGINT NOT NULL
  )`
})

/** P05 read-model tables. Disposable: rebuilt from the log, never migrated. */
export const migrateReadModels: Effect.Effect<
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
