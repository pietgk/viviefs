import { sqliteNativeLogStore } from '@viviefs/store-sqlite-native'

export const p05LogStore = (deviceId: string) =>
  sqliteNativeLogStore({
    filename: `viviefs-p05-${Date.now()}.db`,
    deviceId,
  })
