import { describe, expect, it } from '@effect/vitest'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as DurableDeferred from 'effect/workflow/DurableDeferred'
import * as Workflow from 'effect/workflow/Workflow'
import { join } from 'node:path'
import { deviceLayer, HlcClock } from '@viviefs/datom'
import { makeMutableClock } from '@viviefs/datom/suites'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'
import {
  engineConfigLayer,
  engineLayer,
  noopCrashHook,
  noopWakeScheduler,
} from './index.ts'
import { LAB_PERSON } from './suites/index.ts'

const DEVICE = 'engine-a'
const Gate = DurableDeferred.make('gate')

const Gated = Workflow.make('Gated.v1', {
  payload: { nonce: Schema.String },
  success: Schema.String,
  idempotencyKey: ({ nonce }: { nonce: string }) => nonce,
})

const session = (directory: string, bodyRuns: { count: number }) =>
  Gated.toLayer(() =>
    Effect.gen(function* () {
      bodyRuns.count += 1
      yield* DurableDeferred.await(Gate)
      return 'opened'
    }),
  ).pipe(
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(
      sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId: DEVICE }),
    ),
    Layer.provide(engineConfigLayer({ org: 'engine', actor: LAB_PERSON })),
    Layer.provideMerge(deviceLayer(DEVICE)),
    Layer.provide(noopCrashHook),
    Layer.provide(noopWakeScheduler),
    Layer.provide(Layer.succeed(HlcClock, makeMutableClock(1_700_000_000_000).service)),
  )

const pollUntil = (executionId: string, tag: 'Suspended' | 'Complete') =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 400; attempt++) {
      const status = yield* Gated.poll(executionId)
      if (Option.isSome(status) && status.value._tag === tag) return status.value
      yield* Effect.sleep(Duration.millis(25))
    }
    return yield* Effect.die(`${tag}: timed out`)
  })

describe('datom-backed engine', () => {
  it.live(
    'ignores a repeated deferred completion and a resume after the run completed',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-engine-')
        const bodyRuns = { count: 0 }
        yield* Effect.scoped(
          Effect.gen(function* () {
            const context = yield* Layer.build(session(directory, bodyRuns))
            const run = Effect.gen(function* () {
              const payload = { nonce: 'repeat' }
              const executionId = yield* Gated.executionId(payload)
              yield* Gated.execute(payload, { discard: true })
              yield* pollUntil(executionId, 'Suspended')
              const complete = (value: undefined) =>
                DurableDeferred.succeed(Gate, {
                  token: DurableDeferred.tokenFromExecutionId(Gate, {
                    workflow: Gated,
                    executionId,
                  }),
                  value,
                })
              yield* complete(undefined)
              const done = yield* pollUntil(executionId, 'Complete')
              expect(done._tag === 'Complete' && done.exit._tag === 'Success').toBe(true)
              const runsWhenDone = bodyRuns.count

              // A finished run replays for nothing: not for a repeated
              // completion of its durable deferred, not for an explicit resume.
              // (A repeat that preempts a run still in flight is covered by
              // tracing/engine-trace on PGlite, which then never finished.)
              yield* complete(undefined)
              yield* Gated.resume(executionId)
              yield* Effect.sleep(Duration.millis(100))

              expect(bodyRuns.count).toBe(runsWhenDone)
              const after = yield* Gated.poll(executionId)
              expect(Option.isSome(after) && after.value._tag).toBe('Complete')
            })
            yield* run.pipe(Effect.provide(context))
          }),
        )
      }),
    30_000,
  )
})
