/**
 * P02 fallback probe: a minimal `SqlClient` over expo-sqlite.
 * Retained; used only if the official drivers fail. Not the shipped adapter.
 */
import * as SQLite from 'expo-sqlite'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { identity } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Semaphore from 'effect/Semaphore'
import * as Stream from 'effect/Stream'
import * as Reactivity from 'effect/unstable/reactivity/Reactivity'
import * as Client from 'effect/unstable/sql/SqlClient'
import type { Connection } from 'effect/unstable/sql/SqlConnection'
import { classifySqliteError, SqlError } from 'effect/unstable/sql/SqlError'
import * as Statement from 'effect/unstable/sql/Statement'

const ATTR_DB_SYSTEM_NAME = 'db.system.name'

const classifyError = (cause: unknown, message: string, operation: string) =>
  classifySqliteError(cause, { message, operation })

const returnsRows = (sql: string): boolean => {
  const head = sql.trim().replace(/^\(/, '').slice(0, 32).toUpperCase()
  return (
    head.startsWith('SELECT') ||
    head.startsWith('EXPLAIN') ||
    head.startsWith('PRAGMA') ||
    head.startsWith('WITH') ||
    head.startsWith('VALUES')
  )
}

export const expoSqliteLayer = (filename: string) =>
  Layer.effectContext(
    Effect.gen(function* () {
      const compiler = Statement.makeCompilerSqlite()
      const makeConnection = Effect.gen(function* () {
        const db = yield* Effect.acquireRelease(
          Effect.tryPromise({
            try: () =>
              SQLite.openDatabaseAsync(filename, { useNewConnection: true }),
            catch: (cause) =>
              new SqlError({
                reason: classifyError(cause, 'Failed to open database', 'open'),
              }),
          }),
          (opened) =>
            Effect.promise(() => opened.closeAsync()).pipe(Effect.orDie),
        )
        yield* Effect.tryPromise({
          try: () => db.execAsync('PRAGMA busy_timeout = 5000'),
          catch: (cause) =>
            new SqlError({
              reason: classifyError(
                cause,
                'Failed to set busy_timeout',
                'execute',
              ),
            }),
        })

        const run = (
          query: string,
          params: ReadonlyArray<unknown> = [],
        ): Effect.Effect<Array<Record<string, unknown>>, SqlError> =>
          Effect.tryPromise({
            try: async () => {
              if (returnsRows(query)) {
                return params.length === 0
                  ? ((await db.getAllAsync(query)) as Array<
                      Record<string, unknown>
                    >)
                  : ((await db.getAllAsync(
                      query,
                      params as SQLite.SQLiteBindParams,
                    )) as Array<Record<string, unknown>>)
              }
              // DDL and empty-bind writes go through exec/run without an empty
              // array bind bag: Android prepare_v2 rejects that shape.
              if (params.length === 0) {
                await db.execAsync(query)
                return []
              }
              await db.runAsync(query, params as SQLite.SQLiteBindParams)
              return []
            },
            catch: (cause) =>
              new SqlError({
                reason: classifyError(
                  cause,
                  `Failed to execute statement (${query.trim().slice(0, 80)}): ${String(cause)}`,
                  'execute',
                ),
              }),
          })

        const runValues = (
          query: string,
          params: ReadonlyArray<unknown> = [],
        ): Effect.Effect<Array<Array<unknown>>, SqlError> =>
          Effect.map(run(query, params), (rows) =>
            rows.map((row) => Object.values(row)),
          )

        return identity<Connection>({
          execute(query, params, transformRows) {
            return transformRows
              ? Effect.map(run(query, params), transformRows)
              : run(query, params)
          },
          executeRaw(query, params) {
            return run(query, params)
          },
          executeValues(query, params) {
            return runValues(query, params)
          },
          executeValuesUnprepared(query, params) {
            return runValues(query, params)
          },
          executeUnprepared(query, params, transformRows) {
            return this.execute(query, params, transformRows)
          },
          executeStream() {
            return Stream.die('executeStream not implemented')
          },
        })
      })

      const semaphore = yield* Semaphore.make(1)
      const connection = yield* makeConnection
      const acquirer = semaphore.withPermits(1)(Effect.succeed(connection))
      const client = yield* Client.make({
        acquirer,
        compiler,
        transactionAcquirer: acquirer,
        spanAttributes: [[ATTR_DB_SYSTEM_NAME, 'sqlite']],
      })
      return Context.make(Client.SqlClient, client)
    }),
  ).pipe(Layer.provide(Reactivity.layer))
