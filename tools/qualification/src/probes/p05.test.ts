import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { CHANGESET_TTL_MS } from '@viviefs/datom'
import {
  makeMutableClock,
  P05_CHECK_COUNT,
  P05_CHECK_NAMES,
  runChangesetChecks,
} from '@viviefs/datom/suites'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'

describe('P05 changeset picks', () => {
  it('pins a 24 hour open-changeset TTL', () => {
    expect(CHANGESET_TTL_MS).toBe(86_400_000)
  })

  it('names the conformance checks including the incomplete-changeset positive control', () => {
    expect(P05_CHECK_COUNT).toBe(22)
    expect(P05_CHECK_NAMES).toContain('incomplete changeset')
    expect(P05_CHECK_NAMES).toContain('basis write-once')
    expect(P05_CHECK_NAMES).toContain('rebuild equals incremental')
    expect(P05_CHECK_NAMES).toContain('reactivity keys')
  })

  it.live(
    'keeps the typed read model true on a real store',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p05-unit-')
        const checks = yield* runChangesetChecks(
          sqliteNodeLogStore({
            filename: join(directory, 'log.sqlite'),
            deviceId: 'p05-unit',
          }),
          makeMutableClock(1_700_000_000_000),
        )
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    60_000,
  )
})
