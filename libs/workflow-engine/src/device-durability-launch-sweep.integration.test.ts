import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { makeMutableClock } from '@viviefs/datom/suites'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import {
  P07_HOST_CHECK_COUNT,
  runLaunchSweepChecks,
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
      `passes device-durability/launch-sweep on ${store.name}`,
      () =>
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-p07-')
          const checks = yield* runUnscoped(
            runLaunchSweepChecks(store.open(directory), makeMutableClock(WALL)),
          )
          expect(checks).toHaveLength(P07_HOST_CHECK_COUNT)
          const failed = checks.filter((check) => check.status !== 'PASS')
          expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
        }),
      runsSuite('device-durability/launch-sweep', 60_000),
    )
  }
})
