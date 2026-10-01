/**
 * The P10 crash-and-resume run and the engine half of its checks.
 *
 * One execution of `TraceProbe.v1`: `step-one` is killed after its body ran
 * and before its exit was journaled, a relaunch sweep resumes it, `fetch`
 * fails on attempt 1 and succeeds on attempt 2, a caller completes the
 * `approval` deferred, a durable clock fires, and `upload` finishes. The run
 * returns the execution's journal, every envelope, and the live spans a
 * recording tracer saw. The trace projector checks (P10 step 3) read the
 * same run.
 */
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Latch from 'effect/Latch'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Tracer from 'effect/Tracer'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as DurableClock from 'effect/unstable/workflow/DurableClock'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import {
  activityId,
  Attr,
  clockId,
  deferredId,
  deviceLayer,
  executionId as executionEntity,
  HlcClock,
  LogStore,
  type EnvelopeType,
  type StoredDatomType,
} from '@viviefs/datom'
import {
  armedCrashHook,
  durableContext,
  engineConfigLayer,
  engineLayer,
  EngineSweep,
  noopCrashHook,
  noopWakeScheduler,
  spanIdFor,
  traceIdFor,
  CrashHook,
} from '../index.ts'
import type { StoreFactory } from './crash-matrix.ts'
import type { MutableClock } from '@viviefs/datom/suites'
import type { CheckResult } from '@viviefs/testing'
import { LAB_PERSON } from './lab.ts'

export const P10_ORG = 'p10'
const DEVICE = 'p10-a'
const ACTIVITY_NAMES = ['step-one', 'fetch', 'upload'] as const
/** Simulated work time per activity body, so durable spans have length. */
const WORK_MS = 40

const Approval = DurableDeferred.make('approval')

export const TraceProbe = Workflow.make('TraceProbe.v1', {
  payload: { nonce: Schema.String },
  success: Schema.String,
  error: Schema.String,
  idempotencyKey: ({ nonce }: { nonce: string }) => nonce,
})

type BodyRuns = Map<string, number>

const probeLayer = (clock: MutableClock, runs: BodyRuns) => {
  const ran = (name: string) =>
    Effect.sync(() => {
      runs.set(name, (runs.get(name) ?? 0) + 1)
      clock.advance(WORK_MS)
    })
  return TraceProbe.toLayer(() =>
    Effect.gen(function* () {
      yield* Activity.make({
        name: 'step-one',
        success: Schema.String,
        execute: ran('step-one').pipe(
          Effect.andThen(Effect.succeed('one')),
          Effect.withSpan('p10.step-one.work'),
        ),
      })
      yield* Activity.make({
        name: 'fetch',
        success: Schema.String,
        error: Schema.String,
        execute: Effect.gen(function* () {
          yield* ran('fetch')
          const attempt = yield* Activity.CurrentAttempt
          if (attempt === 1) return yield* Effect.fail('flaky on attempt 1')
          return 'fetched'
        }),
      }).pipe(Activity.retry({ times: 1 }))
      yield* DurableDeferred.await(Approval)
      yield* DurableClock.sleep({
        name: 'wait',
        duration: Duration.millis(50),
        inMemoryThreshold: 0,
      })
      return yield* Activity.make({
        name: 'upload',
        success: Schema.String,
        execute: ran('upload').pipe(Effect.as('blob:p10')),
      })
    }),
  )
}

const session = (
  openStore: StoreFactory,
  clock: MutableClock,
  hook: Layer.Layer<CrashHook>,
  runs: BodyRuns,
) =>
  probeLayer(clock, runs).pipe(
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(openStore(DEVICE)),
    Layer.provide(engineConfigLayer({ org: P10_ORG, actor: LAB_PERSON })),
    Layer.provideMerge(deviceLayer(DEVICE)),
    Layer.provide(hook),
    Layer.provide(noopWakeScheduler),
    Layer.provide(Layer.succeed(HlcClock, clock.service)),
  )

const pollUntil = (
  executionId: string,
  done: (result: Workflow.Result<unknown, unknown>) => boolean,
  label: string,
) =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 400; attempt++) {
      const status = yield* TraceProbe.poll(executionId)
      if (Option.isSome(status) && done(status.value)) return status.value
      yield* Effect.sleep(Duration.millis(25))
    }
    return yield* Effect.die(`${label}: timed out`)
  })

