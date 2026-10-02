import { describe, expect } from '@effect/vitest'
import { LogStore } from '@viviefs/datom'
import { exercise } from '@viviefs/testing/exercise'
import * as Effect from 'effect/Effect'
import { envelopeOf, onLogStore } from '../track.ts'
import * as problem from './problem/compact.ts'
import * as solution from './solution/compact.ts'

const SINK = 'trace/motel'

describe('03.01 compaction horizon', () => {
  exercise({
    id: '03.01',
    problem,
    solution,
    check: (impl: typeof solution) =>
      onLogStore(
        Effect.gen(function* () {
          const store = yield* LogStore
          for (let index = 1; index <= 10; index++) {
            const tx = yield* store.mint()
            yield* store.append([{ e: `O1/L${index}`, a: 'evidence/list/title', v: `List ${index}`, tx, op: 'assert', cs: tx }], envelopeOf(tx))
          }
          const seqs = (yield* store.streamFrom(0)).map(({ seq }) => seq)
          yield* store.acknowledge('device-a', seqs[9] ?? 0)
          yield* store.acknowledge(SINK, seqs[3] ?? 0)
          expect((yield* store.compact()).heldBy, 'the sink is behind, so it holds the log').toBe(SINK)

          const { exported, result } = yield* impl.exportThenCompact(SINK)
          expect(exported.map(({ seq }) => seq), `exported exactly the facts ${SINK} had not seen`).toEqual(seqs.slice(4))
          expect(result.horizon, 'every consumer has seen the whole log').toBe(seqs[9])
          expect((yield* store.streamFrom(0)).length, 'compaction removed every fact all consumers saw').toBe(0)
        }),
      ),
    failsWith: /had not seen/,
  })
})
