import { describe, expect, it } from '@effect/vitest'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import {
  AuthorizationPrompt,
  CallerStatements,
  SignInSession,
  SignInVault,
  StatementUnavailable,
  TokenVerifier,
  memorySignInVault,
  oidcSignInSession,
  type CallerStatement,
} from './index.ts'
import { fakeAuthorizationPrompt, serveFakeIssuer, type ServedFakeIssuer } from './suites/node.ts'

const AUDIENCE = 'viviefs-sync'
const CLIENT = 'viviefs-mobile'

/** A vault that outlives one session, like secure storage across a restart. */
const persistentVault = () => {
  let slot = Option.none<string>()
  return {
    peek: () => slot,
    layer: Layer.succeed(
      SignInVault,
      SignInVault.of({
        load: Effect.sync(() => slot),
        save: (encoded) =>
          Effect.sync(() => {
            slot = Option.some(encoded)
          }),
        clear: Effect.sync(() => {
          slot = Option.none()
        }),
      }),
    ),
  }
}

/** The server's statement, from the account the token proves. */
const statementsFrom = (
  fake: ServedFakeIssuer,
  answer: (statement: CallerStatement) => CallerStatement = (s) => s,
) =>
  Layer.effect(
    CallerStatements,
    Effect.gen(function* () {
      const verifier = yield* TokenVerifier
      return CallerStatements.of({
        fetch: (token) =>
          verifier.verify(token).pipe(
            Effect.map((verified) =>
              answer({
                person: `person-${verified.account.subject}`,
                account: verified.account,
                roles: verified.roles,
                organizations: ['acme'],
              }),
            ),
            Effect.mapError(
              (rejected) => new StatementUnavailable({ reason: rejected.reason }),
            ),
          ),
      })
    }),
  ).pipe(Layer.provide(fake.verifier))

const session = (
  fake: ServedFakeIssuer,
  parts: {
    readonly vault: Layer.Layer<SignInVault>
    readonly who?: () => string | null
    readonly prompt?: Layer.Layer<AuthorizationPrompt>
    readonly statements?: Layer.Layer<CallerStatements>
  },
) =>
  Layer.build(
    oidcSignInSession({
      issuer: fake.issuer,
      clientId: CLIENT,
      scopes: ['openid', 'offline_access'],
    }).pipe(
      Layer.provide([
        FetchHttpClient.layer,
        parts.vault,
        parts.prompt ?? fakeAuthorizationPrompt(fake, parts.who ?? (() => 'alice')),
        parts.statements ?? statementsFrom(fake),
      ]),
    ),
  ).pipe(Effect.map((context) => Context.get(context, SignInSession)))

const outcome = <A, E extends { readonly _tag: string }>(effect: Effect.Effect<A, E>) =>
  Effect.match(effect, {
    onSuccess: () => 'ok',
    onFailure: (error) => error._tag,
  })

