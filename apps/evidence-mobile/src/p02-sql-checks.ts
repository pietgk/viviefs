/**
 * P02 SQL driver checks. Same program on every driver (op-sqlite, wasm+OPFS,
 * expo-sqlite fallback). Probe tables only; not the log-store schema (P04).
 */
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Migrator from 'effect/unstable/sql/Migrator'
import * as SqlClient from 'effect/unstable/sql/SqlClient'

class RollbackBoom extends Schema.TaggedError<RollbackBoom>()(
  'RollbackBoom',
  {},
) {}

export type CheckStatus = 'PASS' | 'FAIL'

export type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
}

export const P02_CHECK_NAMES = [
  'migrate',
  'transaction commit',
  'transaction rollback',
  'eavt by entity',
  'eavt by attribute',
  'index volume',
] as const

export const P02_CHECK_COUNT = P02_CHECK_NAMES.length

export const VOLUME = 1500

const INDEX_NAME = 'idx_probe_datoms_eavt'

export const indexPlanUsesEavt = (plan: unknown): boolean => {
  const text = JSON.stringify(plan).toLowerCase()
  return text.includes(INDEX_NAME) || /using (covering )?index/.test(text)
}

const runCheck = (
  name: string,
  eff: Effect.Effect<unknown, unknown, SqlClient.SqlClient>,
  timeout: `${number} seconds` = '15 seconds',
): Effect.Effect<CheckResult, never, SqlClient.SqlClient> =>
  eff.pipe(
    Effect.timeout(timeout),
    Effect.matchCause({
      onSuccess: (value) => ({
        name,
        status: 'PASS' as const,
        detail: JSON.stringify(value),
      }),
      onFailure: (cause) => ({
        name,
        status: 'FAIL' as const,
        detail: String(cause).split('\n').slice(0, 4).join(' | '),
      }),
    }),
  )

const migrate = Migrator.make({})({
  loader: Migrator.fromRecord({
    '001_probe_datoms': Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`CREATE TABLE probe_datoms (
        e TEXT NOT NULL,
        a TEXT NOT NULL,
        v TEXT NOT NULL,
        tx TEXT NOT NULL,
        op INTEGER NOT NULL,
        PRIMARY KEY (tx)
      )`
      yield* sql`CREATE INDEX IF NOT EXISTS idx_probe_datoms_eavt ON probe_datoms (e, a, v, tx)`
      yield* sql`CREATE INDEX IF NOT EXISTS idx_probe_datoms_aevt ON probe_datoms (a, e, v, tx)`
    }),
  }),
})

export const runSqlDriverChecks = (): Effect.Effect<
  CheckResult[],
  never,
  SqlClient.SqlClient
> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    yield* sql`DROP TABLE IF EXISTS probe_datoms`.pipe(Effect.orDie)
    yield* sql`DROP TABLE IF EXISTS effect_sql_migrations`.pipe(Effect.orDie)
    const checks: CheckResult[] = []

    checks.push(
      yield* runCheck(
        'migrate',
        Effect.gen(function* () {
          const applied = yield* migrate
          const tables = yield* sql<{ name: string }>`
            SELECT name FROM sqlite_master
            WHERE type = 'table' AND name = 'probe_datoms'
          `
          if (tables.length !== 1) {
            throw new Error('probe_datoms missing after migrate')
          }
          return { applied: applied.length, table: tables[0]?.name }
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'transaction commit',
        Effect.gen(function* () {
          yield* sql.withTransaction(
            sql`INSERT INTO probe_datoms (e, a, v, tx, op)
                VALUES ('e-commit', 'title', 'kept', 'tx-commit', 1)`,
          )
          const rows = yield* sql<{ v: string }>`
            SELECT v FROM probe_datoms WHERE e = 'e-commit'
          `
          if (rows[0]?.v !== 'kept') {
            throw new Error(`commit not visible: ${JSON.stringify(rows)}`)
          }
          return rows[0]
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'transaction rollback',
        Effect.gen(function* () {
          yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* sql`INSERT INTO probe_datoms (e, a, v, tx, op)
                  VALUES ('e-rollback', 'title', 'hidden', 'tx-rollback', 1)`
                return yield* new RollbackBoom()
              }),
            )
            .pipe(Effect.flip)
          const rows = yield* sql<{ e: string }>`
            SELECT e FROM probe_datoms WHERE e = 'e-rollback'
          `
          if (rows.length !== 0) {
            throw new Error(`rollback leaked ${rows.length} row(s)`)
          }
          return 'invisible'
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'eavt by entity',
        Effect.gen(function* () {
          yield* sql.withTransaction(
            Effect.gen(function* () {
              yield* sql`INSERT INTO probe_datoms (e, a, v, tx, op) VALUES
                ('e-query', 'title', 'alpha', 'tx-q1', 1),
                ('e-query', 'status', 'open', 'tx-q2', 1),
                ('e-other', 'title', 'beta', 'tx-q3', 1)`
            }),
          )
          const rows = yield* sql<{ a: string; v: string }>`
            SELECT a, v FROM probe_datoms WHERE e = 'e-query' ORDER BY a
          `
          if (rows.length !== 2 || rows[0]?.a !== 'status' || rows[1]?.a !== 'title') {
            throw new Error(`entity query ${JSON.stringify(rows)}`)
          }
          return rows
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'eavt by attribute',
        Effect.gen(function* () {
          const rows = yield* sql<{ e: string; v: string }>`
            SELECT e, v FROM probe_datoms WHERE a = 'title' ORDER BY e
          `
          if (rows.length < 2) {
            throw new Error(`attribute query ${JSON.stringify(rows)}`)
          }
          return rows
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'index volume',
        Effect.gen(function* () {
          const target = 'e-vol-42'
          yield* sql.withTransaction(
            Effect.gen(function* () {
              for (let i = 0; i < VOLUME; i++) {
                yield* sql`INSERT INTO probe_datoms (e, a, v, tx, op)
                  VALUES (${`e-vol-${i}`}, 'payload', ${`v-${i}`}, ${`tx-vol-${i}`}, 1)`
              }
            }),
          )
          const found = yield* sql<{ v: string }>`
            SELECT v FROM probe_datoms WHERE e = ${target} AND a = 'payload'
          `
          if (found[0]?.v !== 'v-42') {
            throw new Error(`volume lookup ${JSON.stringify(found)}`)
          }
          const plan = yield* sql`
            EXPLAIN QUERY PLAN
            SELECT v FROM probe_datoms WHERE e = ${target} AND a = 'payload'
          `
          if (!indexPlanUsesEavt(plan)) {
            throw new Error(`index not used: ${JSON.stringify(plan)}`)
          }
          return { volume: VOLUME, plan }
        }),
        '60 seconds',
      ),
    )

    return checks
  })
