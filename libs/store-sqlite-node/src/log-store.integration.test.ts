import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeMutableClock, P04_CHECK_COUNT, P05_CHECK_COUNT, P06_DATOM_CHECK_COUNT, P07_HOST_CHECK_COUNT, runChangesetChecks, runCrashMatrix, runHappyPath, runLaunchSweepChecks, runLogStoreChecks } from '@viviefs/testing'
import { sqliteNodeLogStore } from './layer.ts'

describe('sqlite-node log store', () => {
  it('passes the P04 conformance suite', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p04-node-'))
    const filename = join(directory, 'log.sqlite')
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runLogStoreChecks(
          sqliteNodeLogStore({ filename, deviceId: 'p04-node' }),
          clock,
        ),
      )
      expect(checks).toHaveLength(P04_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 120_000)

  it('passes the P05 changeset suite', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p05-node-'))
    const filename = join(directory, 'log.sqlite')
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runChangesetChecks(
          sqliteNodeLogStore({ filename, deviceId: 'p05-node' }),
          clock,
        ),
      )
      expect(checks).toHaveLength(P05_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 120_000)

  it('executes a datom-backed workflow without a crash', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p06-tiny-'))
    const filename = join(directory, 'log.sqlite')
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const result = await Effect.runPromise(
        runHappyPath(
          (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
          clock,
        ).pipe(Effect.timeout('8 seconds')),
      )
      expect(result.hash.startsWith('blob:')).toBe(true)
      expect(result.visible).toBeGreaterThan(0)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 20_000)

  it('passes the P06 crash matrix', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p06-node-'))
    const filename = join(directory, 'log.sqlite')
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runCrashMatrix(
          (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
          clock,
        ),
      )
      expect(checks).toHaveLength(P06_DATOM_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 180_000)

  it('passes the P07 host launch-sweep checks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p07-node-'))
    const filename = join(directory, 'log.sqlite')
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runLaunchSweepChecks(
          (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
          clock,
        ),
      )
      expect(checks).toHaveLength(P07_HOST_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)
})
