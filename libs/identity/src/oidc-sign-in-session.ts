/**
 * A sign-in session against any OIDC provider (ADR-0022, D47): the
 * authorization code flow with PKCE, token refresh, and revocation at sign
 * out. Platform-free: the platform supplies three ports.
 *
 * - `AuthorizationPrompt`: the interactive step. It opens the provider's
 *   login page and returns the code the provider redirected back with, and
 *   the PKCE verifier that goes with it.
 * - `SignInVault`: where the session survives a restart. On iOS and Android
 *   that is the platform's secure storage; on web it is memory (Q9).
 * - `CallerStatements`: the server's statement for an access token (Q22).
 *
 * The device learns its provider account from that statement, never by
 * reading a token: the server verified the token, the device did not.
 *
 * A refresh the provider refuses (`invalid_grant` and other OAuth errors)
 * moves to sign-in needed and keeps the account, its statement and so its
 * local replica and outbox. A provider that does not answer changes nothing
 * (Q10).
 */
import * as Clock from 'effect/Clock'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Schema from 'effect/Schema'
import * as Semaphore from 'effect/Semaphore'
import * as SubscriptionRef from 'effect/SubscriptionRef'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import * as HttpClientResponse from 'effect/http/HttpClientResponse'
import { CallerStatement } from './caller-statement.ts'
import {
  IdentityProviderUnreachable,
  SignInFailed,
  SignInNeeded,
  SignInSession,
  SignInState,
  StatementUnavailable,
} from './sign-in-session.ts'
import type { ProviderAccount } from './token-verifier.ts'

/** What the interactive step returns: an authorization code and its PKCE verifier. */
export type AuthorizationCode = {
  readonly code: string
  readonly codeVerifier: string
  readonly redirectUri: string
}

export class AuthorizationPrompt extends Context.Service<
  AuthorizationPrompt,
  {
    readonly authorize: (request: {
      readonly authorizationEndpoint: string
      readonly clientId: string
      readonly scopes: ReadonlyArray<string>
    }) => Effect.Effect<AuthorizationCode, SignInFailed>
  }
>()('viviefs/identity/AuthorizationPrompt') {}

/** Keeps one encoded session. Losing it only means signing in again. */
export class SignInVault extends Context.Service<
  SignInVault,
  {
    readonly load: Effect.Effect<Option.Option<string>>
    readonly save: (encoded: string) => Effect.Effect<void>
    readonly clear: Effect.Effect<void>
  }
>()('viviefs/identity/SignInVault') {}

/** The server's statement for the account an access token proves. */
export class CallerStatements extends Context.Service<
  CallerStatements,
  {
    readonly fetch: (
      accessToken: string,
    ) => Effect.Effect<CallerStatement, StatementUnavailable>
  }
>()('viviefs/identity/CallerStatements') {}

/** A vault in memory: the session ends with the process (web, Q9). */
export const memorySignInVault: Layer.Layer<SignInVault> = Layer.effect(
  SignInVault,
  Effect.gen(function* () {
    const slot = yield* Ref.make(Option.none<string>())
    return SignInVault.of({
      load: Ref.get(slot),
      save: (encoded) => Ref.set(slot, Option.some(encoded)),
      clear: Ref.set(slot, Option.none()),
    })
  }),
)

/** Refresh this long before the access token expires, in milliseconds. */
export const REFRESH_MARGIN_MS = 10_000

const PROVIDER_TIMEOUT = '15 seconds'
const REVOKE_TIMEOUT = '5 seconds'

const Stored = Schema.Struct({
  state: Schema.Union([
    SignInState.cases.SignedIn,
    SignInState.cases.SignInNeeded,
  ]),
  refreshToken: Schema.NullOr(Schema.String),
})
const StoredJson = Schema.fromJsonString(Stored)
type Stored = typeof Stored.Type

const Discovery = Schema.Struct({
  issuer: Schema.String,
  authorization_endpoint: Schema.String,
  token_endpoint: Schema.String,
  revocation_endpoint: Schema.optionalKey(Schema.String),
})
type Discovery = typeof Discovery.Type

const TokenResponse = Schema.Struct({
  access_token: Schema.String,
  expires_in: Schema.Finite,
  refresh_token: Schema.optionalKey(Schema.String),
})
type TokenResponse = typeof TokenResponse.Type

const OAuthError = Schema.Struct({ error: Schema.String })

/** The provider answered with an OAuth error, such as `invalid_grant`. */
class ProviderRefused extends Schema.TaggedError<ProviderRefused>()(
  'ProviderRefused',
  { error: Schema.String },
) {}

type Access = { readonly token: string; readonly expiresAtMs: number }

const sameAccount = (left: ProviderAccount, right: ProviderAccount) =>
  left.issuer === right.issuer && left.subject === right.subject