export type SpanContext = {
  readonly traceId: string
  readonly spanId: string
}

export type TraceScenario = {
  readonly executionId: string
  readonly executionEntity: string
  readonly rows: ReadonlyArray<StoredDatomType>
  readonly envelopes: ReadonlyMap<string, EnvelopeType>
  readonly liveSpans: ReadonlyArray<Tracer.NativeSpan>
  readonly command: SpanContext
  readonly approver: SpanContext
  readonly bodyRuns: ReadonlyMap<string, number>
  readonly result: string
}

const contextOf = Effect.map(Effect.currentSpan, (span) => ({
  traceId: span.traceId,
  spanId: span.spanId,
}))

/**
 * Session 1 starts the execution under a `p10.command` span and is killed
 * after `step-one` ran and before its exit was journaled. Session 2 is a
 * relaunch: the launch sweep resumes, a `p10.approve` span completes the
 * deferred, and the execution finishes.
 */
export const runTraceScenario = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
): Effect.Effect<TraceScenario> =>
  Effect.suspend(() => {
    const spans: Array<Tracer.NativeSpan> = []
    const tracer = Tracer.make({
      span(options) {
        const span = new Tracer.NativeSpan(options)
        spans.push(span)
        return span
      },
    })
    return scenario(openStore, clock, nonce, spans).pipe(
      Effect.provideService(Tracer.Tracer, tracer),
      Effect.orDie,
    )
  })

const scenario = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
  spans: ReadonlyArray<Tracer.NativeSpan>,
) =>
  Effect.gen(function* () {
    const runs: BodyRuns = new Map()
    const payload = { nonce }
    const executionId = yield* TraceProbe.executionId(payload)

    const killed = yield* Latch.make()
    const first = session(
      openStore,
      clock,
      armedCrashHook('after-activity-before-journal', killed),
      runs,
    )
    const command = yield* Effect.gen(function* () {
      const context = yield* contextOf
      const fiber = yield* Effect.forkChild(
        TraceProbe.execute(payload, { discard: true }).pipe(
          Effect.andThen(Effect.never),
          Effect.provide(first),
        ),
      )
      yield* killed.await
      yield* Fiber.interrupt(fiber)
      return context
    }).pipe(Effect.withSpan('p10.command'))

    const second = session(openStore, clock, noopCrashHook, runs)
    const { approver, result } = yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(second)
        const use = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
          effect.pipe(Effect.provide(ctx))
        yield* use(EngineSweep.use((sweep) => sweep.sweep()))
        yield* use(
          pollUntil(executionId, (r) => r._tag === 'Suspended', 'approval wait'),
        )
        const approver = yield* use(
          Effect.gen(function* () {
            const context = yield* contextOf
            const token = DurableDeferred.tokenFromExecutionId(Approval, {
              workflow: TraceProbe,
              executionId,
            })
            yield* DurableDeferred.succeed(Approval, {
              token,
              value: undefined,
            })
            return context
          }).pipe(Effect.withSpan('p10.approve')),
        )
        const done = yield* use(
          pollUntil(executionId, (r) => r._tag === 'Complete', 'completion'),
        )
        const exit = done._tag === 'Complete' ? done.exit : undefined
        if (!exit || exit._tag !== 'Success') {
          return yield* Effect.die(`TraceProbe.v1 did not succeed: ${String(exit)}`)
        }
        return { approver, result: String(exit.value) }
      }),
    )

    const entity = executionEntity(P10_ORG, executionId)
    const { rows, envelopes } = yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(
          openStore(DEVICE).pipe(
            Layer.provide(Layer.succeed(HlcClock, clock.service)),
          ),
        )
        const store = yield* LogStore.pipe(Effect.provide(ctx))
        const rows = yield* store.scanPrefix(entity)
        const envelopes = new Map<string, EnvelopeType>()
        for (const row of rows) {
          const envelope = yield* store.envelope(row.cs)
          if (envelope) envelopes.set(row.cs, envelope)
        }
        return { rows, envelopes }
      }),
    )

    return {
      executionId,
      executionEntity: entity,
      rows,
      envelopes,
      liveSpans: spans,
      command,
      approver,
      bodyRuns: runs,
      result,
    } satisfies TraceScenario
  })

