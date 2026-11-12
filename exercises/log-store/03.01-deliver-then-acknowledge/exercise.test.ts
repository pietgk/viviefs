import { describe, expect } from '@effect/vitest'
import { LogStore, type StoredDatomType } from '@viviefs/datom'
import { exercise, note } from '@viviefs/testing/exercise'
import * as Effect from 'effect/Effect'
import { envelopeOf, onLogStore } from '../track.ts'
import * as problem from './problem/export.ts'
import * as solution from './solution/export.ts'

const SINK = 'trace/motel'

describe('03.01 deliver, then acknowledge', () => {
  exercise({
    id: '03.01',
    problem,
    solution,
    check: (impl: typeof solution) =>
      onLogStore(
        Effect.gen(function* () {
          const store = yield* LogStore
          const write = Effect.fn(function* (from: number, to: number) {
            for (let index = from; index <= to; index++) {
              const tx = yield* store.mint()
              yield* store.append([{ e: `O1/L${index}`, a: 'evidence/list/title', v: `List ${index}`, tx, op: 'assert', cs: tx }], envelopeOf(tx))
            }
          })
          const received: Array<string> = []
          let crashes = 1
          const send = (facts: ReadonlyArray<StoredDatomType>) =>
            Effect.suspend(() => {
              if (crashes > 0) {
                crashes -= 1
                return Effect.fail('crashed while sending' as const)
              }
              received.push(...facts.map(({ v }) => v))
              return Effect.void
            })

          yield* write(1, 4)
          const crashed = yield* Effect.exit(impl.exportOnce(SINK, send))
          yield* note(`round 1: ${crashed._tag === 'Failure' ? 'crashed while sending' : 'sent'}; ${SINK}'s place is ${(yield* store.acknowledged(SINK)) ?? 'not set'}`)
          const read = yield* impl.exportOnce(SINK, send)
          yield* note(`round 2: read ${read} facts; the sink has ${received.join(', ') || 'nothing'}`)
          expect(received, 'every fact reaches the sink: a crash must not move the place past facts it never got').toEqual(['List 1', 'List 2', 'List 3', 'List 4'])

          yield* write(5, 6)
          const next = yield* impl.exportOnce(SINK, send)
          yield* note(`round 3, after two more facts: read ${next}; the sink has ${received.length} facts`)
          expect(next, 'the next round reads on from its place').toBe(2)
          expect(received).toEqual(['List 1', 'List 2', 'List 3', 'List 4', 'List 5', 'List 6'])
        }),
      ),
    failsWith: /every fact reaches the sink/,
  })
})
