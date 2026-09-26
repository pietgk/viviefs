/**
 * P06 check: typed failures survive a kill. Replay must hand a workflow the
 * exit its first run saw, including typed failures, or a workflow that
 * branches on an error tag behaves differently after a resume.
 *
 * `Exits.v1`: the `check` activity fails with `CheckFailed`, caught by tag;
 * the process is killed while the workflow waits on `gate`; after the
 * relaunch the gate is failed with `GateRefused`, also caught by tag; the
 * workflow then ends in its own typed failure `Finished`. A third session
 * reads that stored result back and must get the same typed failure.
 */
import * as Cause from 'effect/Cause'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import { deviceLayer, HlcClock } from '@viviefs/datom'
import {
  engineConfigLayer,
  engineLayer,
  noopCrashHook,
  noopWakeScheduler,
} from '@viviefs/workflow-engine'
import type { StoreFactory } from './crash-matrix.ts'
import type { MutableClock } from './log-store-conformance.ts'

class CheckFailed extends Schema.TaggedError<CheckFailed>()('CheckFailed', {
  reason: Schema.String,
}) {}

class GateRefused extends Schema.TaggedError<GateRefused>()('GateRefused', {
  by: Schema.String,
}) {}

class Finished extends Schema.TaggedError<Finished>()('Finished', {
  summary: Schema.String,
}) {}

const Gate = DurableDeferred.make('gate', { error: GateRefused })

const Exits = Workflow.make('Exits.v1', {
  payload: { nonce: Schema.String },
  success: Schema.String,
  error: Finished,
  idempotencyKey: ({ nonce }: { nonce: string }) => nonce,
})

const exitsLayer = Exits.toLayer(() =>
  Effect.gen(function* () {
    const checked = yield* Activity.make({
      name: 'check',
      success: Schema.String,
      error: CheckFailed,
      execute: Effect.fail(new CheckFailed({ reason: 'not signed' })),
    }).pipe(Effect.catchTag('CheckFailed', (error) => Effect.succeed(`caught ${error.reason}`)))
    const gated = yield* DurableDeferred.await(Gate).pipe(
      Effect.as('passed'),
      Effect.catchTag('GateRefused', (error) => Effect.succeed(`refused by ${error.by}`)),
    )
    return yield* new Finished({ summary: `${checked}; ${gated}` })
  }),
)

const DEVICE = 'p06-exits'

const session = (openStore: StoreFactory, clock: MutableClock) =>
  exitsLayer.pipe(
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(openStore(DEVICE)),
    Layer.provide(engineConfigLayer('p06')),
    Layer.provideMerge(deviceLayer(DEVICE)),
    Layer.provide(noopCrashHook),
    Layer.provide(noopWakeScheduler),
    Layer.provide(Layer.succeed(HlcClock, clock.service)),
  )

const EXPECTED = 'caught not signed; refused by reviewer'

const typedFinish = (exit: Exit.Exit<string, Finished>, label: string) => {
  if (Exit.isSuccess(exit)) return Effect.fail(`${label}: succeeded with ${exit.value}`)
  const failure = Cause.findErrorOption(exit.cause)
  if (Option.isNone(failure) || !(failure.value instanceof Finished)) {
    return Effect.fail(`${label}: not a typed Finished failure: ${String(exit.cause).split('\n')[0]}`)
  }
  if (failure.value.summary !== EXPECTED) {
    return Effect.fail(`${label}: summary "${failure.value.summary}", expected "${EXPECTED}"`)
  }
  return Effect.succeed(failure.value.summary)
}

export const typedFailuresSurviveAKill = (
  openStore: StoreFactory,
  clock: MutableClock,
  nonce: string,
) =>
  Effect.gen(function* () {
    const payload = { nonce }
    const executionId = yield* Exits.executionId(payload)

    // Session 1: run until the workflow waits on the gate, then drop the
    // session: the in-memory engine state is gone, the journal stays.
    yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(session(openStore, clock))
        yield* Exits.execute(payload, { discard: true }).pipe(Effect.provide(ctx))
        for (let attempt = 0; attempt < 200; attempt++) {
          const status = yield* Exits.poll(executionId).pipe(Effect.provide(ctx))
          if (Option.isSome(status) && status.value._tag === 'Suspended') return
          yield* Effect.sleep(Duration.millis(20))
        }
        return yield* Effect.die('Exits.v1 did not reach the gate')
      }),
    )

    // Session 2: refuse the gate and finish. `check` is replayed from the
    // journal, so its typed failure must decode and be caught by tag.
    const resumed = yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(session(openStore, clock))
        const token = DurableDeferred.tokenFromExecutionId(Gate, {
          workflow: Exits,
          executionId,
        })
        yield* DurableDeferred.fail(Gate, { token, error: new GateRefused({ by: 'reviewer' }) }).pipe(
          Effect.provide(ctx),
        )
        return yield* Effect.exit(Exits.execute(payload).pipe(Effect.provide(ctx)))
      }),
    )
    const afterResume = yield* typedFinish(resumed, 'after resume')

    // Session 3: the stored workflow result must read back as the same
    // typed failure.
    const stored = yield* Effect.scoped(
      Effect.gen(function* () {
        const ctx = yield* Layer.build(session(openStore, clock))
        return yield* Effect.exit(Exits.execute(payload).pipe(Effect.provide(ctx)))
      }),
    )
    const readBack = yield* typedFinish(stored, 'read back')
    return { afterResume, readBack }
  })
