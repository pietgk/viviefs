import { sqliteNativeLayer } from '@viviefs/store-sqlite-native'

export const officialSqliteLayer = (filename: string) =>
  sqliteNativeLayer(filename)
