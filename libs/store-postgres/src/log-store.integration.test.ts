import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeMutableClock, P04_CHECK_COUNT, P05_CHECK_COUNT, runChangesetChecks, runLogStoreChecks } from '@viviefs/testing'
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
})
