import * as Cause from 'effect/Cause'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Latch from 'effect/Latch'
import * as Option from 'effect/Option'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'
import type * as SqlClient from 'effect/unstable/sql/SqlClient'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as DurableClock from 'effect/unstable/workflow/DurableClock'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'
import { deviceLayer, HlcClock, LogStore, sha256Hex } from '@viviefs/datom'
import {
  armedCrashHook,
  CrashHook,
  engineConfigLayer,
  engineLayer,
  Leases,
  noopCrashHook,
  noopWakeScheduler,
  type CrashBoundary,
} from '@viviefs/workflow-engine'
import {
  type CheckResult,
  type MutableClock,
} from './log-store-conformance.ts'

export const P06_DATOM_CHECK_NAMES = [
  'kill before activity',
  'kill during activity',
  'kill after activity before journal',
  'kill during deferred wait',
  'kill during clock',
  'kill during lease handoff',
  'kill during upload',
] as const

export const P06_CHECK_NAMES = [
  ...P06_DATOM_CHECK_NAMES,
  'memory engine fails durability',
] as const

export const P06_CHECK_COUNT = P06_CHECK_NAMES.length
export const P06_DATOM_CHECK_COUNT = P06_DATOM_CHECK_NAMES.length

export type StoreFactory = (
  deviceId: string,
) => Layer.Layer<LogStore | SqlClient.SqlClient, unknown, HlcClock>

const DEVICE_A = 'p06-a'
const DEVICE_B = 'p06-b'
const ORG = 'p06'
const FILE_BYTES = 'p06-file'
const CLOCK_DURATION = Duration.millis(150)
/** Filled before a matrix run. `crypto.subtle.digest` via `Effect.tryPromise` does not complete inside a Workflow activity fiber, so the harness hashes and the upload activity records that hash. */
const fileDigest = { hash: 'blob:unset' }

const Approval = DurableDeferred.make('approval')

const Probe = Workflow.make('CrashMatrix.v1', {
  payload: { kind: Schema.String, nonce: Schema.String },
  success: Schema.Struct({
    hash: Schema.String,
    visible: Schema.Number,
  }),
  idempotencyKey: ({ kind, nonce }: { kind: string; nonce: string }) =>
    `${kind}:${nonce}`,
  suspendedRetrySchedule: Schedule.spaced(Duration.millis(20)),
})

type Tracker = {
  readonly record: (key: string) => Effect.Effect<void>
  readonly calls: () => ReadonlyArray<string>
  readonly visible: () => number
}

const makeTracker = (): Tracker => {
  const calls: string[] = []
  const seen = new Set<string>()
  return {
    record: (key) =>
      Effect.sync(() => {
        calls.push(key)
        seen.add(key)
      }),
    calls: () => calls,
    visible: () => seen.size,
  }
}

const probeLayer = (tracker: Tracker) =>
  Probe.toLayer(() =>
    Effect.gen(function* () {
      const hook = yield* CrashHook
      yield* Activity.make({
        name: 'step-one',
        success: Schema.String,
        execute: Effect.gen(function* () {
          yield* hook.at('during-activity')
          const key = yield* Activity.idempotencyKey('step-one')
          yield* tracker.record(`step-one:${key}`)
          return 'one'
        }),
      })
      yield* Activity.make({
        name: 'step-two',
        success: Schema.String,
        execute: Effect.gen(function* () {
          const key = yield* Activity.idempotencyKey('step-two')
          yield* tracker.record(`step-two:${key}`)
          return 'two'
        }),
      })
      yield* DurableDeferred.await(Approval)
      yield* DurableClock.sleep({
        name: 'wait',
        duration: CLOCK_DURATION,
        inMemoryThreshold: 0,
      })
      const hash = yield* Activity.make({
        name: 'upload',
        success: Schema.String,
        execute: Effect.gen(function* () {
          yield* hook.at('during-upload')
          const key = yield* Activity.idempotencyKey('upload')
          yield* tracker.record(`upload:${key}`)
          return fileDigest.hash
        }),
      })
      return { hash, visible: tracker.visible() }
    }),
  )

