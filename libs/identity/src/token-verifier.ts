/**
 * Server-side half of the identity pattern (ADR-0022). A token verifier turns
 * an access token into the provider account it proves, or rejects it. It
 * checks signature, issuer, audience and expiry locally against the identity
 * provider's public keys; it never asks the provider per request.
 *
 * This file is the contract and carries no crypto library, so a device can
 * import it. The implementation is `@viviefs/identity/oidc` (server only):
 * every verifier shares `makeTokenVerifier` and differs only in where the
 * public keys come from, the provider's JWKS or a fake issuer's key set.
 */
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

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
  expiresAtMs: Schema.Finite,
})
export type VerifiedToken = typeof VerifiedToken.Type

export class TokenRejected extends Schema.TaggedError<TokenRejected>()(
  'TokenRejected',
  { reason: Schema.Literals(['missing', 'invalid', 'expired']) },
) {}

export class TokenVerifier extends Context.Service<
  TokenVerifier,
  {
    readonly verify: (
      token: string,
    ) => Effect.Effect<VerifiedToken, TokenRejected>
  }
>()('viviefs/identity/TokenVerifier') {}
