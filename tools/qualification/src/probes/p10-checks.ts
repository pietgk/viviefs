/**
 * P10 check 5: the same durable spans arrive in motel, Jaeger and
 * otel-lgtm. One crash-and-resume run on sqlite-node with a real-time HLC
 * clock, exported by the trace projector through the OTLP sink, then read
 * back from each sink by trace id.
 */
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { HlcClock } from '@viviefs/datom'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  TraceProjector,
  otlpTraceSink,
  traceProjectorLayer,
} from '@viviefs/telemetry'
import type { MutableClock } from '@viviefs/datom/suites'
import { expectedSpanIds } from '@viviefs/telemetry/suites'
import type { CheckResult } from '@viviefs/testing'
import {
  runTraceScenario,
  type StoreFactory,
  type TraceScenario,
} from '@viviefs/workflow-engine/suites'
import { spanIdFor, traceIdFor } from '@viviefs/workflow-engine'
import { P10_SINKS, waitForSpanIds, type P10Sink, type SinkSpan } from './p10-sinks.ts'

export const P10_SERVICE = 'viviefs-p10'

/** Wall-clock HLC source for the probe; activity bodies still add work time. */
export const liveMutableClock = (): MutableClock => {
  let wallOffset = 0
  let monoOffset = 0
  const wall = () => Date.now() + wallOffset
  const monotonic = () => performance.now() + monoOffset
  return {
    service: HlcClock.of({ wallMs: wall, monotonicMs: monotonic }),
    wall,
    monotonic,
    setWall: (ms) => {
      wallOffset = ms - Date.now()
    },
    setMonotonic: (ms) => {
      monoOffset = ms - performance.now()
    },
    advance: (ms) => {
      wallOffset += ms
      monoOffset += ms
    },
  }
}

export type SinkReport = {
  readonly sink: string
  readonly viewer: string
  readonly before: number
  readonly spans: ReadonlyArray<SinkSpan>
  readonly check: CheckResult
}

export type SinkRun = {
  readonly run: TraceScenario
  readonly traceId: string
  readonly reports: ReadonlyArray<SinkReport>
}

const exportTo = (openStore: StoreFactory, clock: MutableClock, sink: P10Sink) =>
  Effect.scoped(
    Effect.gen(function* () {
      const ctx = yield* Layer.build(
        traceProjectorLayer({ enabled: true }).pipe(
          Layer.provide(
            otlpTraceSink({ name: sink.name, baseUrl: sink.otlpBaseUrl, serviceName: P10_SERVICE }),
          ),
          Layer.provide(openStore('p10-projector')),
          Layer.provide(Layer.succeed(HlcClock, clock.service)),
        ),
      )
      return yield* TraceProjector.pipe(
        Effect.flatMap((projector) => projector.exportOnce),
        Effect.provide(ctx),
      )
    }),
  )

const judge = (
  sink: P10Sink,
  expected: ReadonlyMap<string, string>,
  root: string,
  before: number,
  spans: ReadonlyArray<SinkSpan>,
): CheckResult => {
  const name = `sink ${sink.name}`
  const problem = (() => {
    if (before !== 0) return `the sink already held ${before} span(s) for this trace before the export`
    const ids = new Set(spans.map((span) => span.spanId))
    const missing = [...expected.keys()].filter((id) => !ids.has(id))
    const extra = [...ids].filter((id) => !expected.has(id))
    if (missing.length > 0 || extra.length > 0) {
      return `missing ${missing.map((id) => expected.get(id)).join(', ') || 'none'}; unexpected ${extra.join(', ') || 'none'}`
    }
    for (const span of spans) {
      const parent = span.spanId === root ? undefined : root
      if (span.parentSpanId !== parent) {
        return `${span.name}: parent ${span.parentSpanId ?? 'none'}, expected ${parent ?? 'none'}`
      }
    }
    return undefined
  })()
  return problem === undefined
    ? { name, status: 'PASS', detail: JSON.stringify({ spans: spans.length }) }
    : { name, status: 'FAIL', detail: problem }
}

/**
 * Start each sink, export the run to it, and require exactly the expected
 * span ids with the workflow span as every other span's parent. `keep`
 * leaves the containers running so a person can open the viewers.
 */
export const runSinkChecks = async (options: {
  readonly artifacts: string
  readonly keep: boolean
  readonly sinks?: ReadonlyArray<P10Sink>
}): Promise<SinkRun> => {
  const directory = await mkdtemp(join(tmpdir(), 'viviefs-p10-sinks-'))
  const filename = join(directory, 'log.sqlite')
  const openStore: StoreFactory = (deviceId) => sqliteNodeLogStore({ filename, deviceId })
  const clock = liveMutableClock()
  const sinks = options.sinks ?? P10_SINKS
  try {
    const nonce = `p10-${Date.now()}-${randomBytes(4).toString('hex')}`
    const run = await Effect.runPromise(runTraceScenario(openStore, clock, nonce))
    const traceId = traceIdFor(run.executionEntity)
    const expected = expectedSpanIds(run)
    const root = spanIdFor(run.executionEntity)
    const reports: Array<SinkReport> = []
    for (const sink of sinks) {
      console.log(`P10 starting ${sink.name}...`)
      await sink.start(options.artifacts)
      try {
        const before = (await sink.spans(traceId)).length
        await Effect.runPromise(exportTo(openStore, clock, sink))
        const spans = await waitForSpanIds(sink, traceId, new Set(expected.keys()), 30_000)
        const check = judge(sink, expected, root, before, spans)
        console.log(`P10 ${check.name}: ${check.status} ${check.detail}`)
        reports.push({ sink: sink.name, viewer: sink.viewer(traceId), before, spans, check })
      } finally {
        if (!options.keep) await sink.stop()
      }
    }
    return { run, traceId, reports }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
