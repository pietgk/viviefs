import { sqliteNativeLogStore } from '@viviefs/store-sqlite-native'

export const p04LogStore = (deviceId: string) =>
  sqliteNativeLogStore({
    filename: `viviefs-p04-${Date.now()}.db`,
    deviceId,
  })
