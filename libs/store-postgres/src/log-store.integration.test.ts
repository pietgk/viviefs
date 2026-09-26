import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  makeMutableClock,
  P04_CHECK_COUNT,
  P05_CHECK_COUNT,
  P06_DATOM_CHECK_COUNT,
  P10_ENGINE_CHECK_COUNT,
  P10_PROJECTION_CHECK_COUNT,
  runChangesetChecks,
  runCrashMatrix,
  runLogStoreChecks,
  runTraceJournalChecks,
  runTraceProjectionChecks,
} from '@viviefs/testing'
import { pgliteLogStore } from './layer.ts'

describe('postgres (PGlite) log store', () => {
  it('passes the P04 conformance suite', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p04-pg-'))
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runLogStoreChecks(
          pgliteLogStore({ deviceId: 'p04-pg', dataDir: directory }),
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
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p05-pg-'))
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runChangesetChecks(
          pgliteLogStore({ deviceId: 'p05-pg', dataDir: directory }),
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

  it('passes the P06 crash matrix', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p06-pg-'))
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runCrashMatrix(
          (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
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

  it('passes the P10 engine trace checks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p10-pg-'))
    try {
      const clock = makeMutableClock(1_700_000_000_000)
      const checks = await Effect.runPromise(
        runTraceJournalChecks(
          (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
          clock,
          'p10-pg',
        ),
      )
      expect(checks).toHaveLength(P10_ENGINE_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)

  it('passes the P10 trace projection checks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'viviefs-p10-proj-pg-'))
    try {
      const checks = await Effect.runPromise(
        runTraceProjectionChecks(
          (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
          makeMutableClock(1_700_000_000_000),
          'p10-projection-pg',
        ),
      )
      expect(checks).toHaveLength(P10_PROJECTION_CHECK_COUNT)
      const failed = checks.filter((check) => check.status !== 'PASS')
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 90_000)
})
