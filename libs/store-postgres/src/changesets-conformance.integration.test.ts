import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { makeMutableClock, P05_CHECK_COUNT, runChangesetChecks } from '@viviefs/datom/suites'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import { pgliteLogStore } from './layer.ts'

describe('postgres (PGlite) log store', () => {
  it.live(
    'passes changesets/conformance',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p05-pg-')
        const checks = yield* runUnscoped(
          runChangesetChecks(
            pgliteLogStore({ deviceId: 'p05-pg', dataDir: directory }),
            makeMutableClock(1_700_000_000_000),
          ),
        )
        expect(checks).toHaveLength(P05_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    runsSuite('changesets/conformance', 120_000),
  )
})
