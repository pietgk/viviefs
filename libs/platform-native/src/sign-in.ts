/**
 * `@viviefs/platform-native/sign-in`: the Expo ports of the OIDC sign-in
 * session (ADR-0022). Kept out of the package root so an app that does not
 * sign in does not bundle `expo-auth-session`.
 *
 * - `expoAuthorizationPrompt`: the login page through `expo-auth-session`,
 *   authorization code with PKCE (S256). iOS uses an ephemeral
 *   `ASWebAuthenticationSession`: no cookies shared with Safari, so a signed
 *   out person is not silently signed back in, and no consent alert. Every
 *   sign-in asks for the password (`prompt=login`), because on a shared
 *   device the next person must not inherit the last one's provider session.
 * - `secureStoreSignInVault`: the session in the platform's secure storage
 *   (Keychain, Android Keystore), readable only on this device after the
 *   first unlock (Q9). On web use `memorySignInVault` from
 *   `@viviefs/identity`: tokens never touch `localStorage`.
 * - `completeWebSignIn`: call at app start on web. In the popup the login
 *   page redirected to, it hands the result to the app and closes.
 */
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import {
  AuthorizationPrompt,
  SignInFailed,
  SignInVault,
} from '@viviefs/identity'
import { AuthRequest, Prompt, ResponseType } from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'

export const expoAuthorizationPrompt = (options: {
  readonly redirectUri: string
}): Layer.Layer<AuthorizationPrompt> =>
  Layer.succeed(
    AuthorizationPrompt,
    AuthorizationPrompt.of({
      authorize: (request) =>
        Effect.gen(function* () {
          const auth = new AuthRequest({
            clientId: request.clientId,
            redirectUri: options.redirectUri,
            scopes: [...request.scopes],
            responseType: ResponseType.Code,
            usePKCE: true,
            prompt: Prompt.Login,
          })
          const result = yield* Effect.tryPromise({
            try: () =>
              auth.promptAsync(
                { authorizationEndpoint: request.authorizationEndpoint },
                { preferEphemeralSession: true },
              ),
            catch: (cause) => new SignInFailed({ reason: String(cause) }),
          })
          if (result.type === 'error') {
            return yield* new SignInFailed({
              reason: result.error?.code ?? result.params['error'] ?? 'error',
            })
          }
          if (result.type !== 'success') {
            return yield* new SignInFailed({ reason: result.type })
          }
          const code = result.params['code']
          if (code === undefined || auth.codeVerifier === undefined) {
            return yield* new SignInFailed({ reason: 'no authorization code' })
          }
          return {
            code,
            codeVerifier: auth.codeVerifier,
            redirectUri: options.redirectUri,
          }
        }).pipe(Effect.withSpan('AuthorizationPrompt.authorize')),
    }),
  )

export const secureStoreSignInVault = (key: string): Layer.Layer<SignInVault> => {
  const options = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  }
  return Layer.succeed(
    SignInVault,
    SignInVault.of({
      load: Effect.promise(() => SecureStore.getItemAsync(key, options)).pipe(
        Effect.map(Option.fromNullishOr),
      ),
      save: (encoded) =>
        Effect.promise(() => SecureStore.setItemAsync(key, encoded, options)),
      clear: Effect.promise(() => SecureStore.deleteItemAsync(key, options)),
    }),
  )
}

/** True in the web popup that only finished a sign-in; it closes itself. */
export const completeWebSignIn = (): boolean =>
  WebBrowser.maybeCompleteAuthSession().type === 'success'
