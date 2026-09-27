/**
 * Server-side half of the identity pattern (ADR-0022). A token verifier turns
 * an access token into the provider account it proves, or rejects it. It
 * checks signature, issuer, audience and expiry locally against the identity
 * provider's public keys; it never asks the provider per request.
 *
 * Every implementation shares `makeTokenVerifier`. They differ only in where
 * the public keys come from: the provider's JWKS (`oidcTokenVerifier`) or a
 * fake issuer's local key set (`@viviefs/testing`).
 */
import * as Clock from 'effect/Clock'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as HttpClient from 'effect/unstable/http/HttpClient'
import * as HttpClientResponse from 'effect/unstable/http/HttpClientResponse'
import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose'

/** The only signing algorithm accepted. Rules out `none` and HS256 confusion. */
export const ACCEPTED_ALGORITHMS = ['RS256'] as const

/** Allowed skew between the provider's clock and ours, in seconds. */
export const CLOCK_TOLERANCE_SECONDS = 5

/** A person's account at an identity provider: the token's `iss` and `sub`. */
export const ProviderAccount = Schema.Struct({
  issuer: Schema.String,
  subject: Schema.String,
})
export type ProviderAccount = typeof ProviderAccount.Type

/** What a verified access token proves. Roles are carried, not enforced. */
export const VerifiedToken = Schema.Struct({
  account: ProviderAccount,
  roles: Schema.Array(Schema.String),
  expiresAtMs: Schema.Number,
})
export type VerifiedToken = typeof VerifiedToken.Type

export class TokenRejected extends Schema.TaggedError<TokenRejected>()(
  'TokenRejected',
  { reason: Schema.Literals(['missing', 'invalid', 'expired']) },
) {}

export class DiscoveryFailed extends Schema.TaggedError<DiscoveryFailed>()(
  'DiscoveryFailed',
  { issuer: Schema.String, reason: Schema.String },
) {}

export class TokenVerifier extends Context.Service<
  TokenVerifier,
  {
    readonly verify: (
      token: string,
    ) => Effect.Effect<VerifiedToken, TokenRejected>
  }
>()('viviefs/identity/TokenVerifier') {}

// `realm_access.roles` is where Keycloak puts realm roles. Other providers
// leave it out; the token then carries no roles.
const Claims = Schema.Struct({
  iss: Schema.String,
  sub: Schema.String,
  exp: Schema.Number,
  realm_access: Schema.optionalKey(
    Schema.Struct({ roles: Schema.Array(Schema.String) }),
  ),
})

export const makeTokenVerifier = (options: {
  readonly issuer: string
  readonly audience: string
  readonly keys: JWTVerifyGetKey
}): TokenVerifier['Service'] =>
  TokenVerifier.of({
    verify: Effect.fn('TokenVerifier.verify')(function* (token: string) {
      if (token.length === 0) {
        return yield* new TokenRejected({ reason: 'missing' })
      }
      const now = yield* Clock.currentTimeMillis
      const { payload } = yield* Effect.tryPromise({
        try: () =>
          jwtVerify(token, options.keys, {
            issuer: options.issuer,
            audience: options.audience,
            algorithms: [...ACCEPTED_ALGORITHMS],
            clockTolerance: CLOCK_TOLERANCE_SECONDS,
            currentDate: new Date(now),
          }),
        catch: (error) =>
          new TokenRejected({
            reason: error instanceof errors.JWTExpired ? 'expired' : 'invalid',
          }),
      })
      const claims = yield* Schema.decodeUnknownEffect(Claims)(payload).pipe(
        Effect.mapError(() => new TokenRejected({ reason: 'invalid' })),
      )
      return {
        account: { issuer: claims.iss, subject: claims.sub },
        roles: claims.realm_access?.roles ?? [],
        expiresAtMs: claims.exp * 1000,
      }
    }),
  })

const Discovery = Schema.Struct({
  issuer: Schema.String,
  jwks_uri: Schema.String,
})

/**
 * Verifier for any OIDC provider. Reads the provider's discovery document
 * once, requires its `issuer` to match, then verifies against its JWKS.
 * `jose` caches the keys and re-fetches on an unknown key id.
 */
export const oidcTokenVerifier = (options: {
  readonly issuer: string
  readonly audience: string
}): Layer.Layer<TokenVerifier, DiscoveryFailed, HttpClient.HttpClient> =>
  Layer.effect(
    TokenVerifier,
    Effect.gen(function* () {
      const failed = (reason: string) =>
        new DiscoveryFailed({ issuer: options.issuer, reason })
      const discovery = yield* HttpClient.get(
        `${options.issuer}/.well-known/openid-configuration`,
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(Discovery)),
        Effect.mapError((error) => failed(error.message)),
      )
      if (discovery.issuer !== options.issuer) {
        return yield* failed(`discovery names issuer ${discovery.issuer}`)
      }
      return makeTokenVerifier({
        issuer: options.issuer,
        audience: options.audience,
        keys: createRemoteJWKSet(new URL(discovery.jwks_uri)),
      })
    }),
  )
