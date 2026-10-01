import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { makeMutableClock } from '@viviefs/datom/suites'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import {
  P06_DATOM_CHECK_COUNT,
  runCrashMatrix,
  runHappyPath,
  runMemoryDurabilityControl,
  type StoreFactory,
} from './suites/index.ts'

const WALL = 1_700_000_000_000

const STORES: ReadonlyArray<{ name: string; open: (directory: string) => StoreFactory }> = [
  {
    name: 'sqlite-node',
    open: (directory) => (deviceId) =>
      sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId }),
  },
  {
    name: 'PGlite',
    open: (directory) => (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
  },
]

describe('datom-backed engine', () => {
  for (const store of STORES) {
    it.live(
      `runs a workflow to completion on ${store.name}`,
      () =>
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-p06-tiny-')
          const result = yield* runUnscoped(
            runHappyPath(store.open(directory), makeMutableClock(WALL)).pipe(
              Effect.timeout('8 seconds'),
            ),
          )
          expect(result.hash.startsWith('blob:')).toBe(true)
          expect(result.visible).toBeGreaterThan(0)
        }),
      runsSuite('durable-workflow/crash-matrix', 20_000),
    )

    it.live(
      `passes durable-workflow/crash-matrix on ${store.name}`,
      () =>
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-p06-')
          const checks = yield* runUnscoped(
            runCrashMatrix(store.open(directory), makeMutableClock(WALL)),
          )
          expect(checks).toHaveLength(P06_DATOM_CHECK_COUNT)
          const failed = checks.filter((check) => check.status !== 'PASS')
          expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
        }),
      runsSuite('durable-workflow/crash-matrix', 180_000),
    )
  }

  it.live(
    'fails durability on the memory engine (positive control)',
    () =>
      Effect.gen(function* () {
        const control = yield* runUnscoped(runMemoryDurabilityControl())
        expect(control.status, control.detail).toBe('PASS')
      }),
    runsSuite('durable-workflow/crash-matrix', 60_000),
  )
})
