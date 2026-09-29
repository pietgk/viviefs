import * as DateTime from 'effect/DateTime'
import * as Layer from 'effect/Layer'
import { HlcClock, HlcEntropy } from './clock.ts'

// The live implementations of the clock and entropy ports: the only code in
// libs/datom allowed to read the wall clock, the monotonic clock and the
// system's randomness (D26, ADR-0025). Everything else takes them as services.

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
