/**
 * P11 identity (ADR-0022, design review section 1). Each section can fail
 * on its own:
 *
 * 1. The token contract (check 1): the fake issuer's verifier, and the OIDC
 *    verifier against a served fake and against Keycloak, all pass one suite.
 * 2. The Node checks on the authenticated protocol (checks 3-9, 12 and the
 *    host side of 10), and the span review in the evidence note.
 * 3. Over HTTP with Keycloak's tokens against the evidence server (check 3).
 * 4. The device checks (2, the device leg of 3, token storage, 10, 11,
 *    removing an account) on the iOS simulator, the Android emulator and
 *    web, one lab for all three.
 * 5. The positive controls for the device checks, on web: each lab-only
 *    defect in the evidence app must fail exactly its check.
 */
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import {
  TOKEN_CHECK_COUNT,
  makeFakeIssuer,
  runTokenVerifierChecks,
  type FakeIssuer,
} from '@viviefs/identity/suites'
import { serveFakeIssuer } from '@viviefs/identity/suites/node'
import type { CheckResult } from '@viviefs/testing'
import { writeJson } from './dev-client.ts'
import { P11_NODE_CHECK_COUNT, runMembershipChecks } from './p11-checks.ts'
import {
  judgeControl,
  P11_DEVICE_CHECK_NAMES,
  P11_DEVICE_CONTROLS,
  runP11OnPlatform,
  type P11DeviceControl,
  type P11Platform,
} from './p11-device.ts'
import { P11_HTTP_CHECK_NAMES, runP11HttpChecks } from './p11-http.ts'
import { runKeycloakTokenChecks } from './p11-keycloak.ts'
import { startP11Lab } from './p11-lab.ts'
import { spanReviewDrift } from './p11-spans.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p11')
const EVIDENCE = join(ROOT, 'docs/evidence/2026-09-28-p11.md')
const AUDIENCE = 'viviefs-sync'
const PLATFORMS: ReadonlyArray<P11Platform> = ['ios', 'android', 'web']

/** Thrown, not exited, so the lab is stopped on the way out. */
class P11Failed extends Error {}

const requirePass = (checks: ReadonlyArray<CheckResult>, label: string, expected: number) => {
  if (checks.length !== expected) {
    throw new P11Failed(`P11 ${label}: expected ${expected} checks, got ${checks.length}`)
  }
  const failed = checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    throw new P11Failed(
      `P11 ${label} failed: ${failed.map((check) => `${check.name}: ${check.detail}`).join('; ')}`,
    )
  }
  console.log(`P11 ${label} passed (${expected} checks).`)
}

/** The same suite on the fake issuer: its own verifier, and OIDC over HTTP. */
const fakeTokenChecks = () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const source = (fake: FakeIssuer) =>
          Effect.gen(function* () {
            const stranger = yield* makeFakeIssuer({
              issuer: 'http://elsewhere.test/realms/other',
              audience: AUDIENCE,
            })
            return {
              expected: fake.account('alice'),
              expectedRoles: ['member'],
              valid: fake.sign({ subject: 'alice', roles: ['member'] }),
              foreignIssuer: stranger.sign({ subject: 'alice' }),
              foreignAudience: fake.sign({ subject: 'alice', audience: 'another-app' }),
            }
          })
        const inProcess = yield* makeFakeIssuer({
          issuer: 'http://fake.test/realms/viviefs',
          audience: AUDIENCE,
        })
        const fake = yield* runTokenVerifierChecks({
          ...(yield* source(inProcess)),
          verifier: inProcess.verifier,
        })
        const served = yield* serveFakeIssuer({ audience: AUDIENCE })
        const oidc = yield* runTokenVerifierChecks({
          ...(yield* source(served)),
          verifier: oidcTokenVerifier({ issuer: served.issuer, audience: AUDIENCE }).pipe(
            Layer.provide(FetchHttpClient.layer),
          ),
        })
        return { fake, oidc }
      }),
    ),
  )

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })

  const tokens = await fakeTokenChecks()
  await writeJson(ARTIFACTS, 'tokens-fake.json', tokens)
  requirePass(tokens.fake, 'token contract on the fake verifier', TOKEN_CHECK_COUNT)
  requirePass(tokens.oidc, 'token contract on the OIDC verifier against a served fake', TOKEN_CHECK_COUNT)

  const node = await Effect.runPromise(runMembershipChecks)
  await writeJson(ARTIFACTS, 'node.json', node.checks)
  requirePass(node.checks, 'Node checks', P11_NODE_CHECK_COUNT)
  const drift = spanReviewDrift(node.spans, await readFile(EVIDENCE, 'utf8'))
  if (drift !== undefined) throw new P11Failed(drift)
  console.log('P11 span review matches the evidence note.')

  const lab = await startP11Lab(join(ARTIFACTS, 'lab'))
  try {
    const keycloak = await runKeycloakTokenChecks(lab.keycloak)
    await writeJson(ARTIFACTS, 'tokens-keycloak.json', keycloak)
    requirePass(keycloak, 'token contract on the OIDC verifier against Keycloak', TOKEN_CHECK_COUNT)

    const http = await runP11HttpChecks(lab)
    await writeJson(ARTIFACTS, 'http.json', http)
    requirePass(http, 'HTTP checks with Keycloak tokens', P11_HTTP_CHECK_NAMES.length)

    for (const platform of PLATFORMS) {
      const checks = await runP11OnPlatform({ platform, lab, artifacts: join(ARTIFACTS, platform) })
      await writeJson(ARTIFACTS, `device-${platform}.json`, checks)
      requirePass(checks, `device checks on ${platform}`, P11_DEVICE_CHECK_NAMES.length)
    }

    const controls: Array<CheckResult> = []
    for (const control of Object.keys(P11_DEVICE_CONTROLS) as Array<P11DeviceControl>) {
      const checks = await runP11OnPlatform({
        platform: 'web',
        lab,
        control,
        artifacts: join(ARTIFACTS, 'controls'),
      })
      await writeJson(ARTIFACTS, `control-${control}.json`, checks)
      const judged = judgeControl(control, checks)
      controls.push(judged)
      console.log(`P11 ${judged.status} ${judged.name}: ${judged.detail}`)
    }
    await writeJson(ARTIFACTS, 'controls.json', controls)
    requirePass(controls, 'positive controls on web', Object.keys(P11_DEVICE_CONTROLS).length)
  } finally {
    await lab.stop()
  }

  console.log(
    'P11 passed: one token contract on the fake and on Keycloak; membership, actor, server-only data, revocation, acceptance time and blobs enforced on the authenticated protocol; Keycloak tokens over HTTP; PKCE sign-in, cross-organization denial, token storage, sign-in needed and one replica per provider account on iOS, Android and web; each device control failed its check.',
  )
}

run().catch((error) => {
  console.error(error instanceof P11Failed ? error.message : error)
  process.exit(1)
})
