/**
 * The trace projector half of P10, on the same crash-and-resume run as the
 * engine checks (`trace-scenario.ts`). A fake sink records what it
 * acknowledged, or refuses on purpose.
 *
 * Order matters and mirrors the gate text: the projector first runs with
 * its trace cursor disabled (nothing may leave), then against a refusing
 * sink (the cursor may not move), then against an accepting sink (the whole
 * backlog must arrive), then from a fresh cursor (the same spans again).
 */
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { activityId, clockId, deferredId, HlcClock } from '@viviefs/datom'
import {
  SinkRejected,
  TraceProjector,
  TraceSink,
  traceProjectorLayer,
  type DurableSpan,
} from '@viviefs/telemetry'
import { spanIdFor, traceIdFor } from '@viviefs/workflow-engine'
import type { StoreFactory } from './crash-matrix.ts'
import type { CheckResult, MutableClock } from './log-store-conformance.ts'
import { P10_ORG, runTraceScenario, type TraceScenario } from './trace-scenario.ts'

export const P10_PROJECTION_CHECK_NAMES = [
  'one trace',
  'deterministic ids',
  'no duplicates on replay',
  'attempts linked',
  'failed send keeps the cursor',
  'disabled trace cursor keeps the backlog',
] as const

export const P10_PROJECTION_CHECK_COUNT = P10_PROJECTION_CHECK_NAMES.length

const PROJECTOR_DEVICE = 'p10-projector'

type Tick = {
  readonly enabled: boolean
  readonly failed: boolean
  readonly sent: ReadonlyArray<DurableSpan>
  readonly cursorBefore: number
  readonly cursorAfter: number
}

/** One export tick against a fake sink that accepts or refuses. */
const tick = (
  openStore: StoreFactory,
  clock: MutableClock,
  options: { readonly sink: string; readonly enabled: boolean; readonly accept: boolean },
): Effect.Effect<Tick> =>
  Effect.scoped(
    Effect.gen(function* () {
      const sent: Array<DurableSpan> = []
      const sink = Layer.succeed(
        TraceSink,
        TraceSink.of({
          name: options.sink,
          send: (spans) =>
            options.accept
              ? Effect.sync(() => {
                  sent.push(...spans)
                })
              : Effect.fail(new SinkRejected({ sink: options.sink, reason: 'refused on purpose' })),
        }),
      )
      const ctx = yield* Layer.build(
        traceProjectorLayer({ enabled: options.enabled }).pipe(
          Layer.provide(sink),
          Layer.provide(openStore(PROJECTOR_DEVICE)),
          Layer.provide(Layer.succeed(HlcClock, clock.service)),
        ),
      )
      const projector = yield* TraceProjector.pipe(Effect.provide(ctx))
      const cursorBefore = yield* projector.cursor
      const exit = yield* Effect.exit(projector.exportOnce)
      const cursorAfter = yield* projector.cursor
      return {
        enabled: options.enabled,
        failed: Exit.isFailure(exit),
        sent,
        cursorBefore,
        cursorAfter,
      }
    }),
  ).pipe(Effect.orDie)

export type ProjectionRun = {
  readonly run: TraceScenario
  readonly disabled: Tick
  readonly refused: Tick
  readonly accepted: Tick
  readonly again: Tick
  readonly fresh: Tick
}

export const runTraceProjection = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
): Effect.Effect<ProjectionRun> =>
  Effect.gen(function* () {
    const run = yield* runTraceScenario(openStore, clock, nonce)
    const disabled = yield* tick(openStore, clock, { sink: 'primary', enabled: false, accept: true })
    const refused = yield* tick(openStore, clock, { sink: 'primary', enabled: true, accept: false })
    const accepted = yield* tick(openStore, clock, { sink: 'primary', enabled: true, accept: true })
    const again = yield* tick(openStore, clock, { sink: 'primary', enabled: true, accept: true })
    const fresh = yield* tick(openStore, clock, { sink: 'replay', enabled: true, accept: true })
    return { run, disabled, refused, accepted, again, fresh }
  })

/** Every span the run should produce, by entity-keyed id. */
export const expectedSpanIds = (run: TraceScenario): ReadonlyMap<string, string> => {
  const exec = run.executionId
  return new Map([
    [spanIdFor(run.executionEntity), 'workflow TraceProbe.v1'],
    [spanIdFor(activityId(P10_ORG, exec, 'step-one', 1)), 'activity step-one #1'],
    [spanIdFor(activityId(P10_ORG, exec, 'fetch', 1)), 'activity fetch #1'],
    [spanIdFor(activityId(P10_ORG, exec, 'fetch', 2)), 'activity fetch #2'],
    [spanIdFor(deferredId(P10_ORG, exec, 'approval')), 'deferred approval'],
    [spanIdFor(clockId(P10_ORG, exec, 'wait')), 'clock wait'],
    [spanIdFor(activityId(P10_ORG, exec, 'upload', 1)), 'activity upload #1'],
  ])
}

type Verdict = { readonly ok: boolean; readonly detail: string }
const pass = (detail: unknown): Verdict => ({ ok: true, detail: JSON.stringify(detail) })
const fail = (detail: string): Verdict => ({ ok: false, detail })

const bySpanId = (spans: ReadonlyArray<DurableSpan>) =>
  [...spans].sort((left, right) => (left.spanId < right.spanId ? -1 : 1))

