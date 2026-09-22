import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { P09_CHECK_COUNT, runP09 } from './p09-checks.ts'
import { runUnscoped } from '@viviefs/testing'

describe('P09 sync', () => {
  it.live(
    'replicates datoms with server authority',
    () =>
      runUnscoped(
        runP09().pipe(
          Effect.map((checks) => {
            expect(checks).toHaveLength(P09_CHECK_COUNT)
            const failed = checks.filter((check) => check.status !== 'PASS')
            expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
          }),
        ),
      ),
    60_000,
  )
})
