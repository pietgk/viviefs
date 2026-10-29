import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

/**
 * Launch and foreground sweep (D3, D24). Finds started executions with no
 * result and resumes them, then fires due clocks. The app calls this; the
 * workflow engine does not sweep by itself. P07's positive control skips the call.
 */
export class WorkflowEngineSweep extends Context.Service<
  WorkflowEngineSweep,
  {
    readonly pending: () => Effect.Effect<ReadonlyArray<string>>
    readonly sweep: () => Effect.Effect<void>
  }
>()('viviefs/workflow-engine/WorkflowEngineSweep') {}
