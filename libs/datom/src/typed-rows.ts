/**
 * The typed reference read model (D121, D210): one table per entity type, one
 * column per attribute, with the column type derived from the attribute's
 * value Schema (D209). Disposable: when the catalog's tables change, they are
 * dropped and rebuilt from the log, never migrated (D44).
 */
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as SqlClient from 'effect/sql/SqlClient'
import type { SqlError } from 'effect/sql/SqlError'
import type { Catalog, EntityTypeSpec } from './catalog.ts'
import { rowsOf } from './rows.ts'
import {
  columnType,
  decodeText,
  fromColumn,
  toColumn,
  type ColumnImplementation,
} from './values.ts'

/** One visible entity: its typed values, and which attributes are in conflict (D211). */
export type EntityRow = {
  readonly e: string
  readonly conflicts: ReadonlyArray<string>
  readonly values: Readonly<Record<string, unknown>>
}

/** A row as the projector writes it: canonical text per attribute. */
export type RowTexts = {
  readonly e: string
  readonly conflicts: ReadonlyArray<string>
  readonly texts: Readonly<Record<string, string>>
}

export type RowRead = {
  readonly type: string
  readonly prefix?: string
  readonly orderBy?: string
}

const ShapeRow = Schema.Struct({ statements: Schema.String })
const StoredShape = Schema.fromJsonString(
  Schema.Struct({
    tables: Schema.Array(Schema.String),
    statements: Schema.Array(Schema.String),
  }),
)

/** A table's row: its key, its conflicts, and a column per attribute. */
const StoredRow = Schema.StructWithRest(
  Schema.Struct({
    e: Schema.String,
    conflicts: Schema.fromJsonString(Schema.Array(Schema.String)),
  }),
  [Schema.Record(Schema.String, Schema.Unknown)],
)

const tableOf = (type: EntityTypeSpec): string => `rm_${type.name}`

const quoted = (name: string): string => `"${name.replaceAll('"', '""')}"`

const createStatement = (
  type: EntityTypeSpec,
  implementation: ColumnImplementation,
): string => {
  // Byte order on Postgres too, so text sorts as it does on SQLite (D110).
  const collated = (column: string) =>
    implementation === 'postgres' && column === 'TEXT'
      ? 'TEXT COLLATE "C"'
      : column
  const columns = type.attributes.map(
    (spec) =>
      `${quoted(spec.name)} ${collated(columnType(spec.value, implementation))}`,
  )
  return `CREATE TABLE ${quoted(tableOf(type))} (e ${collated('TEXT')} PRIMARY KEY, conflicts TEXT NOT NULL, ${columns.join(', ')})`
}

const rangeOf = (prefix: string) => {
  const under = prefix.endsWith('/') ? prefix : `${prefix}/`
  // `0` is the character after `/`, so this is every id under the prefix.
  return { exact: under.slice(0, -1), from: under, to: `${under.slice(0, -1)}0` }
}

