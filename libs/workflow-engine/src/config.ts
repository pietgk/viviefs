import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class EngineConfig extends Context.Service<
  EngineConfig,
  {
    readonly org: string
    /**
     * The person on whose behalf this engine writes its journal: the
     * signed-in person on a device (P11). The server refuses a pushed
     * journal write that names anyone else.
     */
    readonly actor: string
  }
>()('viviefs/workflow-engine/EngineConfig') {}

export const engineConfigLayer = (options: {
  readonly org: string
  readonly actor: string
}) => Layer.succeed(EngineConfig, EngineConfig.of(options))
