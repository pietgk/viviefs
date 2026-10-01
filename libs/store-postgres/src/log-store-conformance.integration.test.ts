import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { makeMutableClock, P04_CHECK_COUNT, runLogStoreChecks } from '@viviefs/datom/suites'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import { pgliteLogStore } from './layer.ts'

describe('postgres (PGlite) log store', () => {
  it.live(
    'passes log-store/conformance',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p04-pg-')
        const checks = yield* runUnscoped(
          runLogStoreChecks(
            pgliteLogStore({ deviceId: 'p04-pg', dataDir: directory }),
            makeMutableClock(1_700_000_000_000),
          ),
        )
        expect(checks).toHaveLength(P04_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    runsSuite('log-store/conformance', 120_000),
  )
})
