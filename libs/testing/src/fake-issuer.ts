/**
 * Fake issuer (ADR-0022, Q4): an in-process identity provider with a local
 * RS256 key pair. It signs real access tokens, and its verifier is the shared
 * `makeTokenVerifier` over its own key set, so the fake exercises the same
 * signature, issuer, audience and expiry checks as the OIDC verifier.
 *
 * Lives in `layer:testing` so production code cannot import it.
 */
import * as Clock from 'effect/Clock'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import {
  TokenVerifier,
  makeTokenVerifier,
  type ProviderAccount,
} from '@viviefs/identity'
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JSONWebKeySet,
} from 'jose'

export const FAKE_TOKEN_LIFETIME_MS = 5 * 60 * 1000

export type FakeIssuer = {
  readonly issuer: string
  readonly audience: string
  readonly jwks: JSONWebKeySet
  /** A token for `subject`. Overrides let a test mint a token for elsewhere. */
  readonly sign: (claims: {
    readonly subject: string
    readonly roles?: ReadonlyArray<string>
    readonly issuer?: string
    readonly audience?: string
    readonly lifetimeMs?: number
  }) => Effect.Effect<string>
  readonly account: (subject: string) => ProviderAccount
  readonly verifier: Layer.Layer<TokenVerifier>
}

export const makeFakeIssuer = Effect.fn('FakeIssuer.make')(function* (options: {
  readonly issuer: string
  readonly audience: string
  readonly keyId?: string
}) {
  const keyId = options.keyId ?? 'fake-1'
  const { privateKey, publicKey } = yield* Effect.promise(() =>
    generateKeyPair('RS256', { extractable: true }),
  )
  const publicJwk = yield* Effect.promise(() => exportJWK(publicKey))
  const jwks: JSONWebKeySet = {
    keys: [{ ...publicJwk, kid: keyId, alg: 'RS256', use: 'sig' }],
  }
  const sign: FakeIssuer['sign'] = (claims) =>
    Effect.gen(function* () {
      const nowMs = yield* Clock.currentTimeMillis
      const issuedAt = Math.floor(nowMs / 1000)
      const lifetime = claims.lifetimeMs ?? FAKE_TOKEN_LIFETIME_MS
      const payload =
        claims.roles === undefined
          ? {}
          : { realm_access: { roles: [...claims.roles] } }
      return yield* Effect.promise(() =>
        new SignJWT(payload)
          .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'JWT' })
          .setIssuer(claims.issuer ?? options.issuer)
          .setAudience(claims.audience ?? options.audience)
          .setSubject(claims.subject)
          .setIssuedAt(issuedAt)
          .setExpirationTime(issuedAt + Math.floor(lifetime / 1000))
          .sign(privateKey),
      )
    })
  const issuer: FakeIssuer = {
    issuer: options.issuer,
    audience: options.audience,
    jwks,
    sign,
    account: (subject) => ({ issuer: options.issuer, subject }),
    verifier: Layer.succeed(
      TokenVerifier,
      makeTokenVerifier({
        issuer: options.issuer,
        audience: options.audience,
        keys: createLocalJWKSet(jwks),
      }),
    ),
  }
  return issuer
})
