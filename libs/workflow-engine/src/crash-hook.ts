import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import type * as Latch from 'effect/Latch'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'

export type CrashBoundary =
  | 'before-activity'
  | 'during-activity'
  | 'after-activity-before-journal'
  | 'during-deferred'
  | 'during-clock'
  | 'during-lease-handoff'
  | 'during-upload'

export class CrashHook extends Context.Service<
  CrashHook,
  {
    readonly at: (boundary: CrashBoundary) => Effect.Effect<void>
  }
>()('viviefs/workflow-engine/CrashHook') {}

export const noopCrashHook = Layer.succeed(
  CrashHook,
  CrashHook.of({
    at: () => Effect.void,
  }),
)

/**
 * Simulate a process kill at `boundary`. `Workflow.intoResult` is
 * uninterruptible, so an external `Fiber.interrupt` of the engine session
 * cannot stop a parked `Effect.never` inside the run. Mark the instance
 * suspended and self-interrupt the interruptible child instead: nothing is
 * journaled past the boundary, and tearing down the layer drops in-memory
 * engine state.
 */
export const armedCrashHook = (
  boundary: CrashBoundary,
  arrived: Latch.Latch,
): Layer.Layer<CrashHook> =>
  Layer.succeed(
    CrashHook,
    CrashHook.of({
      at: (at) =>
        at === boundary
          ? Effect.gen(function* () {
              const instance = yield* Effect.serviceOption(
                WorkflowEngine.WorkflowInstance,
              )
              if (Option.isSome(instance)) {
                instance.value.suspended = true
              }
              yield* arrived.open
              return yield* Effect.interrupt
            })
          : Effect.void,
    }),
  )