export const makeTypedTables = (catalog: Catalog) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const implementation = yield* sql.onDialectOrElse({
      sqlite: () => Effect.succeed<ColumnImplementation>('sqlite'),
      pg: () => Effect.succeed<ColumnImplementation>('postgres'),
      orElse: () => Effect.succeed<ColumnImplementation>('sqlite'),
    })
    const byName = new Map(catalog.types.map((type) => [type.name, type]))
    const tables = catalog.types.map(tableOf)
    const statements = catalog.types.map((type) =>
      createStatement(type, implementation),
    )
    const shape = JSON.stringify({ tables, statements })

    /** Creates the tables. True when they are new, so the log must be replayed. */
    const ensure: Effect.Effect<boolean, SqlError> = sql.withTransaction(
      Effect.gen(function* () {
        const stored = yield* sql`
          SELECT statements FROM read_model_shape WHERE id = 1
        `.pipe(rowsOf(ShapeRow))
        const current = stored[0]?.statements
        if (current === shape) return false
        const previous = current
          ? (yield* Schema.decodeUnknownEffect(StoredShape)(current).pipe(
              Effect.orDie,
            )).tables
          : []
        for (const table of new Set([...previous, ...tables])) {
          yield* sql.unsafe(`DROP TABLE IF EXISTS ${quoted(table)}`)
        }
        for (const statement of statements) {
          yield* sql.unsafe(statement)
        }
        yield* sql`
          INSERT INTO read_model_shape (id, statements) VALUES (1, ${shape})
          ON CONFLICT (id) DO UPDATE SET statements = ${shape}
        `
        return true
      }),
    )

    const clear = Effect.gen(function* () {
      for (const table of tables) {
        yield* sql`DELETE FROM ${sql(table)}`
      }
    })

    const replace = (
      type: EntityTypeSpec,
      entity: string,
      row: RowTexts | null,
    ) =>
      Effect.gen(function* () {
        const table = sql(tableOf(type))
        yield* sql`DELETE FROM ${table} WHERE e = ${entity}`
        if (!row) return
        const columns: Record<string, string | number | boolean> = {
          e: row.e,
          conflicts: JSON.stringify(row.conflicts),
        }
        for (const spec of type.attributes) {
          const text = row.texts[spec.name]
          if (text !== undefined) {
            columns[spec.name] = toColumn(spec.value, implementation, text)
          }
        }
        yield* sql`INSERT INTO ${table} ${sql.insert(columns)}`
      })

    const read = (query: RowRead) =>
      Effect.gen(function* () {
        const type = byName.get(query.type)
        if (!type) return []
        const range = query.prefix ? rangeOf(query.prefix) : null
        const where = range
          ? sql`WHERE e = ${range.exact} OR (e >= ${range.from} AND e < ${range.to})`
          : sql.literal('')
        const order = query.orderBy
          ? sql`ORDER BY ${sql(query.orderBy)} IS NULL, ${sql(query.orderBy)}, e`
          : sql`ORDER BY e`
        const rows = yield* sql`
          SELECT * FROM ${sql(tableOf(type))} ${where} ${order}
        `.pipe(rowsOf(StoredRow))
        return rows.map((stored): EntityRow => {
          const values: Record<string, unknown> = {}
          for (const spec of type.attributes) {
            const raw = stored[spec.name]
            if (raw === null || raw === undefined) continue
            const value = fromColumn(spec.value, implementation, raw)
            if (Option.isSome(value)) values[spec.name] = value.value
          }
          return { e: stored.e, conflicts: stored.conflicts, values }
        })
      })

    /**
     * The same answer as `read` for rows that are not in a table, such as the
     * draft view: decoded the same way, in the same order (D110).
     */
    const fromTexts = (
      query: RowRead,
      rows: ReadonlyArray<RowTexts>,
    ): ReadonlyArray<EntityRow> => {
      const type = byName.get(query.type)
      if (!type) return []
      const sortKey = (row: RowTexts) => {
        const spec = type.attributes.find(
          (attribute) => attribute.name === query.orderBy,
        )
        const text = query.orderBy ? row.texts[query.orderBy] : undefined
        return spec && text !== undefined
          ? toColumn(spec.value, implementation, text)
          : null
      }
      return rows
        .slice()
        .sort((left, right) => {
          const a = sortKey(left)
          const b = sortKey(right)
          if (a !== b) {
            if (a === null) return 1
            if (b === null) return -1
            return a < b ? -1 : 1
          }
          return left.e < right.e ? -1 : left.e > right.e ? 1 : 0
        })
        .map((row): EntityRow => {
          const values: Record<string, unknown> = {}
          for (const spec of type.attributes) {
            const text = row.texts[spec.name]
            if (text === undefined) continue
            const value = decodeText(spec.value, text)
            if (Option.isSome(value)) values[spec.name] = value.value
          }
          return { e: row.e, conflicts: row.conflicts, values }
        })
    }

    return { ensure, clear, replace, read, fromTexts }
  })
