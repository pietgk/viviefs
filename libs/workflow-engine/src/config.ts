import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class EngineConfig extends Context.Service<
  EngineConfig,
  {
    readonly org: string
  }
>()('viviefs/workflow-engine/EngineConfig') {}

export const engineConfigLayer = (org: string) =>
  Layer.succeed(EngineConfig, EngineConfig.of({ org }))
