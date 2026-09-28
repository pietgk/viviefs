/**
 * P11 positive controls: lab-only defects the probe switches on with
 * `EXPO_PUBLIC_P11_CONTROL` to show that a device check can fail (as P07
 * does with `EXPO_PUBLIC_P07_SWEEP`). Each one is a mistake a real app could
 * make; the evidence app is the only place the switch exists.
 *
 * - `ignore-invalid-grant`: the session treats a refused refresh as a
 *   provider that did not answer, so it never asks to sign in again
 *   (check 10 must fail).
 * - `shared-replica`: every provider account opens the same local replica
 *   (check 11 must fail).
 * - `persistent-web-vault`: web keeps the session in `localStorage`, which
 *   Q9 forbids (token storage must fail on web).
 */
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as HttpClient from 'effect/unstable/http/HttpClient'
import { SignInVault } from '@viviefs/identity'

export const P11_CONTROLS = [
  'ignore-invalid-grant',
  'shared-replica',
  'persistent-web-vault',
] as const
export type P11Control = (typeof P11_CONTROLS)[number]

// Expo inlines `process.env.EXPO_PUBLIC_*` only when read by its full name.
const requested = process.env.EXPO_PUBLIC_P11_CONTROL ?? ''

export const P11_CONTROL: P11Control | null = P11_CONTROLS.includes(requested as P11Control)
  ? (requested as P11Control)
  : null

/**
 * The identity provider's HTTP client with its OAuth refusals (400, 401)
 * turned into transport failures, as a session that ignores `invalid_grant`
 * would see them.
 */
export const refusalsIgnored: Layer.Layer<HttpClient.HttpClient, never, HttpClient.HttpClient> =
  Layer.effect(
    HttpClient.HttpClient,
    Effect.map(HttpClient.HttpClient, (client) =>
      HttpClient.filterStatus(client, (status) => status !== 400 && status !== 401),
    ),
  )

/** The session in `localStorage`: it survives a reload, and any script can read it. */
export const localStorageVault = (key: string): Layer.Layer<SignInVault> =>
  Layer.succeed(
    SignInVault,
    SignInVault.of({
      load: Effect.sync(() => Option.fromNullishOr(globalThis.localStorage.getItem(key))),
      save: (encoded) => Effect.sync(() => globalThis.localStorage.setItem(key, encoded)),
      clear: Effect.sync(() => globalThis.localStorage.removeItem(key)),
    }),
  )
