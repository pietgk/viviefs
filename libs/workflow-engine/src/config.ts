import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class WorkflowEngineConfig extends Context.Service<
  WorkflowEngineConfig,
  {
    readonly org: string
    /**
     * The person on whose behalf this workflow engine writes its journal: the
     * signed-in person on a device (P11). The server refuses a pushed
     * journal write that names anyone else.
     */
    readonly actor: string
  }
>()('viviefs/workflow-engine/WorkflowEngineConfig') {}

export const workflowEngineConfigLayer = (options: {
  readonly org: string
  readonly actor: string
}) => Layer.succeed(WorkflowEngineConfig, WorkflowEngineConfig.of(options))
