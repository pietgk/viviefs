import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class HlcClock extends Context.Service<
  HlcClock,
  {
    readonly wallMs: () => number
    readonly monotonicMs: () => number
  }
>()('viviefs/datom/HlcClock') {}

export class HlcDevice extends Context.Service<
  HlcDevice,
  {
    readonly id: string
  }
>()('viviefs/datom/HlcDevice') {}

export class HlcEntropy extends Context.Service<
  HlcEntropy,
  {
    readonly nextUint32: () => number
  }
>()('viviefs/datom/HlcEntropy') {}

export const deviceLayer = (id: string) =>
  Layer.succeed(HlcDevice, HlcDevice.of({ id }))
