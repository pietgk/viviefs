import * as Context from 'effect/Context'
import * as DateTime from 'effect/DateTime'
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

export const liveClock = Layer.sync(HlcClock, () =>
  HlcClock.of({
    wallMs: () => DateTime.toEpochMillis(DateTime.nowUnsafe()),
    monotonicMs: () => performance.now(),
  }),
)

export const cryptoEntropy = Layer.sync(HlcEntropy, () =>
  HlcEntropy.of({
    nextUint32: () => {
      const bytes = new Uint8Array(4)
      globalThis.crypto.getRandomValues(bytes)
      return new DataView(bytes.buffer).getUint32(0)
    },
  }),
)

export const deviceLayer = (id: string) =>
  Layer.succeed(HlcDevice, HlcDevice.of({ id }))