describe('OIDC sign-in session', () => {
  it.live('signs in with PKCE and names the account from the server statement', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const vault = persistentVault()
      const signIn = yield* session(fake, { vault: vault.layer })
      expect((yield* signIn.state)._tag).toBe('SignedOut')

      const state = yield* signIn.signIn
      expect(state).toMatchObject({
        _tag: 'SignedIn',
        account: fake.account('alice'),
        statement: { person: 'person-alice', organizations: ['acme'] },
      })
      const token = yield* signIn.accessToken
      const verified = yield* Effect.gen(function* () {
        const verifier = yield* TokenVerifier
        return yield* verifier.verify(token)
      }).pipe(Effect.provide(fake.verifier))
      expect(verified.account).toEqual(fake.account('alice'))
      expect(Option.isSome(vault.peek())).toBe(true)
      // Trace context never leaves for the identity provider.
      expect(fake.sawTraceContext()).toBe(false)
    }),
  )

  it.live('a wrong PKCE verifier is refused and the session stays signed out', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const wrongVerifier = Layer.succeed(
        AuthorizationPrompt,
        AuthorizationPrompt.of({
          authorize: (request) =>
            Effect.succeed({
              code: fake.issueCode({
                subject: 'alice',
                clientId: request.clientId,
                redirectUri: 'viviefs-test://auth',
                codeChallenge: 'not-the-challenge',
              }),
              codeVerifier: 'some-verifier',
              redirectUri: 'viviefs-test://auth',
            }),
        }),
      )
      const signIn = yield* session(fake, {
        vault: memorySignInVault,
        prompt: wrongVerifier,
      })
      const failed = yield* Effect.flip(signIn.signIn)
      expect(failed.reason).toBe('invalid_grant')
      expect((yield* signIn.state)._tag).toBe('SignedOut')
    }),
  )

  it.live('refreshes an expiring token and rotates the refresh token', () =>
    Effect.gen(function* () {
      // Lifetime equal to the refresh margin: every token is due for refresh.
      const fake = yield* serveFakeIssuer({
        audience: AUDIENCE,
        accessTokenLifetimeMs: 10_000,
      })
      const signIn = yield* session(fake, { vault: memorySignInVault })
      yield* signIn.signIn
      yield* signIn.accessToken
      yield* signIn.accessToken
      expect(fake.grants()).toEqual([
        'authorization_code',
        'refresh_token',
        'refresh_token',
      ])
      expect(fake.liveRefreshTokens('alice')).toBe(1)
    }),
  )

  it.live('a refused refresh needs sign-in, keeps the account, and signing in again resumes', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({
        audience: AUDIENCE,
        accessTokenLifetimeMs: 10_000,
      })
      const vault = persistentVault()
      const signIn = yield* session(fake, { vault: vault.layer })
      yield* signIn.signIn
      fake.revokeRefreshTokens('alice')

      const refused = yield* Effect.flip(signIn.accessToken)
      expect(refused).toMatchObject({ _tag: 'SignInNeeded', reason: 'invalid_grant' })
      expect(yield* signIn.state).toMatchObject({
        _tag: 'SignInNeeded',
        account: fake.account('alice'),
        statement: { person: 'person-alice' },
      })

      // After a restart the device still knows whose replica this is.
      const restarted = yield* session(fake, { vault: vault.layer })
      expect(yield* restarted.state).toMatchObject({
        _tag: 'SignInNeeded',
        account: fake.account('alice'),
      })

      yield* restarted.signIn
      expect(yield* outcome(restarted.accessToken)).toBe('ok')
    }),
  )

  it.live('an unreachable provider changes nothing and the next try succeeds', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({
        audience: AUDIENCE,
        accessTokenLifetimeMs: 10_000,
      })
      const signIn = yield* session(fake, { vault: memorySignInVault })
      yield* signIn.signIn
      fake.setAvailable(false)
      expect(yield* outcome(signIn.accessToken)).toBe('IdentityProviderUnreachable')
      expect((yield* signIn.state)._tag).toBe('SignedIn')
      fake.setAvailable(true)
      expect(yield* outcome(signIn.accessToken)).toBe('ok')
    }),
  )

  it.live('a stored session survives a restart; a memory vault does not', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const vault = persistentVault()
      yield* Effect.flatMap(session(fake, { vault: vault.layer }), (s) => s.signIn)

      const restarted = yield* session(fake, { vault: vault.layer })
      expect(yield* restarted.state).toMatchObject({
        _tag: 'SignedIn',
        account: fake.account('alice'),
      })
      expect(yield* outcome(restarted.accessToken)).toBe('ok')

      yield* Effect.flatMap(session(fake, { vault: memorySignInVault }), (s) => s.signIn)
      const reloaded = yield* session(fake, { vault: memorySignInVault })
      expect((yield* reloaded.state)._tag).toBe('SignedOut')
    }),
  )

  it.live('signing out ends the session locally and revokes the refresh token', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const vault = persistentVault()
      const signIn = yield* session(fake, { vault: vault.layer })
      yield* signIn.signIn
      expect(fake.liveRefreshTokens('alice')).toBe(1)

      yield* signIn.signOut
      expect((yield* signIn.state)._tag).toBe('SignedOut')
      expect(Option.isNone(vault.peek())).toBe(true)
      expect(fake.liveRefreshTokens('alice')).toBe(0)
      expect(yield* outcome(signIn.accessToken)).toBe('SignInNeeded')
    }),
  )

  it.live('another person signing in replaces the session', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      let who = 'alice'
      const signIn = yield* session(fake, { vault: memorySignInVault, who: () => who })
      yield* signIn.signIn
      yield* signIn.signOut
      who = 'bob'
      expect(yield* signIn.signIn).toMatchObject({
        _tag: 'SignedIn',
        account: fake.account('bob'),
      })
    }),
  )

  it.live('a cancelled or unexplained sign-in leaves the previous state', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const cancelled = yield* session(fake, { vault: memorySignInVault, who: () => null })
      expect(yield* Effect.flip(cancelled.signIn)).toMatchObject({ reason: 'cancel' })
      expect((yield* cancelled.state)._tag).toBe('SignedOut')

      const silent = yield* session(fake, {
        vault: memorySignInVault,
        statements: Layer.succeed(
          CallerStatements,
          CallerStatements.of({
            fetch: () => Effect.fail(new StatementUnavailable({ reason: 'offline' })),
          }),
        ),
      })
      expect(yield* outcome(silent.signIn)).toBe('SignInFailed')
      expect((yield* silent.state)._tag).toBe('SignedOut')

      const elsewhere = yield* session(fake, {
        vault: memorySignInVault,
        statements: statementsFrom(fake, (statement) => ({
          ...statement,
          account: { issuer: 'http://elsewhere.test', subject: 'alice' },
        })),
      })
      expect(yield* Effect.flip(elsewhere.signIn)).toMatchObject({
        reason: 'the server names issuer http://elsewhere.test',
      })
    }),
  )

  it.live('refreshing the statement replaces the copy in the session', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      let organizations: ReadonlyArray<string> = ['acme']
      const signIn = yield* session(fake, {
        vault: memorySignInVault,
        statements: statementsFrom(fake, (statement) => ({ ...statement, organizations })),
      })
      yield* signIn.signIn
      organizations = []
      const statement = yield* signIn.refreshStatement
      expect(statement.organizations).toEqual([])
      expect(yield* signIn.state).toMatchObject({ statement: { organizations: [] } })
    }),
  )
})