export const oidcSignInSession = (options: {
  readonly issuer: string
  readonly clientId: string
  readonly scopes: ReadonlyArray<string>
}): Layer.Layer<
  SignInSession,
  never,
  | HttpClient.HttpClient
  | AuthorizationPrompt
  | SignInVault
  | CallerStatements
> =>
  Layer.effect(
    SignInSession,
    Effect.gen(function* () {
      // Trace context stays inside our own system: the identity provider is
      // a third party, and its CORS rejects the extra headers on web.
      const http = HttpClient.transformResponse(
        yield* HttpClient.HttpClient,
        Effect.provideService(HttpClient.TracerPropagationEnabled, false),
      )
      const prompt = yield* AuthorizationPrompt
      const vault = yield* SignInVault
      const statements = yield* CallerStatements

      const unreachable = (cause: {
        readonly _tag: string
        readonly message: string
      }) =>
        new IdentityProviderUnreachable({
          reason: cause.message.length > 0 ? cause.message : cause._tag,
        })

      const discovered = yield* Ref.make(Option.none<Discovery>())
      const discover = Effect.gen(function* () {
        const cached = yield* Ref.get(discovered)
        if (Option.isSome(cached)) return cached.value
        const document = yield* http
          .get(`${options.issuer}/.well-known/openid-configuration`)
          .pipe(
            Effect.flatMap(HttpClientResponse.filterStatusOk),
            Effect.flatMap(HttpClientResponse.schemaBodyJson(Discovery)),
            Effect.timeout(PROVIDER_TIMEOUT),
            Effect.mapError(unreachable),
          )
        if (document.issuer !== options.issuer) {
          return yield* new IdentityProviderUnreachable({
            reason: `discovery names issuer ${document.issuer}`,
          })
        }
        yield* Ref.set(discovered, Option.some(document))
        return document
      })

      const tokenRequest = (params: Record<string, string>) =>
        Effect.gen(function* () {
          const { token_endpoint } = yield* discover
          const response = yield* HttpClientRequest.post(token_endpoint).pipe(
            HttpClientRequest.acceptJson,
            HttpClientRequest.bodyUrlParams({
              ...params,
              client_id: options.clientId,
            }),
            http.execute,
            Effect.timeout(PROVIDER_TIMEOUT),
            Effect.mapError(unreachable),
          )
          if (response.status === 400 || response.status === 401) {
            const refused = yield* HttpClientResponse.schemaBodyJson(OAuthError)(
              response,
            ).pipe(Effect.mapError(unreachable))
            return yield* new ProviderRefused({ error: refused.error })
          }
          return yield* HttpClientResponse.filterStatusOk(response).pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(TokenResponse)),
            Effect.mapError(unreachable),
          )
        })

      const accessFrom = (tokens: TokenResponse) =>
        Effect.map(
          Clock.currentTimeMillis,
          (now): Access => ({
            token: tokens.access_token,
            expiresAtMs: now + tokens.expires_in * 1000,
          }),
        )

      const restored = yield* vault.load.pipe(
        Effect.map(
          Option.flatMap((encoded) =>
            Schema.decodeUnknownOption(StoredJson)(encoded),
          ),
        ),
      )
      const state = yield* SubscriptionRef.make<SignInState>(
        Option.match(restored, {
          onNone: () => SignInState.cases.SignedOut.make({}),
          onSome: (stored) =>
            stored.refreshToken === null && stored.state._tag === 'SignedIn'
              ? SignInState.cases.SignInNeeded.make({
                  account: stored.state.account,
                  statement: stored.state.statement,
                  reason: 'no refresh token',
                })
              : stored.state,
        }),
      )
      const refreshToken = yield* Ref.make(
        Option.match(restored, {
          onNone: () => null as string | null,
          onSome: (stored) => stored.refreshToken,
        }),
      )
      const access = yield* Ref.make<Access | null>(null)
      // Serializes every change to the session: a refresh never interleaves
      // with a sign-in commit or a sign-out.
      const lock = yield* Semaphore.make(1)

      const persist = Effect.gen(function* () {
        const current = yield* SubscriptionRef.get(state)
        if (current._tag === 'SignedOut') return yield* vault.clear
        const stored: Stored = {
          state: current,
          refreshToken: yield* Ref.get(refreshToken),
        }
        yield* vault.save(
          yield* Schema.encodeEffect(StoredJson)(stored).pipe(Effect.orDie),
        )
      })

      const needSignIn = (reason: string) =>
        Effect.gen(function* () {
          const current = yield* SubscriptionRef.get(state)
          if (current._tag === 'SignedIn') {
            yield* SubscriptionRef.set(
              state,
              SignInState.cases.SignInNeeded.make({
                account: current.account,
                statement: current.statement,
                reason,
              }),
            )
          }
          yield* Ref.set(access, null)
          yield* Ref.set(refreshToken, null)
          yield* persist
          return yield* new SignInNeeded({ reason })
        })

      const accessToken = lock.withPermits(1)(
        Effect.gen(function* () {
          const current = yield* SubscriptionRef.get(state)
          if (current._tag === 'SignedOut') {
            return yield* new SignInNeeded({ reason: 'signed out' })
          }
          if (current._tag === 'SignInNeeded') {
            return yield* new SignInNeeded({ reason: current.reason })
          }
          const now = yield* Clock.currentTimeMillis
          const cached = yield* Ref.get(access)
          if (cached !== null && now < cached.expiresAtMs - REFRESH_MARGIN_MS) {
            return cached.token
          }
          const refresh = yield* Ref.get(refreshToken)
          if (refresh === null) return yield* needSignIn('no refresh token')
          const tokens = yield* tokenRequest({
            grant_type: 'refresh_token',
            refresh_token: refresh,
          }).pipe(
            Effect.catchTag('ProviderRefused', (refused) =>
              needSignIn(refused.error),
            ),
          )
          const fresh = yield* accessFrom(tokens)
          yield* Ref.set(access, fresh)
          if (tokens.refresh_token !== undefined) {
            yield* Ref.set(refreshToken, tokens.refresh_token)
            yield* persist
          }
          return fresh.token
        }),
      ).pipe(Effect.withSpan('SignInSession.accessToken'))

      const failed = (cause: { readonly _tag: string; readonly message: string }) =>
        new SignInFailed({ reason: `${cause._tag}: ${cause.message}` })

      const signIn = Effect.gen(function* () {
        const discovery = yield* discover.pipe(Effect.mapError(failed))
        const code = yield* prompt.authorize({
          authorizationEndpoint: discovery.authorization_endpoint,
          clientId: options.clientId,
          scopes: options.scopes,
        })
        const tokens = yield* tokenRequest({
          grant_type: 'authorization_code',
          code: code.code,
          code_verifier: code.codeVerifier,
          redirect_uri: code.redirectUri,
        }).pipe(
          Effect.mapError((error) =>
            error._tag === 'ProviderRefused'
              ? new SignInFailed({ reason: error.error })
              : failed(error),
          ),
        )
        const statement = yield* statements
          .fetch(tokens.access_token)
          .pipe(Effect.mapError(failed))
        if (statement.account.issuer !== options.issuer) {
          return yield* new SignInFailed({
            reason: `the server names issuer ${statement.account.issuer}`,
          })
        }
        const fresh = yield* accessFrom(tokens)
        const next = SignInState.cases.SignedIn.make({
          account: statement.account,
          statement,
        })
        yield* lock.withPermits(1)(
          Effect.gen(function* () {
            yield* Ref.set(access, fresh)
            yield* Ref.set(refreshToken, tokens.refresh_token ?? null)
            yield* SubscriptionRef.set(state, next)
            yield* persist
          }),
        )
        return next
      }).pipe(Effect.withSpan('SignInSession.signIn'))

      const revoke = (token: string) =>
        Effect.gen(function* () {
          const { revocation_endpoint } = yield* discover
          if (revocation_endpoint === undefined) return
          yield* HttpClientRequest.post(revocation_endpoint).pipe(
            HttpClientRequest.bodyUrlParams({
              token,
              token_type_hint: 'refresh_token',
              client_id: options.clientId,
            }),
            http.execute,
            Effect.timeout(REVOKE_TIMEOUT),
          )
        }).pipe(Effect.ignore)

      // The session ends locally at once, online or not; revoking the
      // refresh token at the provider is best effort.
      const signOut = Effect.gen(function* () {
        const revoked = yield* lock.withPermits(1)(
          Effect.gen(function* () {
            const refresh = yield* Ref.get(refreshToken)
            yield* Ref.set(access, null)
            yield* Ref.set(refreshToken, null)
            yield* SubscriptionRef.set(
              state,
              SignInState.cases.SignedOut.make({}),
            )
            yield* vault.clear
            return refresh
          }),
        )
        if (revoked !== null) yield* revoke(revoked)
      }).pipe(Effect.withSpan('SignInSession.signOut'))

      const refreshStatement = Effect.gen(function* () {
        const token = yield* accessToken
        const statement = yield* statements.fetch(token)
        return yield* lock.withPermits(1)(
          Effect.gen(function* () {
            const current = yield* SubscriptionRef.get(state)
            if (
              current._tag === 'SignedOut' ||
              !sameAccount(current.account, statement.account)
            ) {
              return yield* new StatementUnavailable({
                reason: 'the session changed while the statement was fetched',
              })
            }
            yield* SubscriptionRef.set(state, { ...current, statement })
            yield* persist
            return statement
          }),
        )
      }).pipe(Effect.withSpan('SignInSession.refreshStatement'))

      return SignInSession.of({
        state: SubscriptionRef.get(state),
        changes: SubscriptionRef.changes(state),
        signIn,
        signOut,
        accessToken,
        refreshStatement,
      })
    }),
  )
