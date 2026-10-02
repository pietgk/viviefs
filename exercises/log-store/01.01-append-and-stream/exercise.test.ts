import { describe, expect } from '@effect/vitest'
import { exercise } from '@viviefs/testing/exercise'
import * as Effect from 'effect/Effect'
import { onLogStore } from '../track.ts'
import * as problem from './problem/send.ts'
import * as solution from './solution/send.ts'

const facts = [
  { e: 'O1/L1', a: 'evidence/list/title', v: 'Site visit' },
  { e: 'O1/L1/I1', a: 'evidence/item/title', v: 'Front door' },
  { e: 'O1/L1/I2', a: 'evidence/item/title', v: 'Meter' },
]

describe('01.01 append and stream', () => {
  exercise({
    id: '01.01',
    problem,
    solution,
    check: (impl: typeof solution) =>
      onLogStore(
        Effect.gen(function* () {
          const { first, second, log } = yield* impl.sendTwice(facts)
          expect(first, 'the first send appends every fact').toEqual({ inserted: 3, duplicates: 0 })
          expect(second, 'a retry must not add facts: the second send is all duplicates').toEqual({
            inserted: 0,
            duplicates: 3,
          })
          expect(log.map(({ e, a, v }) => ({ e, a, v })), 'the log holds each fact once, in order').toEqual(facts)
        }),
      ),
    failsWith: /a retry must not add facts/,
  })
})
