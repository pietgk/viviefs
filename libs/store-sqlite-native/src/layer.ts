/**
 * Official native SQLite driver: `@effect/sql-sqlite-react-native` on
 * op-sqlite 18.2.5. P02 exemplar of the native log-store adapter.
 */
import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient'

export const sqliteNativeLayer = (filename: string) =>
  SqliteClient.layer({ filename })
