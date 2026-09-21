import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Latch from 'effect/Latch'
import * as Option from 'effect/Option'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import { deviceLayer, HlcClock } from '@viviefs/datom'
import {
  armedCrashHook,
  CrashHook,
  engineConfigLayer,
  engineLayer,
  EngineSweep,
  noopCrashHook,
  noopWakeScheduler,
} from '@viviefs/workflow-engine'
import {
  type CheckResult,
  type MutableClock,
} from './log-store-conformance.ts'
import { type StoreFactory } from './crash-matrix.ts'

export const P07_HOST_CHECK_NAMES = [
  'launch sweep resumes',
  'without sweep does not resume',
] as const

export const P07_HOST_CHECK_COUNT = P07_HOST_CHECK_NAMES.length

export const P07_DEVICE_CHECK_NAMES = [
  'mid-upload resume',
  'mid-wait resume',
  'notification completes deferred',
  'trace crash and resume',
  'without sweep does not resume',
] as const

export const P07_DEVICE_CHECK_COUNT = P07_DEVICE_CHECK_NAMES.length

export const P07_CHECK_NAMES = [
  ...P07_HOST_CHECK_NAMES,
  ...P07_DEVICE_CHECK_NAMES,
] as const

export const P07_CHECK_COUNT = P07_CHECK_NAMES.length

export const P07_PARKED_ATTR = 'viviefs/probe/parked'

const DEVICE = 'p07-a'
const ORG = 'p07'

const Approval = DurableDeferred.make('approval')

const Probe = Workflow.make('LaunchSweep.v1', {
  payload: { kind: Schema.String, nonce: Schema.String },
  success: Schema.Struct({ hash: Schema.String }),
  idempotencyKey: ({ kind, nonce }: { kind: string; nonce: string }) =>
    `${kind}:${nonce}`,
  suspendedRetrySchedule: Schedule.spaced(Duration.millis(20)),
})

const probeLayer = (calls: string[]) =>
  Probe.toLayer(() =>
    Effect.gen(function* () {
      const hook = yield* CrashHook
      const hash = yield* Activity.make({
        name: 'upload',
        success: Schema.String,
        execute: Effect.gen(function* () {
          yield* hook.at('during-upload')
          const key = yield* Activity.idempotencyKey('upload')
          calls.push(`upload:${key}`)
          return 'blob:p07'
        }),
      })
      yield* DurableDeferred.await(Approval)
      return { hash }
    }),
  )

const env = (
  openStore: StoreFactory,
  clock: MutableClock,
  hook: Layer.Layer<CrashHook>,
  calls: string[],
) =>
  probeLayer(calls).pipe(
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(openStore(DEVICE)),
    Layer.provide(engineConfigLayer(ORG)),
    Layer.provideMerge(deviceLayer(DEVICE)),
    Layer.provide(hook),
    Layer.provide(noopWakeScheduler),
    Layer.provide(Layer.succeed(HlcClock, clock.service)),
  )

const killSession = <A, E, R>(
  session: Effect.Effect<A, E, R>,
  wait: Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(session)
    yield* wait
    yield* Fiber.interrupt(fiber)
  })

const completeApproval = (executionId: string) => {
  const token = DurableDeferred.tokenFromExecutionId(Approval, {
    workflow: Probe,
    executionId,
  })
  return DurableDeferred.succeed(Approval, { token, value: undefined })
}

const runCheck = (
  name: string,
  eff: Effect.Effect<unknown, unknown, unknown>,
): Effect.Effect<CheckResult, never, unknown> =>
  eff.pipe(
    Effect.timeout(Duration.seconds(30)),
    Effect.matchCause({
      onSuccess: (value) => ({
        name,
        status: 'PASS' as const,
        detail: JSON.stringify(value),
      }),
      onFailure: (cause) => ({
        name,
        status: 'FAIL' as const,
        detail: String(cause).split('\n').slice(0, 8).join(' | '),
      }),
    }),
  )

const require = (condition: boolean, message: string) =>
  condition ? Effect.succeed(message) : Effect.fail(message)

const killDuringUpload = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
  calls: string[],
) => {
  const payload = { kind: 'upload', nonce }
  return Effect.gen(function* () {
    const arrived = yield* Latch.make()
    const executionId = yield* Probe.executionId(payload)
    const live = env(
      openStore,
      clock,
      armedCrashHook('during-upload', arrived),
      calls,
    )
    yield* killSession(
      Probe.execute(payload, { discard: true }).pipe(
        Effect.andThen(Effect.never),
        Effect.provide(live),
      ),
      arrived.await,
    )
    return executionId
  })
}

const sweepResumes = (openStore: StoreFactory, clock: MutableClock) =>
  Effect.gen(function* () {
    const calls: string[] = []
    const executionId = yield* killDuringUpload(
      openStore,
      clock,
      'sweep',
      calls,
    )
    const resumed = env(openStore, clock, noopCrashHook, calls)
    yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(resumed)
        yield* EngineSweep.pipe(
          Effect.flatMap((sweep) => sweep.sweep()),
          Effect.provide(ctx),
        )
        yield* completeApproval(executionId).pipe(Effect.provide(ctx))
        const result = yield* Probe.execute({
          kind: 'upload',
          nonce: 'sweep',
        }).pipe(Effect.provide(ctx))
        yield* require(
          calls.filter((key) => key.startsWith('upload:')).length === 1,
          `expected one upload after sweep, got ${calls.join(',')}`,
        )
        yield* require(result.hash === 'blob:p07', result.hash)
      }),
    )
    return { executionId, calls: calls.length }
  })

const withoutSweepStays = (openStore: StoreFactory, clock: MutableClock) =>
  Effect.gen(function* () {
    const calls: string[] = []
    const executionId = yield* killDuringUpload(
      openStore,
      clock,
      'nosweep',
      calls,
    )
    const callsAfterKill = calls.length
    const fresh = env(openStore, clock, noopCrashHook, calls)
    const poll = yield* Probe.poll(executionId).pipe(
      Effect.provide(fresh),
      Effect.scoped,
    )
    yield* require(
      Option.isSome(poll) && poll.value._tag === 'Suspended',
      `expected suspended poll without sweep, got ${JSON.stringify(poll)}`,
    )
    yield* require(
      calls.length === callsAfterKill,
      `upload ran without sweep: ${calls.join(',')}`,
    )
    const result = yield* Probe.poll(executionId).pipe(
      Effect.provide(fresh),
      Effect.scoped,
    )
    const complete =
      Option.isSome(result) && result.value._tag === 'Complete'
        ? Exit.isSuccess(result.value.exit)
        : false
    yield* require(!complete, 'workflow completed without a sweep')
    return { executionId, calls: calls.length }
  })

export const runLaunchSweepChecks = (
  openStore: StoreFactory,
  clock: MutableClock,
): Effect.Effect<CheckResult[]> =>
  Effect.all(
    [
      runCheck('launch sweep resumes', sweepResumes(openStore, clock)),
      runCheck(
        'without sweep does not resume',
        withoutSweepStays(openStore, clock),
      ),
    ],
    { concurrency: 1 },
  ) as unknown as Effect.Effect<CheckResult[]>
