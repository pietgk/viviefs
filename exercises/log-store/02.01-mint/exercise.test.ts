import { describe, expect } from '@effect/vitest'
import { compareHlc, encodeHlc, mintHlc } from '@viviefs/datom'
import { exercise } from '@viviefs/testing/exercise'
import * as Effect from 'effect/Effect'
import * as problem from './problem/mint.ts'
import * as solution from './solution/mint.ts'

const NOW = 1_700_000_000_000

const cases = [
  { name: 'later millisecond', now: NOW + 1, last: { pt: NOW, c: 4 } },
  { name: 'same millisecond', now: NOW, last: { pt: NOW, c: 4 } },
  { name: 'clock jumped back two minutes', now: NOW - 120_000, last: { pt: NOW, c: 0 } },
  { name: 'counter full', now: NOW, last: { pt: NOW, c: solution.COUNTER_MAX } },
]

/** What the exemplar's `mintHlc` gives for the same input. */
const reference = (now: number, last: { pt: number; c: number }) => {
  const { pt, c } = mintHlc({ now, last: { ...last, tx: encodeHlc(last.pt, last.c, 0, 0) }, deviceFp: 0, random: 0 })
  return { pt, c }
}

describe('02.01 mint', () => {
  exercise({
    id: '02.01',
    problem,
    solution,
    check: (impl: typeof solution) =>
      Effect.sync(() => {
        expect(impl.mint(NOW, null), 'first mint: (now, 0)').toEqual({ pt: NOW, c: 0 })
        for (const { name, now, last } of cases) {
          const minted = impl.mint(now, last)
          expect(compareHlc(minted, last), `${name}: (pt, c) not above the last`).toBe(1)
          expect(minted, `${name}: not the smallest (pt, c) above the last`).toEqual(reference(now, last))
        }
      }),
    failsWith: /same millisecond: \(pt, c\) not above the last/,
  })
})
