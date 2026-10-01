/**
 * Schema at every boundary, SQL rows included (D26, D79). A statement's rows
 * are decoded by a row Schema, never asserted with `sql<T>`. A row that does
 * not decode is a store this code cannot read, so it fails as the store's own
 * error type: a `SqlError` whose reason carries the Schema issue.
 */
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { SqlError, UnknownError } from 'effect/unstable/sql/SqlError'

export const rowsOf = <S extends Schema.Decoder<unknown>>(row: S) => {
  const decode = Schema.decodeUnknownEffect(Schema.Array(row))
  return <E, R>(
    statement: Effect.Effect<ReadonlyArray<unknown>, E, R>,
  ): Effect.Effect<ReadonlyArray<S['Type']>, E | SqlError, R> =>
    statement.pipe(
      Effect.flatMap((rows) =>
        decode(rows).pipe(
          Effect.mapError(
            (cause) =>
              new SqlError({
                reason: new UnknownError({ cause, message: 'A row did not decode', operation: 'decodeRows' }),
              }),
          ),
        ),
      ),
    )
}

/**
 * A numeric column as the drivers return it: a number (SQLite), a bigint, or
 * a string (Postgres `bigint`). Callers convert with `Number`.
 */
export const SqlNumber = Schema.Union([Schema.Number, Schema.BigInt, Schema.String])

/** A row of the `datoms` table. */
export const DatomRow = Schema.Struct({
  seq: SqlNumber,
  e: Schema.String,
  a: Schema.String,
  v: Schema.String,
  tx: Schema.String,
  op: Schema.Literals(['assert', 'retract']),
  cs: Schema.String,
})
