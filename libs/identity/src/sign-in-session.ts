/**
 * Device-side half of the identity pattern (ADR-0022). The device's session
 * with the identity provider hands out a current access token, refreshing it
 * when needed. When refresh is impossible the session needs a new sign-in,
 * and the device keeps its outbox until then (Q10).
 *
 * Sign-in, sign-out and the session state arrive with the device steps of
 * P11; the sync client only needs the current token.
 */
import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

export class SignInNeeded extends Schema.TaggedError<SignInNeeded>()(
  'SignInNeeded',
  { reason: Schema.String },
) {}

export class SignInSession extends Context.Service<
  SignInSession,
  {
    readonly accessToken: Effect.Effect<string, SignInNeeded>
  }
>()('viviefs/identity/SignInSession') {}
