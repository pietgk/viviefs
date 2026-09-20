import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeMutableClock, P04_CHECK_COUNT, runLogStoreChecks } from '@viviefs/testing'
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
})
