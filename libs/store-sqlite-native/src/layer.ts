/**
 * Official native SQLite driver: `@effect/sql-sqlite-react-native` on
 * op-sqlite 18.2.5. P02 exemplar of the native log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient'
import * as OpSqlite from '@op-engineering/op-sqlite'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'

export const sqliteNativeLayer = (filename: string) =>
  SqliteClient.layer({ filename })

export const sqliteNativeLogStore = (options: {
  filename: string
  deviceId: string
}) =>
  logStoreLayer.pipe(
    Layer.provideMerge(sqliteNativeLayer(options.filename)),
    Layer.provide(cryptoEntropy),
    Layer.provide(deviceLayer(options.deviceId)),
  )

export class DatabaseNotDeleted extends Schema.TaggedError<DatabaseNotDeleted>()(
  'DatabaseNotDeleted',
  { filename: Schema.String, reason: Schema.String },
) {}

// op-sqlite 18.2.5's declarations re-export without file extensions, which
// `nodenext` resolution cannot follow, so its named exports look empty to
// TypeScript. The runtime module has them; name the one this file needs.
// eslint-disable-next-line no-restricted-syntax -- D79 exception: op-sqlite's published declarations cannot be resolved (above); this names the one runtime export used.
const { open } = OpSqlite as unknown as {
  readonly open: (options: { readonly name: string }) => {
    readonly delete: () => void
  }
}

/**
 * Deletes a database file. Its log store must be closed first; op-sqlite
 * opens the file once more only to remove it.
 */
export const deleteSqliteNativeDatabase = (
  filename: string,
): Effect.Effect<void, DatabaseNotDeleted> =>
  Effect.try({
    try: () => open({ name: filename }).delete(),
    catch: (cause) =>
      new DatabaseNotDeleted({ filename, reason: String(cause) }),
  })
