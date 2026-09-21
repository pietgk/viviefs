import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'

/**
 * Evidence-collection device-resume exemplar (D23, D24). Upload is a
 * retryable activity; reviewer approval is a deferred. Parking at a
 * boundary is the app's UploadWork implementation, not this definition.
 */
export const Approval = DurableDeferred.make('approval')

export class UploadWork extends Context.Service<
  UploadWork,
  {
    readonly perform: () => Effect.Effect<
      string,
      never,
      WorkflowEngine.WorkflowInstance
    >
  }
>()('viviefs/evidence/UploadWork') {}

export const DeviceResume = Workflow.make('DeviceResume.v1', {
  payload: {
    scenario: Schema.Literals(['mid-upload', 'mid-wait', 'no-sweep']),
    nonce: Schema.String,
  },
  success: Schema.Struct({
    hash: Schema.String,
  }),
  idempotencyKey: ({
    scenario,
    nonce,
  }: {
    scenario: string
    nonce: string
  }) => `device-resume:${scenario}:${nonce}`,
  suspendedRetrySchedule: Schedule.spaced(Duration.millis(50)),
})

export const deviceResumeLayer = DeviceResume.toLayer(() =>
  Effect.gen(function* () {
    const upload = yield* UploadWork
    const hash = yield* Activity.make({
      name: 'upload',
      success: Schema.String,
      execute: upload.perform(),
    })
    yield* DurableDeferred.await(Approval)
    return { hash }
  }),
)
