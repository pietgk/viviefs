import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { runUnscoped } from '@viviefs/testing'
import { P11_NODE_CHECK_COUNT, runP11Node } from './p11-checks.ts'

describe('P11 identity on Node', () => {
  it.live(
    'enforces membership, actor and server-only data on the authenticated protocol',
    () =>
      runUnscoped(
        runP11Node().pipe(
          Effect.map(({ checks }) => {
            expect(checks).toHaveLength(P11_NODE_CHECK_COUNT)
            const failed = checks.filter((check) => check.status !== 'PASS')
            expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
          }),
        ),
      ),
    120_000,
  )
})
