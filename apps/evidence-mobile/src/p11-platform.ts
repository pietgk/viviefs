/**
 * P11 on iOS and Android: the session in secure storage with an offline
 * refresh token (Q9), the app's scheme as the redirect, and one SQLite file
 * per local replica.
 */
import * as Layer from 'effect/Layer'
import { sqliteNativeLogStore, deleteSqliteNativeDatabase } from '@viviefs/store-sqlite-native'
import {
  expoAuthorizationPrompt,
  secureStoreSignInVault,
} from '@viviefs/platform-native/sign-in'

export const P11_SCOPES = ['openid', 'offline_access'] as const

export const p11SignInPorts = (run: string) =>
  Layer.mergeAll(
    expoAuthorizationPrompt({ redirectUri: 'viviefs-evidence://auth' }),
    secureStoreSignInVault(`viviefs.sign-in.${run}`),
  )

export const p11ReplicaStore = (name: string, deviceId: string) =>
  sqliteNativeLogStore({ filename: `${name}.db`, deviceId })

export const deleteP11Replica = (name: string) =>
  deleteSqliteNativeDatabase(`${name}.db`)

/** Nothing to finish on a device: the redirect returns to the app itself. */
export const finishWebSignIn = (): boolean => false