const env = (
  openStore: StoreFactory,
  clock: MutableClock,
  deviceId: string,
  hook: Layer.Layer<CrashHook>,
  tracker: Tracker,
) =>
  probeLayer(tracker).pipe(
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(openStore(deviceId)),
    Layer.provide(engineConfigLayer(ORG)),
    Layer.provideMerge(deviceLayer(deviceId)),
    Layer.provide(hook),
    Layer.provide(noopWakeScheduler),
    Layer.provide(Layer.succeed(HlcClock, clock.service)),
  )

const waitLive = Effect.sleep(Duration.millis(25))

const waitUntilSuspended = (executionId: string) =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 200; attempt++) {
      const status = yield* Probe.poll(executionId)
      if (Option.isSome(status) && status.value._tag === 'Suspended') return
      yield* waitLive
    }
    return yield* Effect.die('workflow did not suspend in time')
  })

const killSession = <A, E, R>(
  session: Effect.Effect<A, E, R>,
  wait: Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(session)
    yield* wait
    yield* Fiber.interrupt(fiber)
  })

const payloadFor = (kind: string, nonce: string) => ({ kind, nonce })

const completeApproval = (executionId: string) => {
  const token = DurableDeferred.tokenFromExecutionId(Approval, {
    workflow: Probe,
    executionId,
  })
  return DurableDeferred.succeed(Approval, { token, value: undefined })
}

const finishAfterResume = (
  layer: Layer.Layer<WorkflowEngine.WorkflowEngine | Leases, unknown, never>,
  payload: { kind: string; nonce: string },
  executionId: string,
) =>
  Effect.scoped(
    Effect.gen(function* () {
      const ctx = yield* Layer.build(layer)
      const use = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        effect.pipe(Effect.provide(ctx))
      yield* use(completeApproval(executionId))
      return yield* use(Probe.execute(payload))
    }),
  )

const runCheck = (
  name: string,
  eff: Effect.Effect<unknown, unknown>,
): Effect.Effect<CheckResult> =>
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

const uniquePrefix = (tracker: Tracker, prefix: string) =>
  new Set(tracker.calls().filter((key) => key.startsWith(prefix))).size

const killAtActivityHook = (
  openStore: StoreFactory,
  clock: MutableClock,
  boundary: CrashBoundary,
  kind: string,
) =>
  Effect.gen(function* () {
    const tracker = makeTracker()
    const arrived = yield* Latch.make()
    const payload = payloadFor(kind, boundary)
    const executionId = yield* Probe.executionId(payload)
    const live = env(
      openStore,
      clock,
      DEVICE_A,
      armedCrashHook(boundary, arrived),
      tracker,
    )
    yield* killSession(
      Probe.execute(payload, { discard: true }).pipe(
        Effect.andThen(Effect.never),
        Effect.provide(live),
      ),
      arrived.await,
    )
    const resumed = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    const result = yield* finishAfterResume(resumed, payload, executionId)
    yield* require(
      uniquePrefix(tracker, 'step-one:') === 1,
      `step-one observable count ${uniquePrefix(tracker, 'step-one:')}`,
    )
    yield* require(result.hash.startsWith('blob:'), result.hash)
    return {
      executionId,
      visible: tracker.visible(),
      calls: tracker.calls().length,
      hash: result.hash,
    }
  })

const killWhileWaiting = (
  openStore: StoreFactory,
  clock: MutableClock,
  kind: string,
) =>
  Effect.gen(function* () {
    const tracker = makeTracker()
    const arrived = yield* Latch.make()
    const payload = payloadFor(kind, 'deferred')
    const executionId = yield* Probe.executionId(payload)
    const live = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    yield* killSession(
      Effect.gen(function* () {
        yield* Probe.execute(payload, { discard: true })
        yield* waitUntilSuspended(executionId)
        yield* arrived.open
        yield* Effect.never
      }).pipe(Effect.provide(live)),
      arrived.await,
    )
    const resumed = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    const poll = yield* Probe.poll(executionId).pipe(
      Effect.provide(resumed),
      Effect.scoped,
    )
    yield* require(
      Option.isSome(poll) && poll.value._tag === 'Suspended',
      `expected suspended poll after kill, got ${JSON.stringify(poll)}`,
    )
    const callsBefore = tracker.calls().length
    const result = yield* finishAfterResume(resumed, payload, executionId)
    yield* require(
      tracker.calls().length === callsBefore + 1,
      `expected only upload to run after resume, calls ${callsBefore} -> ${tracker.calls().length}`,
    )
    return { executionId, hash: result.hash, calls: tracker.calls().length }
  })

