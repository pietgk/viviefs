/**
 * Device-side half of the identity pattern (ADR-0022). The device's session
 * with the identity provider: sign in, the current access token (refreshed
 * when needed), sign out, and its state.
 *
 * - Signed out: no session. Signing out ends one.
 * - Signed in: the session holds tokens and the server's statement about the
 *   provider account (Q22). The device labels its writes with that
 *   statement's person and opens that account's local replica.
 * - Sign-in needed: the identity provider refused a refresh. The account and
 *   its statement stay, so local writes keep going into the outbox; sync
 *   waits until the same account signs in again (Q10).
 *
 * A network failure is not sign-in needed: the call fails with
 * `IdentityProviderUnreachable` and can be retried.
 */
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Stream from 'effect/Stream'
import { CallerStatement } from './caller-statement.ts'
import { ProviderAccount } from './token-verifier.ts'

/** No usable session: signed out, or the identity provider refused a refresh. */
export class SignInNeeded extends Schema.TaggedError<SignInNeeded>()(
  'SignInNeeded',
  { reason: Schema.String },
) {}

/** The identity provider did not answer. Nothing changed; retry later. */
export class IdentityProviderUnreachable extends Schema.TaggedError<IdentityProviderUnreachable>()(
  'IdentityProviderUnreachable',
  { reason: Schema.String },
) {}

/**
 * A sign-in did not complete: cancelled, refused by the identity provider,
 * or the server could not say who the account is. The previous state stays.
 */
export class SignInFailed extends Schema.TaggedError<SignInFailed>()(
  'SignInFailed',
  { reason: Schema.String },
) {}

/** The server did not give its statement about the caller. */
export class StatementUnavailable extends Schema.TaggedError<StatementUnavailable>()(
  'StatementUnavailable',
  { reason: Schema.String },
) {}

export const SignInState = Schema.TaggedUnion({
  SignedOut: {},
  SignedIn: { account: ProviderAccount, statement: CallerStatement },
  SignInNeeded: {
    account: ProviderAccount,
    statement: CallerStatement,
    reason: Schema.String,
  },
})
export type SignInState = typeof SignInState.Type

export class SignInSession extends Context.Service<
  SignInSession,
  {
    readonly state: Effect.Effect<SignInState>
    /** Every state from now on, starting with the current one. */
    readonly changes: Stream.Stream<SignInState>
    /**
     * Interactive sign-in at the identity provider, then the server's
     * statement for the new token. Replaces any previous session.
     */
    readonly signIn: Effect.Effect<SignInState, SignInFailed>
    /** Ends the session: tokens are revoked where possible and forgotten. */
    readonly signOut: Effect.Effect<void>
    readonly accessToken: Effect.Effect<
      string,
      SignInNeeded | IdentityProviderUnreachable
    >
    /**
     * Fetches the server's statement again, for when the server refused a
     * write (`MembershipMissing`, `ActorMismatch`) and the copy is stale.
     */
    readonly refreshStatement: Effect.Effect<
      CallerStatement,
      SignInNeeded | IdentityProviderUnreachable | StatementUnavailable
    >
  }
>()('viviefs/identity/SignInSession') {}
