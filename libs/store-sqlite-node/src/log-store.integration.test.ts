import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import type * as Tracer from 'effect/Tracer'
import { join } from 'node:path'
import {
  makeMutableClock,
  P04_CHECK_COUNT,
  P05_CHECK_COUNT,
  P06_DATOM_CHECK_COUNT,
  P07_HOST_CHECK_COUNT,
  P10_ENGINE_CHECK_COUNT,
  P10_PROJECTION_CHECK_COUNT,
  runChangesetChecks,
  runCrashMatrix,
  runHappyPath,
  runLaunchSweepChecks,
  runLogStoreChecks,
  judgeTraceJournal,
  judgeTraceProjection,
  runTraceJournalChecks,
  runTraceProjection,
  runTraceProjectionChecks,
  runTraceScenario,
  runUnscoped,
} from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
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

  it.live(
    'passes the P10 engine trace checks',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-node-')
        const filename = join(directory, 'log.sqlite')
        const clock = makeMutableClock(WALL)
        const checks = yield* runUnscoped(
          runTraceJournalChecks(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            clock,
            'p10-node',
          ),
        )
        expect(checks).toHaveLength(P10_ENGINE_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    60_000,
  )

  it.live(
    'fails each P10 engine trace check on a broken journal',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-broken-')
        const filename = join(directory, 'log.sqlite')
        const run = yield* runUnscoped(
          runTraceScenario(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            makeMutableClock(WALL),
            'p10-broken',
          ),
        )
        const failed = (broken: Parameters<typeof judgeTraceJournal>[0]) =>
          judgeTraceJournal(broken)
            .filter((check) => check.status === 'FAIL')
            .map((check) => check.name)
        expect(failed(run)).toEqual([])
        const started = run.rows.find((row) => row.a === 'viviefs/activity/started')
        expect(started).toBeDefined()
        expect(
          failed({ ...run, rows: [...run.rows, { ...started!, seq: 999 }] }),
        ).toEqual(['start fact once per attempt'])
        expect(
          failed({ ...run, bodyRuns: new Map([...run.bodyRuns, ['step-one', 1]]) }),
        ).toEqual(['killed body keeps its first start'])
        const zeroed = new Map(
          [...run.envelopes].map(([cs, envelope]) => [
            cs,
            { ...envelope, traceId: '0'.repeat(32), spanId: '0'.repeat(16) },
          ]),
        )
        expect(failed({ ...run, envelopes: zeroed })).toEqual([
          'caller causing span',
          'engine causing span',
        ])
        const wrapper = { name: 'step-one' } as unknown as Tracer.NativeSpan
        expect(
          failed({ ...run, liveSpans: [...run.liveSpans, wrapper] }),
        ).toEqual(['live spans only in activity bodies'])
      }),
    60_000,
  )

  it.live(
    'passes the P10 trace projection checks',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-proj-')
        const filename = join(directory, 'log.sqlite')
        const checks = yield* runUnscoped(
          runTraceProjectionChecks(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
            makeMutableClock(WALL),
            'p10-projection',
          ),
        )
        expect(checks).toHaveLength(P10_PROJECTION_CHECK_COUNT)
        const failed = checks.filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
      }),
    60_000,
  )

  it.live(
    'fails each P10 trace projection check on a broken export',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-proj-broken-')
        const filename = join(directory, 'log.sqlite')
        const p = yield* runUnscoped(
          runTraceProjection(
            (deviceId) => sqliteNodeLogStore({ filename, deviceId }),
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
        const first = sent[0]!
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
    60_000,
  )
})