export const P10_ENGINE_CHECK_NAMES = [
  'start fact once per attempt',
  'killed body keeps its first start',
  'caller causing span',
  'engine causing span',
  'live spans only in activity bodies',
] as const

export const P10_ENGINE_CHECK_COUNT = P10_ENGINE_CHECK_NAMES.length

type Verdict = { readonly ok: boolean; readonly detail: string }

const pass = (detail: unknown): Verdict => ({
  ok: true,
  detail: JSON.stringify(detail),
})
const fail = (detail: string): Verdict => ({ ok: false, detail })

const facts = (
  run: TraceScenario,
  attribute: string,
  entity?: string,
): ReadonlyArray<StoredDatomType> =>
  run.rows.filter(
    (row) => row.a === attribute && (entity === undefined || row.e === entity),
  )

const attemptEntity = (run: TraceScenario, name: string, attempt: number) =>
  activityId(P10_ORG, run.executionId, name, attempt)

const expectedAttempts = (run: TraceScenario) => [
  attemptEntity(run, 'step-one', 1),
  attemptEntity(run, 'fetch', 1),
  attemptEntity(run, 'fetch', 2),
  attemptEntity(run, 'upload', 1),
]

const startFactOnce = (run: TraceScenario): Verdict => {
  const started = facts(run, Attr.activityStarted)
  const exits = facts(run, Attr.activityExit)
  const expected = expectedAttempts(run)
  for (const entity of expected) {
    const s = started.filter((row) => row.e === entity).length
    const x = exits.filter((row) => row.e === entity).length
    if (s !== 1 || x !== 1) {
      return fail(`${entity}: ${s} start fact(s), ${x} exit(s)`)
    }
  }
  if (started.length !== expected.length || exits.length !== expected.length) {
    return fail(
      `expected ${expected.length} attempts, got ${started.length} start and ${exits.length} exit facts`,
    )
  }
  return pass({ attempts: expected.length })
}

const killedBodyKeepsFirstStart = (run: TraceScenario): Verdict => {
  const runs = run.bodyRuns.get('step-one') ?? 0
  const entity = attemptEntity(run, 'step-one', 1)
  const started = facts(run, Attr.activityStarted, entity)
  const exit = facts(run, Attr.activityExit, entity)[0]
  if (runs !== 2) return fail(`step-one body ran ${runs} time(s), expected 2`)
  if (started.length !== 1 || !exit) {
    return fail(`step-one: ${started.length} start fact(s), exit ${exit ? 'present' : 'missing'}`)
  }
  const start = started[0]
  if (!start || start.seq > exit.seq) {
    return fail('the start fact is not before the exit')
  }
  return pass({ bodyRuns: runs, startSeq: start.seq, exitSeq: exit.seq })
}

const spanNamed = (run: TraceScenario, spanId: string) =>
  run.liveSpans.find((span) => span.spanId === spanId)?.name

const callerCausingSpan = (run: TraceScenario): Verdict => {
  const started = facts(run, Attr.workflowStarted, run.executionEntity)[0]
  const grant = facts(run, Attr.leaseHolder, run.executionEntity)[0]
  const approval = facts(
    run,
    Attr.deferredExit,
    deferredId(P10_ORG, run.executionId, 'approval'),
  )[0]
  const cases = [
    { label: 'workflow/started', row: started, caller: run.command, span: 'TraceProbe.v1.execute' },
    { label: 'lease grant', row: grant, caller: run.command, span: 'TraceProbe.v1.execute' },
    { label: 'approval deferred/exit', row: approval, caller: run.approver, span: 'WorkflowEngine.deferredDone' },
  ]
  for (const { label, row, caller, span } of cases) {
    if (!row) return fail(`${label}: fact missing`)
    const envelope = run.envelopes.get(row.cs)
    if (!envelope) return fail(`${label}: envelope missing`)
    if (envelope.traceId !== caller.traceId) {
      return fail(`${label}: trace ${envelope.traceId}, caller trace ${caller.traceId}`)
    }
    const name = spanNamed(run, envelope.spanId)
    if (name !== span) {
      return fail(`${label}: causing span is ${name ?? envelope.spanId}, expected ${span}`)
    }
  }
  return pass({ command: run.command.traceId, approver: run.approver.traceId })
}

