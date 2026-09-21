import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type { ClockValue } from './journal.ts'

/**
 * Port for OS wake-ups (D24). The engine writes `viviefs/clock/wake-at` and
 * then asks this port to schedule a local notification. Tests provide a no-op.
 */
export class WakeScheduler extends Context.Service<
  WakeScheduler,
  {
    readonly schedule: (
      clock: ClockValue,
      executionId: string,
    ) => Effect.Effect<void>
    readonly cancel: (
      executionId: string,
      clockName: string,
    ) => Effect.Effect<void>
  }
>()('viviefs/workflow-engine/WakeScheduler') {}

export const noopWakeScheduler = Layer.succeed(
  WakeScheduler,
  WakeScheduler.of({
    schedule: () => Effect.void,
    cancel: () => Effect.void,
  }),
)
