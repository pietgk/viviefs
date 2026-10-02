import { describe, expect } from '@effect/vitest'
import { makeMutableClock, P04_CHECK_COUNT, runLogStoreChecks } from '@viviefs/datom/suites'
import { exercise } from '@viviefs/testing/exercise'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Effect from 'effect/Effect'
import * as problem from './problem/store.ts'
import * as solution from './solution/store.ts'

describe('04.01 a store layer', () => {
  exercise({
    id: '04.01',
    problem,
    solution,
    check: (impl: typeof solution) =>
      Effect.scoped(
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-exercise-store-')
          const checks = yield* runLogStoreChecks(impl.logStoreIn(directory, 'learner'), makeMutableClock(1_700_000_000_000))
          expect(checks).toHaveLength(P04_CHECK_COUNT)
          const failed = checks.filter(({ status }) => status !== 'PASS').map(({ name }) => name)
          expect(failed, `log-store/conformance failed: ${failed.join(', ')}`).toEqual([])
        }),
      ),
    failsWith: /log-store\/conformance failed: .*hlc reboot/,
    timeout: 120_000,
  })
})
