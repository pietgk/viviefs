/**
 * P11 check 1: one token contract for every identity provider (ADR-0022).
 * A token source supplies the three tokens only a provider can mint: a valid
 * one, one from another issuer, and one for another audience. The suite
 * derives every other hostile token itself, so the fake issuer and Keycloak
 * face exactly the same attacks.
 */
import * as Clock from 'effect/Clock'
import * as Effect from 'effect/Effect'
import type * as Layer from 'effect/Layer'
import {
  CLOCK_TOLERANCE_SECONDS,
  TokenVerifier,
  type ProviderAccount,
  type VerifiedToken,
} from '@viviefs/identity'
import { SignJWT, base64url, decodeProtectedHeader, generateKeyPair } from 'jose'
import type { CheckResult } from './log-store-conformance.ts'

export const TOKEN_CHECK_NAMES = [
  'valid token',
  'missing token',
  'changed payload',
  'alg none',
  'foreign key',
  'algorithm confusion',
  'foreign issuer',
  'foreign audience',
  'expired',
] as const

export const TOKEN_CHECK_COUNT = TOKEN_CHECK_NAMES.length

export type TokenSource<E = never, R = never> = {
  readonly verifier: Layer.Layer<TokenVerifier, E, R>
  /** The account a valid token must verify as. */
  readonly expected: ProviderAccount
  /** Roles the valid token must carry. Providers may add more. */
  readonly expectedRoles: ReadonlyArray<string>
  readonly valid: Effect.Effect<string, E, R>
  /** A genuine token from a different issuer (another realm or provider). */
  readonly foreignIssuer: Effect.Effect<string, E, R>
  /** A genuine token from the right issuer, issued for another audience. */
  readonly foreignAudience: Effect.Effect<string, E, R>
}

type Outcome =
  | { readonly _tag: 'accepted'; readonly token: VerifiedToken }
  | { readonly _tag: 'rejected'; readonly reason: string }

const describeOutcome = (outcome: Outcome): string =>
  outcome._tag === 'accepted'
    ? `accepted as ${outcome.token.account.subject}`
    : `rejected: ${outcome.reason}`

const outcomeOf = (token: string) =>
  Effect.gen(function* () {
    const verifier = yield* TokenVerifier
    return yield* verifier.verify(token).pipe(
      Effect.match({
        onSuccess: (verified): Outcome => ({ _tag: 'accepted', token: verified }),
        onFailure: (error): Outcome => ({ _tag: 'rejected', reason: error.reason }),
      }),
    )
  })

const expectRejected = (
  name: string,
  outcome: Outcome,
  reason: 'missing' | 'invalid' | 'expired',
): CheckResult => ({
  name,
  status:
    outcome._tag === 'rejected' && outcome.reason === reason ? 'PASS' : 'FAIL',
  detail: `${describeOutcome(outcome)} (want rejected: ${reason})`,
})

const parts = (token: string) => {
  const [header = '', payload = '', signature = ''] = token.split('.')
  return { header, payload, signature }
}

const decodePayload = (token: string): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(base64url.decode(parts(token).payload)))

const encodeJson = (value: unknown): string =>
  base64url.encode(JSON.stringify(value))

const changedPayload = (token: string): string => {
  const { header, signature } = parts(token)
  const payload = { ...decodePayload(token), sub: 'intruder' }
  return `${header}.${encodeJson(payload)}.${signature}`
}

const algNone = (token: string): string =>
  `${encodeJson({ alg: 'none', typ: 'JWT' })}.${parts(token).payload}.`

const resignedWithForeignKey = (token: string) =>
  Effect.gen(function* () {
    const { privateKey } = yield* Effect.promise(() => generateKeyPair('RS256'))
    const kid = decodeProtectedHeader(token).kid
    return yield* Effect.promise(() =>
      new SignJWT(decodePayload(token))
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT', ...(kid ? { kid } : {}) })
        .sign(privateKey),
    )
  })

const signedWithHs256 = (token: string) =>
  Effect.promise(() =>
    new SignJWT(decodePayload(token))
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(new TextEncoder().encode('a shared secret nobody should accept')),
  )

const clockShiftedBy = (base: Clock.Clock, ms: number): Clock.Clock => ({
  currentTimeMillisUnsafe: () => base.currentTimeMillisUnsafe() + ms,
  currentTimeMillis: Effect.map(base.currentTimeMillis, (now) => now + ms),
  currentTimeNanosUnsafe: () =>
    base.currentTimeNanosUnsafe() + BigInt(ms) * 1_000_000n,
  currentTimeNanos: Effect.map(
    base.currentTimeNanos,
    (now) => now + BigInt(ms) * 1_000_000n,
  ),
  monotonicTimeNanosUnsafe: () => base.monotonicTimeNanosUnsafe(),
  monotonicTimeNanos: base.monotonicTimeNanos,
  sleep: (duration) => base.sleep(duration),
})

export const runTokenVerifierChecks = <E, R>(
  source: TokenSource<E, R>,
): Effect.Effect<ReadonlyArray<CheckResult>, E, R> =>
  Effect.gen(function* () {
    const results: Array<CheckResult> = []
    const valid = yield* source.valid

    const first = yield* outcomeOf(valid)
    const account =
      first._tag === 'accepted' &&
      first.token.account.issuer === source.expected.issuer &&
      first.token.account.subject === source.expected.subject
    const roles =
      first._tag === 'accepted' &&
      source.expectedRoles.every((role) => first.token.roles.includes(role))
    results.push({
      name: 'valid token',
      status: account && roles ? 'PASS' : 'FAIL',
      detail:
        first._tag === 'accepted'
          ? `${first.token.account.issuer} ${first.token.account.subject}, roles [${first.token.roles.join(', ')}]`
          : describeOutcome(first),
    })

    results.push(expectRejected('missing token', yield* outcomeOf(''), 'missing'))
    results.push(
      expectRejected(
        'changed payload',
        yield* outcomeOf(changedPayload(valid)),
        'invalid',
      ),
    )
    results.push(
      expectRejected('alg none', yield* outcomeOf(algNone(valid)), 'invalid'),
    )
    results.push(
      expectRejected(
        'foreign key',
        yield* outcomeOf(yield* resignedWithForeignKey(valid)),
        'invalid',
      ),
    )
    results.push(
      expectRejected(
        'algorithm confusion',
        yield* outcomeOf(yield* signedWithHs256(valid)),
        'invalid',
      ),
    )
    results.push(
      expectRejected(
        'foreign issuer',
        yield* outcomeOf(yield* source.foreignIssuer),
        'invalid',
      ),
    )
    results.push(
      expectRejected(
        'foreign audience',
        yield* outcomeOf(yield* source.foreignAudience),
        'invalid',
      ),
    )

    // Verify the valid token a minute past its expiry plus the tolerance.
    const now = yield* Clock.currentTimeMillis
    const expiresAt =
      first._tag === 'accepted' ? first.token.expiresAtMs : now
    const shift = expiresAt - now + (CLOCK_TOLERANCE_SECONDS + 60) * 1000
    const base = yield* Clock.Clock
    results.push(
      expectRejected(
        'expired',
        yield* outcomeOf(valid).pipe(
          Effect.provideService(Clock.Clock, clockShiftedBy(base, shift)),
        ),
        'expired',
      ),
    )
    return results
  }).pipe(Effect.provide(source.verifier))