const killDuringClock = (
  openStore: StoreFactory,
  clock: MutableClock,
) =>
  Effect.gen(function* () {
    const tracker = makeTracker()
    const arrived = yield* Latch.make()
    const payload = payloadFor('clock', 'wake')
    const executionId = yield* Probe.executionId(payload)
    const live = env(
      openStore,
      clock,
      DEVICE_A,
      armedCrashHook('during-clock', arrived),
      tracker,
    )
    yield* killSession(
      Effect.gen(function* () {
        yield* Probe.execute(payload, { discard: true })
        yield* waitUntilSuspended(executionId)
        yield* completeApproval(executionId)
        yield* arrived.await
        yield* Effect.never
      }).pipe(Effect.provide(live)),
      arrived.await,
    )
    const resumed = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    const callsBefore = tracker.calls().length
    const result = yield* finishAfterResume(resumed, payload, executionId)
    yield* require(
      tracker.calls().length === callsBefore + 1,
      `expected only upload after clock resume, ${callsBefore} -> ${tracker.calls().length}`,
    )
    return { executionId, hash: result.hash }
  })

const killDuringUpload = (
  openStore: StoreFactory,
  clock: MutableClock,
) =>
  Effect.gen(function* () {
    const tracker = makeTracker()
    const arrived = yield* Latch.make()
    const payload = payloadFor('upload', 'file')
    const executionId = yield* Probe.executionId(payload)
    const live = env(
      openStore,
      clock,
      DEVICE_A,
      armedCrashHook('during-upload', arrived),
      tracker,
    )
    yield* killSession(
      Effect.gen(function* () {
        yield* Probe.execute(payload, { discard: true })
        yield* waitUntilSuspended(executionId)
        yield* completeApproval(executionId)
        yield* waitUntilSuspended(executionId)
        yield* Effect.sleep(Duration.millis(250))
        yield* arrived.await
        yield* Effect.never
      }).pipe(Effect.provide(live)),
      arrived.await,
    )
    const resumed = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    const uploadsBefore = uniquePrefix(tracker, 'upload:')
    const result = yield* finishAfterResume(resumed, payload, executionId)
    yield* require(
      uniquePrefix(tracker, 'upload:') === 1,
      `upload observable ${uniquePrefix(tracker, 'upload:')} (before kill ${uploadsBefore})`,
    )
    yield* require(result.hash.startsWith('blob:'), result.hash)
    return { executionId, hash: result.hash, calls: tracker.calls().length }
  })

const killDuringLease = (
  openStore: StoreFactory,
  clock: MutableClock,
) =>
  Effect.gen(function* () {
    const tracker = makeTracker()
    const arrived = yield* Latch.make()
    const payload = payloadFor('lease', 'handoff')
    const executionId = yield* Probe.executionId(payload)
    const live = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    yield* killSession(
      Effect.gen(function* () {
        yield* Probe.execute(payload, { discard: true })
        yield* waitUntilSuspended(executionId)
        yield* arrived.open
        yield* Effect.never
      }).pipe(Effect.provide(live)),
      arrived.await,
    )
    const handoffArrived = yield* Latch.make()
    const handing = env(
      openStore,
      clock,
      DEVICE_A,
      armedCrashHook('during-lease-handoff', handoffArrived),
      tracker,
    )
    yield* killSession(
      Leases.pipe(
        Effect.flatMap((leases) => leases.handoff(executionId, DEVICE_B)),
        Effect.andThen(Effect.never),
        Effect.provide(handing),
      ),
      handoffArrived.await,
    )
    const stillA = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    const holderAfterKill = yield* Leases.pipe(
      Effect.flatMap((leases) => leases.holder(executionId)),
      Effect.provide(stillA),
      Effect.scoped,
    )
    yield* require(
      holderAfterKill?.device === DEVICE_A,
      `expected ${DEVICE_A} still holding after killed handoff, got ${JSON.stringify(holderAfterKill)}`,
    )
    const holder = yield* Leases.pipe(
      Effect.flatMap((leases) => leases.handoff(executionId, DEVICE_B)),
      Effect.provide(stillA),
      Effect.scoped,
    )
    yield* require(
      holder.device === DEVICE_B && holder.epoch === 2,
      `expected ${DEVICE_B} epoch 2, got ${JSON.stringify(holder)}`,
    )
    const stale = yield* completeApproval(executionId).pipe(
      Effect.provide(stillA),
      Effect.scoped,
      Effect.exit,
    )
    yield* require(
      Exit.isFailure(stale) && Cause.hasDies(stale.cause),
      'stale device deferredDone should die',
    )
    const asB = env(openStore, clock, DEVICE_B, noopCrashHook, tracker)
    const result = yield* finishAfterResume(asB, payload, executionId)
    return { executionId, holder, hash: result.hash }
  })

