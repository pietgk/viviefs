import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type { ClockValue } from '@viviefs/workflow-engine'
import { WakeScheduler } from '@viviefs/workflow-engine'
import {
  cancelWakeNotification,
  scheduleWakeNotification,
} from './notifications.ts'

/**
 * Local-notification wake adapter (D24). Android uses alarmClock delivery.
 * Tests and hosts that are not Expo provide `noopWakeScheduler` instead.
 */
export const expoWakeScheduler = Layer.succeed(
  WakeScheduler,
  WakeScheduler.of({
    schedule: (clock: ClockValue, executionId: string) =>
      Effect.promise(() =>
        scheduleWakeNotification({
          executionId,
          clockName: clock.name,
          deferredName: clock.deferredName,
          workflowName: clock.workflowName,
          wakeAtMs: clock.wakeAtMs,
        }),
      ),
    cancel: (executionId, clockName) =>
      Effect.promise(() => cancelWakeNotification(executionId, clockName)),
  }),
)
