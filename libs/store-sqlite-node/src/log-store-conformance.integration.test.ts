import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { makeMutableClock, P04_CHECK_COUNT, runLogStoreChecks } from '@viviefs/datom/suites'
import { runsSuite } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import { sqliteNodeLogStore } from './layer.ts'

describe('sqlite-node log store', () => {
  it.live(
    'passes log-store/conformance',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p04-node-')
        const checks = yield* runLogStoreChecks(
          sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId: 'p04-node' }),
          makeMutableClock(1_700_000_000_000),
        )
        expect(checks).toHaveLength(P04_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    runsSuite('log-store/conformance', 120_000),
  )
})
