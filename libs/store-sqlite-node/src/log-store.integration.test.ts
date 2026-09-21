import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import {
  makeMutableClock,
  P04_CHECK_COUNT,
  P05_CHECK_COUNT,
  P06_DATOM_CHECK_COUNT,
  P07_HOST_CHECK_COUNT,
  runChangesetChecks,
  runCrashMatrix,
  runHappyPath,
  runLaunchSweepChecks,
  runLogStoreChecks,
  runUnscoped,
  withTempDirectory,
} from '@viviefs/testing'
import { sqliteNodeLogStore } from './layer.ts'

const WALL = 1_700_000_000_000

describe('sqlite-node log store', () => {
  it.live(
    'passes the P04 conformance suite',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p04-node-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const checks = yield* runLogStoreChecks(
          sqliteNodeLogStore({ filename, deviceId: 'p04-node' }),
          clock,
        )
        expect(checks).toHaveLength(P04_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    120_000,
  )

  it.live(
    'passes the P05 changeset suite',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p05-node-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const checks = yield* runChangesetChecks(
          sqliteNodeLogStore({ filename, deviceId: 'p05-node' }),
          clock,
        )
        expect(checks).toHaveLength(P05_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    120_000,
  )

  it.live(
    'executes a datom-backed workflow without a crash',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p06-tiny-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const result = yield* runUnscoped(
          runHappyPath(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            clock,
          ).pipe(Effect.timeout('8 seconds')),
        )
        expect(result.hash.startsWith('blob:')).toBe(true)
        expect(result.visible).toBeGreaterThan(0)
      }),
    20_000,
  )

  it.live(
    'passes the P06 crash matrix',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p06-node-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const checks = yield* runUnscoped(
          runCrashMatrix(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            clock,
          ),
        )
        expect(checks).toHaveLength(P06_DATOM_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    180_000,
  )

  it.live(
    'passes the P07 host launch-sweep checks',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p07-node-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const checks = yield* runUnscoped(
          runLaunchSweepChecks(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            clock,
          ),
        )
        expect(checks).toHaveLength(P07_HOST_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    60_000,
  )
})
