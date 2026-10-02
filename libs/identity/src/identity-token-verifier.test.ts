import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import { TokenRejected, TokenVerifier } from './index.ts'
import { oidcTokenVerifier } from './oidc.ts'
import { decodeJwt } from 'jose'
import { runsSuite } from '@viviefs/testing'
import {
  TOKEN_CHECK_COUNT,
  makeFakeIssuer,
  runTokenVerifierChecks,
  type FakeIssuer,
} from './suites/index.ts'
import { serveFakeIssuer } from './suites/node.ts'

const AUDIENCE = 'viviefs-sync'

const sourceFor = (fake: FakeIssuer, verifier: Layer.Layer<TokenVerifier, unknown>) =>
  Effect.gen(function* () {
    const stranger = yield* makeFakeIssuer({
      issuer: 'http://elsewhere.test/realms/other',
      audience: AUDIENCE,
    })
    return {
      verifier,
      expected: fake.account('alice'),
      expectedRoles: ['member'],
      valid: fake.sign({ subject: 'alice', roles: ['member'] }),
      foreignIssuer: stranger.sign({ subject: 'alice' }),
      foreignAudience: fake.sign({ subject: 'alice', audience: 'another-app' }),
    }
  })

const failing = (checks: ReadonlyArray<{ name: string; status: string }>) =>
  checks.filter((check) => check.status !== 'PASS').map((check) => check.name)

describe('token verifier contract', runsSuite('identity/token-verifier'), () => {
  it.effect('the fake issuer passes every check', () =>
    Effect.gen(function* () {
      const fake = yield* makeFakeIssuer({
        issuer: 'http://fake.test/realms/viviefs',
        audience: AUDIENCE,
      })
      const checks = yield* runTokenVerifierChecks(
        yield* sourceFor(fake, fake.verifier),
      )
      expect(checks).toHaveLength(TOKEN_CHECK_COUNT)
      expect(failing(checks)).toEqual([])
    }),
  )

  it.effect('a verifier that trusts the payload fails the hostile checks', () =>
    Effect.gen(function* () {
      const fake = yield* makeFakeIssuer({
        issuer: 'http://fake.test/realms/viviefs',
        audience: AUDIENCE,
      })
      const trusting = Layer.succeed(
        TokenVerifier,
        TokenVerifier.of({
          verify: (token) =>
            Effect.try({
              try: () => {
                const claims = decodeJwt(token)
                return {
                  account: { issuer: claims.iss ?? '', subject: claims.sub ?? '' },
                  roles: ['member'],
                  expiresAtMs: (claims.exp ?? 0) * 1000,
                }
              },
              catch: () => new TokenRejected({ reason: 'missing' }),
            }),
        }),
      )
      const checks = yield* runTokenVerifierChecks(
        yield* sourceFor(fake, trusting),
      )
      expect(failing(checks)).toEqual([
        'changed payload',
        'alg none',
        'foreign key',
        'algorithm confusion',
        'foreign issuer',
        'foreign audience',
        'expired',
      ])
    }),
  )

  it.live('the OIDC verifier passes every check against a served fake issuer', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
      const verifier = oidcTokenVerifier({
        issuer: fake.origin,
        audience: AUDIENCE,
      }).pipe(Layer.provide(FetchHttpClient.layer))
      const checks = yield* runTokenVerifierChecks(
        yield* sourceFor(fake, verifier),
      )
      expect(checks).toHaveLength(TOKEN_CHECK_COUNT)
      expect(failing(checks)).toEqual([])
    }),
  )

  it.live('the OIDC verifier refuses a provider whose discovery names another issuer', () =>
    Effect.gen(function* () {
      const fake = yield* serveFakeIssuer({
        audience: AUDIENCE,
        discoveryIssuer: 'http://impostor.test',
      })
      const error = yield* Layer.build(
        oidcTokenVerifier({ issuer: fake.origin, audience: AUDIENCE }).pipe(
          Layer.provide(FetchHttpClient.layer),
        ),
      ).pipe(Effect.flip)
      expect(error._tag).toBe('DiscoveryFailed')
      expect(error.reason).toContain('http://impostor.test')
    }),
  )
})
