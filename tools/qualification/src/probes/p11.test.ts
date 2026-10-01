import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { P11_NODE_CHECK_COUNT, runMembershipChecks } from './p11-checks.ts'
import { spanReviewDrift } from './p11-spans.ts'

const EVIDENCE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/evidence/2026-09-28-p11.md',
)

describe('P11 identity on Node', () => {
  it.live(
    'enforces membership, actor and server-only data on the authenticated protocol',
    () =>
      runUnscoped(
        runMembershipChecks.pipe(
          Effect.map(({ checks, spans }) => {
            expect(checks).toHaveLength(P11_NODE_CHECK_COUNT)
            const failed = checks.filter((check) => check.status !== 'PASS')
            expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
            expect(spanReviewDrift(spans, readFileSync(EVIDENCE, 'utf8'))).toBeUndefined()
          }),
        ),
      ),
    runsSuite('identity/membership', 120_000),
  )
})