const oneTrace = (p: ProjectionRun): Verdict => {
  const traceId = traceIdFor(p.run.executionEntity)
  const others = p.accepted.sent.filter((span) => span.traceId !== traceId)
  if (p.accepted.sent.length === 0) return fail('no spans were exported')
  if (others.length > 0) {
    return fail(`spans outside the execution trace: ${others.map((span) => span.name).join(', ')}`)
  }
  const ids = new Set(p.accepted.sent.map((span) => span.spanId))
  for (const live of p.run.liveSpans.filter((span) => span.name === 'p10.step-one.work')) {
    const parent = Option.getOrUndefined(live.parent)
    if (live.traceId !== traceId || !parent || !ids.has(parent.spanId)) {
      return fail(`live span ${live.spanId} is not under an exported durable span`)
    }
  }
  return pass({ traceId, spans: p.accepted.sent.length })
}

const deterministicIds = (p: ProjectionRun): Verdict => {
  const expected = expectedSpanIds(p.run)
  const got = new Map(p.accepted.sent.map((span) => [span.spanId, span.name]))
  for (const [id, name] of expected) {
    if (got.get(id) !== name) return fail(`expected ${name} with id ${id}, got ${got.get(id) ?? 'nothing'}`)
  }
  if (got.size !== expected.size) return fail(`expected ${expected.size} spans, got ${got.size}`)
  const first = JSON.stringify(bySpanId(p.accepted.sent))
  const second = JSON.stringify(bySpanId(p.fresh.sent))
  if (first !== second) return fail('a fresh trace cursor derived different spans from the same log')
  return pass({ ids: expected.size, freshCursorIdentical: true })
}

const noDuplicates = (p: ProjectionRun): Verdict => {
  const ids = p.accepted.sent.map((span) => span.spanId)
  if (new Set(ids).size !== ids.length) return fail(`duplicate span ids in one export: ${ids.join(', ')}`)
  const stepOne = p.accepted.sent.filter((span) => span.name.startsWith('activity step-one'))
  const runs = p.run.bodyRuns.get('step-one') ?? 0
  if (runs !== 2 || stepOne.length !== 1) {
    return fail(`step-one body ran ${runs} time(s) and produced ${stepOne.length} span(s)`)
  }
  if (p.again.sent.length !== 0) return fail(`a second tick re-sent ${p.again.sent.length} span(s)`)
  return pass({ bodyRuns: runs, stepOneSpans: 1, secondTick: 0 })
}

const attemptsLinked = (p: ProjectionRun): Verdict => {
  const first = p.accepted.sent.find((span) => span.name === 'activity fetch #1')
  const second = p.accepted.sent.find((span) => span.name === 'activity fetch #2')
  if (!first || !second) return fail('missing a fetch attempt span')
  if (first.status !== 'error') return fail(`fetch #1 status ${first.status}`)
  const link = second.links.find((candidate) => candidate.attributes['viviefs.link'] === 'previous-attempt')
  if (link?.spanId !== first.spanId) return fail(`fetch #2 links ${link?.spanId ?? 'nothing'}, expected ${first.spanId}`)
  return pass({ from: second.spanId, to: first.spanId })
}

const failedSendKeepsCursor = (p: ProjectionRun): Verdict => {
  if (!p.refused.failed) return fail('a refused send did not fail the tick')
  if (p.refused.cursorAfter !== p.refused.cursorBefore) {
    return fail(`cursor moved from ${p.refused.cursorBefore} to ${p.refused.cursorAfter} on a refused send`)
  }
  return pass({ cursor: p.refused.cursorAfter })
}

const disabledKeepsBacklog = (p: ProjectionRun): Verdict => {
  if (p.disabled.sent.length !== 0) return fail(`a disabled cursor sent ${p.disabled.sent.length} span(s)`)
  if (p.disabled.cursorAfter !== 0) return fail(`a disabled cursor moved to ${p.disabled.cursorAfter}`)
  const last = Math.max(...p.run.rows.map((row) => row.seq))
  if (p.accepted.cursorAfter < last) {
    return fail(`re-enabled cursor stopped at ${p.accepted.cursorAfter}, the journal ends at ${last}`)
  }
  if (p.accepted.sent.length !== expectedSpanIds(p.run).size) {
    return fail(`re-enabling exported ${p.accepted.sent.length} of ${expectedSpanIds(p.run).size} spans`)
  }
  return pass({ disabledSent: 0, backlogExported: p.accepted.sent.length, cursor: p.accepted.cursorAfter })
}

const verdicts: ReadonlyArray<
  readonly [(typeof P10_PROJECTION_CHECK_NAMES)[number], (p: ProjectionRun) => Verdict]
> = [
  ['one trace', oneTrace],
  ['deterministic ids', deterministicIds],
  ['no duplicates on replay', noDuplicates],
  ['attempts linked', attemptsLinked],
  ['failed send keeps the cursor', failedSendKeepsCursor],
  ['disabled trace cursor keeps the backlog', disabledKeepsBacklog],
]

export const judgeTraceProjection = (p: ProjectionRun): CheckResult[] =>
  verdicts.map(([name, judge]) => {
    const verdict = judge(p)
    return { name, status: verdict.ok ? ('PASS' as const) : ('FAIL' as const), detail: verdict.detail }
  })

export const runTraceProjectionChecks = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
): Effect.Effect<CheckResult[]> =>
  runTraceProjection(openStore, clock, nonce).pipe(
    Effect.map(judgeTraceProjection),
    Effect.catchCause((cause) =>
      Effect.succeed(
        P10_PROJECTION_CHECK_NAMES.map((name) => ({
          name,
          status: 'FAIL' as const,
          detail: `projection run failed: ${String(cause).split('\n').slice(0, 6).join(' | ')}`,
        })),
      ),
    ),
  )
