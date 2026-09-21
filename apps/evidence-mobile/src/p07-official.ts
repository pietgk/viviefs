import { sqliteNativeLogStore } from '@viviefs/store-sqlite-native'

export const p07LogStore = (deviceId: string) =>
  sqliteNativeLogStore({
    filename: process.env.EXPO_PUBLIC_P07_DB ?? 'viviefs-p07.db',
    deviceId,
  })
