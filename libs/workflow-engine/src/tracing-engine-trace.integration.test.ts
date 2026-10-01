import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import type * as Tracer from 'effect/Tracer'
import { join } from 'node:path'
import { makeMutableClock } from '@viviefs/datom/suites'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { runsSuite, runUnscoped } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import {
  P10_ENGINE_CHECK_COUNT,
  judgeTraceJournal,
  runTraceJournalChecks,
  runTraceScenario,
  type StoreFactory,
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

describe('datom-backed engine', () => {
  for (const store of STORES) {
    it.live(
      `passes tracing/engine-trace on ${store.name}`,
      () =>
        Effect.gen(function* () {
          const directory = yield* withTempDirectory('viviefs-p10-')
          const checks = yield* runUnscoped(
            runTraceJournalChecks(store.open(directory), makeMutableClock(WALL), 'p10-engine'),
          )
          expect(checks).toHaveLength(P10_ENGINE_CHECK_COUNT)
          const failed = checks.filter((check) => check.status !== 'PASS')
          expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
        }),
      runsSuite('tracing/engine-trace', 60_000),
    )
  }

  it.live(
    'fails each tracing/engine-trace check on a broken journal (positive control)',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-broken-')
        const run = yield* runUnscoped(
          runTraceScenario(
            SQLITE_NODE.open(directory),
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
        if (started === undefined) return yield* Effect.die('the scenario journals no activity start')
        expect(
          failed({ ...run, rows: [...run.rows, { ...started, seq: 999 }] }),
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
    runsSuite('tracing/engine-trace', 60_000),
  )
})
