import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { makeMutableClock } from '@viviefs/datom/suites'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import type { StoreFactory } from '@viviefs/workflow-engine/suites'
import {
  P10_PROJECTION_CHECK_COUNT,
  judgeTraceProjection,
  runTraceProjection,
  runTraceProjectionChecks,
} from './suites/index.ts'

const WALL = 1_700_000_000_000

type StoreUnderTest = { name: string; open: (directory: string) => StoreFactory }

const SQLITE_NODE: StoreUnderTest = {
  name: 'sqlite-node',
  open: (directory) => (deviceId) =>
    sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId }),
}

const STORES: ReadonlyArray<StoreUnderTest> = [
  SQLITE_NODE,
  {
    name: 'PGlite',
    open: (directory) => (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
  },
]

describe('trace projector', () => {
  for (const store of STORES) {
    it.live(
      `passes tracing/projection on ${store.name}`,
      () =>
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-p10-proj-')
          const checks = yield* runUnscoped(
            runTraceProjectionChecks(store.open(directory), makeMutableClock(WALL), 'p10-projection'),
          )
          expect(checks).toHaveLength(P10_PROJECTION_CHECK_COUNT)
          const failed = checks.filter((check) => check.status !== 'PASS')
          expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
        }),
      runsSuite('tracing/projection', 90_000),
    )
  }

  it.live(
    'fails each tracing/projection check on a broken export (positive control)',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-proj-broken-')
        const p = yield* runUnscoped(
          runTraceProjection(
            SQLITE_NODE.open(directory),
            makeMutableClock(WALL),
            'p10-projection-broken',
          ),
        )
        const failed = (broken: Parameters<typeof judgeTraceProjection>[0]) =>
          judgeTraceProjection(broken)
            .filter((check) => check.status === 'FAIL')
            .map((check) => check.name)
        expect(failed(p)).toEqual([])
        const sent = p.accepted.sent
        const first = sent[0]
        if (first === undefined) return yield* Effect.die('the projection sent no spans')
        const foreign = { ...first, traceId: 'a'.repeat(32) }
        expect(failed({ ...p, accepted: { ...p.accepted, sent: [foreign, ...sent.slice(1)] } })).toContain('one trace')
        expect(
          failed({ ...p, fresh: { ...p.fresh, sent: p.fresh.sent.map((span) => ({ ...span, endMs: span.endMs + 1 })) } }),
        ).toEqual(['deterministic ids'])
        expect(failed({ ...p, again: { ...p.again, sent: [first] } })).toEqual(['no duplicates on replay'])
        const unlinked = sent.map((span) =>
          span.name === 'activity fetch #2' ? { ...span, links: [] } : span,
        )
        const unlinkTick = (tick: (typeof p.batched)[number]) => ({
          ...tick,
          sent: tick.sent.map((span) => (span.name === 'activity fetch #2' ? { ...span, links: [] } : span)),
        })
        expect(
          failed({
            ...p,
            accepted: { ...p.accepted, sent: unlinked },
            fresh: { ...p.fresh, sent: unlinked },
            batched: p.batched.map(unlinkTick),
          }),
        ).toEqual(['attempts linked'])
        expect(failed({ ...p, refused: { ...p.refused, cursorAfter: 5 } })).toEqual(['failed send keeps the cursor'])
        expect(failed({ ...p, disabled: { ...p.disabled, sent: [first] } })).toEqual([
          'disabled trace cursor keeps the backlog',
        ])
        expect(
          failed({ ...p, compactWhileDisabled: { ...p.compactWhileDisabled, removed: 3, heldBy: null } }),
        ).toEqual(['disabled trace cursor holds compaction'])
        expect(failed({ ...p, batched: p.batched.slice(0, 1) })).toEqual([
          'small batches export the same spans',
        ])
      }),
    runsSuite('tracing/projection', 60_000),
  )
})