const engineCausingSpan = (run: TraceScenario): Verdict => {
  const approval = deferredId(P10_ORG, run.executionId, 'approval')
  const engineRows = run.rows.filter(
    (row) =>
      row.a === Attr.activityStarted ||
      row.a === Attr.activityExit ||
      row.a === Attr.clockWakeAt ||
      row.a === Attr.workflowResult ||
      (row.a === Attr.deferredExit && row.e !== approval),
  )
  const clockFired = engineRows.filter((row) => row.a === Attr.deferredExit)
  if (clockFired.length !== 1) {
    return fail(`expected one clock-fired deferred exit, got ${clockFired.length}`)
  }
  const clock = clockId(P10_ORG, run.executionId, 'wait')
  for (const row of engineRows) {
    const envelope = run.envelopes.get(row.cs)
    // The clock caused its deferred exit, so that exit names the clock span.
    const expected = durableContext(
      run.executionEntity,
      row.a === Attr.deferredExit ? clock : row.e,
    )
    if (
      !envelope ||
      envelope.traceId !== expected.traceId ||
      envelope.spanId !== expected.spanId ||
      envelope.sampled !== true
    ) {
      return fail(
        `${row.a} on ${row.e}: envelope ${JSON.stringify(envelope)}, expected ${JSON.stringify(expected)}`,
      )
    }
  }
  return pass({ facts: engineRows.length })
}

const WORKFLOW_BODY_SPANS = new Set<string>([
  ...ACTIVITY_NAMES,
  'WorkflowEngine.deferredResult',
  'WorkflowEngine.scheduleClock',
])

const liveSpansOnlyInActivityBodies = (run: TraceScenario): Verdict => {
  const fromBody = run.liveSpans.filter((span) => WORKFLOW_BODY_SPANS.has(span.name))
  if (fromBody.length > 0) {
    return fail(`workflow body emitted live spans: ${fromBody.map((span) => span.name).join(', ')}`)
  }
  const work = run.liveSpans.filter((span) => span.name === 'p10.step-one.work')
  if (work.length !== 2) {
    return fail(`expected 2 live step-one spans (one per body run), got ${work.length}`)
  }
  const traceId = traceIdFor(run.executionEntity)
  const parentId = spanIdFor(attemptEntity(run, 'step-one', 1))
  for (const span of work) {
    const parent = Option.getOrUndefined(span.parent)
    if (span.traceId !== traceId || parent?.spanId !== parentId) {
      return fail(
        `live span ${span.spanId}: trace ${span.traceId}, parent ${parent?.spanId}; expected ${traceId} / ${parentId}`,
      )
    }
  }
  return pass({ liveStepOneSpans: work.length, parent: parentId })
}

const verdicts: ReadonlyArray<
  readonly [(typeof P10_ENGINE_CHECK_NAMES)[number], (run: TraceScenario) => Verdict]
> = [
  ['start fact once per attempt', startFactOnce],
  ['killed body keeps its first start', killedBodyKeepsFirstStart],
  ['caller causing span', callerCausingSpan],
  ['engine causing span', engineCausingSpan],
  ['live spans only in activity bodies', liveSpansOnlyInActivityBodies],
]

/** The engine half of P10, evaluated on one crash-and-resume run. */
export const judgeTraceJournal = (run: TraceScenario): CheckResult[] =>
  verdicts.map(([name, judge]) => {
    const verdict = judge(run)
    return {
      name,
      status: verdict.ok ? ('PASS' as const) : ('FAIL' as const),
      detail: verdict.detail,
    }
  })

export const runTraceJournalChecks = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
): Effect.Effect<CheckResult[]> =>
  runTraceScenario(openStore, clock, nonce).pipe(
    Effect.timeout(Duration.seconds(30)),
    Effect.map(judgeTraceJournal),
    Effect.catchCause((cause) =>
      Effect.succeed(
        P10_ENGINE_CHECK_NAMES.map((name) => ({
          name,
          status: 'FAIL' as const,
          detail: `scenario failed: ${String(cause).split('\n').slice(0, 6).join(' | ')}`,
        })),
      ),
    ),
  )
