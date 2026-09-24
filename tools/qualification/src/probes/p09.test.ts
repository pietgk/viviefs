import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { P09_CHECK_COUNT, runP09 } from './p09-checks.ts'
import { spanReviewDrift } from './p09-spans.ts'
import { runUnscoped } from '@viviefs/testing'

const EVIDENCE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/evidence/2026-09-22-p09.md',
)

describe('P09 sync', () => {
  it.live(
    'replicates datoms with server authority',
    () =>
      runUnscoped(
        runP09().pipe(
          Effect.map(({ checks, spans }) => {
            expect(checks).toHaveLength(P09_CHECK_COUNT)
            const failed = checks.filter((check) => check.status !== 'PASS')
            expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
            const drift = spanReviewDrift(spans, readFileSync(EVIDENCE, 'utf8'))
            expect(drift).toBeUndefined()
          }),
        ),
      ),
    60_000,
  )
})
