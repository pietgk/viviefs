/**
 * P11 check 1 against a real identity provider: the token contract that the
 * fake issuer passes, run against Keycloak on Apple Container. The suite is
 * the same; only the token source differs (ADR-0022, Q4).
 *
 * Run alone (no ledger entry): `node --experimental-strip-types
 * tools/qualification/src/probes/p11-keycloak.ts`. The P11 probe calls
 * `runKeycloakTokenChecks` as one of its sections.
 */
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import type { CheckResult } from '@viviefs/testing'
import { runTokenVerifierChecks } from '@viviefs/testing/identity'
import {
  AUDIENCE,
  LAB_USERS,
  startKeycloak,
  type KeycloakLab,
} from './keycloak.ts'

export const runKeycloakTokenChecks = (
  lab: KeycloakLab,
): Promise<ReadonlyArray<CheckResult>> =>
  Effect.runPromise(
    runTokenVerifierChecks({
      verifier: oidcTokenVerifier({
        issuer: lab.issuer,
        audience: AUDIENCE,
      }).pipe(Layer.provide(FetchHttpClient.layer)),
      expected: { issuer: lab.issuer, subject: LAB_USERS.alice.id },
      expectedRoles: LAB_USERS.alice.roles,
      valid: Effect.promise(() => lab.token('alice')),
      foreignIssuer: Effect.promise(() => lab.foreignIssuerToken()),
      foreignAudience: Effect.promise(() => lab.foreignAudienceToken()),
    }),
  )

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifacts = join(ROOT, '.artifacts/qualification/p11')
  await mkdir(artifacts, { recursive: true })
  const lab = await startKeycloak(artifacts)
  try {
    const checks = await runKeycloakTokenChecks(lab)
    for (const check of checks) {
      console.log(`${check.status} ${check.name}: ${check.detail}`)
    }
    if (checks.some((check) => check.status !== 'PASS')) process.exitCode = 1
  } finally {
    await lab.stop()
  }
}