export const runHappyPath = (
  openStore: StoreFactory,
  clock: MutableClock,
): Effect.Effect<{ hash: string; visible: number }> =>
  Effect.gen(function* () {
    fileDigest.hash = `blob:${yield* Effect.orDie(sha256Hex(FILE_BYTES))}`
    const tracker = makeTracker()
    const payload = payloadFor('happy', 'path')
    const executionId = yield* Probe.executionId(payload)
    const live = env(openStore, clock, DEVICE_A, noopCrashHook, tracker)
    return yield* Effect.orDie(finishAfterResume(live, payload, executionId))
  })

export const runCrashMatrix = (
  openStore: StoreFactory,
  clock: MutableClock,
): Effect.Effect<CheckResult[]> =>
  Effect.gen(function* () {
    fileDigest.hash = `blob:${yield* Effect.orDie(sha256Hex(FILE_BYTES))}`
    return yield* Effect.all(
      [
        runCheck(
          'kill before activity',
          killAtActivityHook(openStore, clock, 'before-activity', 'before'),
        ),
        runCheck(
          'kill during activity',
          killAtActivityHook(openStore, clock, 'during-activity', 'during'),
        ),
        runCheck(
          'kill after activity before journal',
          killAtActivityHook(
            openStore,
            clock,
            'after-activity-before-journal',
            'after-journal',
          ),
        ),
        runCheck(
          'kill during deferred wait',
          killWhileWaiting(openStore, clock, 'deferred'),
        ),
        runCheck('kill during clock', killDuringClock(openStore, clock)),
        runCheck(
          'kill during lease handoff',
          killDuringLease(openStore, clock),
        ),
        runCheck('kill during upload', killDuringUpload(openStore, clock)),
      ],
      { concurrency: 1 },
    )
  })

export const runMemoryDurabilityControl = (): Effect.Effect<CheckResult> =>
  runCheck(
    'memory engine fails durability',
    Effect.gen(function* () {
      fileDigest.hash = `blob:${yield* Effect.orDie(sha256Hex(FILE_BYTES))}`
      const tracker = makeTracker()
      const payload = payloadFor('memory', 'positive')
      const executionId = yield* Probe.executionId(payload)
      const live = probeLayer(tracker).pipe(
        Layer.provideMerge(WorkflowEngine.layerMemory),
        Layer.provide(noopCrashHook),
      )
      const arrived = yield* Latch.make()
      yield* killSession(
        Effect.gen(function* () {
          yield* Probe.execute(payload, { discard: true })
          yield* waitUntilSuspended(executionId)
          yield* arrived.open
          yield* Effect.never
        }).pipe(Effect.provide(live)),
        arrived.await,
      )
      const again = probeLayer(tracker).pipe(
        Layer.provideMerge(WorkflowEngine.layerMemory),
        Layer.provide(noopCrashHook),
      )
      const poll = yield* Probe.poll(executionId).pipe(
        Effect.provide(again),
        Effect.scoped,
      )
      const callsBefore = tracker.calls().length
      yield* Effect.scoped(
        Effect.gen(function* () {
          const ctx = yield* Layer.build(again)
          yield* Probe.execute(payload, { discard: true }).pipe(
            Effect.provide(ctx),
          )
          yield* waitUntilSuspended(executionId).pipe(Effect.provide(ctx))
        }),
      )
      const reRan = tracker.calls().length > callsBefore
      yield* require(
        Option.isNone(poll) && reRan,
        `memory still looked durable: poll=${JSON.stringify(poll)} calls=${tracker.calls().length} before=${callsBefore}`,
      )
      return {
        poll: Option.isNone(poll) ? 'none' : 'present',
        reRan,
      }
    }),
  )
