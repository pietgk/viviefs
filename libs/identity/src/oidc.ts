/**
 * `@viviefs/identity/oidc`: token verification with `jose` (server only). The
 * contract lives in the package root so devices never bundle `jose`.
 */
import * as Clock from 'effect/Clock'
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
import {
  ACCEPTED_ALGORITHMS,
  CLOCK_TOLERANCE_SECONDS,
  TokenRejected,
  TokenVerifier,
} from './token-verifier.ts'

export class DiscoveryFailed extends Schema.TaggedError<DiscoveryFailed>()(
  'DiscoveryFailed',
  { issuer: Schema.String, reason: Schema.String },
) {}

// `realm_access.roles` is where Keycloak puts realm roles. Other providers
// leave it out; the token then carries no roles.
const Claims = Schema.Struct({
  iss: Schema.String,
  sub: Schema.String,
  exp: Schema.Finite,
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
