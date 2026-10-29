/**
 * P11 on web: tokens in memory only (Q9; never `localStorage`), the app's
 * own origin as the redirect, and one OPFS database per local replica.
 */
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { memorySignInVault, type SignInVault } from '@viviefs/identity'
import {
  completeWebSignIn,
  expoAuthorizationPrompt,
} from '@viviefs/platform-native/sign-in'
import {
  deleteOpfsDatabase,
  sqliteWasmLogStore,
} from '@viviefs/store-sqlite-wasm'

export const P11_SCOPES = ['openid'] as const

export const p11AuthorizationPrompt = expoAuthorizationPrompt({
  redirectUri: `${globalThis.location.origin}/auth`,
})

/** Web keeps no session across a reload, so the run needs no key of its own. */
export const p11SignInVault = (): Layer.Layer<SignInVault> => memorySignInVault

const opfsWorker = (name: string) =>
  new Worker(new URL('./p11-opfs-worker.ts', import.meta.url), {
    type: 'module',
    name,
  })

export const p11ReplicaStore = (name: string, deviceId: string) =>
  sqliteWasmLogStore({
    deviceId,
    worker: Effect.acquireRelease(
      Effect.sync(() => opfsWorker(`${name}.sqlite`)),
      (worker) => Effect.sync(() => worker.terminate()),
    ),
  })

export const deleteP11Replica = (name: string) =>
  deleteOpfsDatabase(opfsWorker, `${name}.sqlite`)

/** True in the popup the login page redirected to; it closes itself. */
export const finishWebSignIn = completeWebSignIn
