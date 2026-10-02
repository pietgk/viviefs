import { LogStore } from '@viviefs/datom'
import * as Effect from 'effect/Effect'
import { envelopeOf } from '../../track.ts'

export type Fact = { readonly e: string; readonly a: string; readonly v: string }

/**
 * Sends `facts` to the log store, then sends them again, as a client does
 * when it never heard back the first time. Returns both results and the log.
 */
export const sendTwice = (facts: ReadonlyArray<Fact>) =>
  Effect.gen(function* () {
    const store = yield* LogStore
    const send = Effect.gen(function* () {
      let inserted = 0
      let duplicates = 0
      for (const fact of facts) {
        // TODO: what makes the second send the same facts as the first?
        const tx = yield* store.mint()
        const result = yield* store.append([{ ...fact, tx, op: 'assert', cs: tx }], envelopeOf(tx))
        inserted += result.inserted
        duplicates += result.duplicates
      }
      return { inserted, duplicates }
    })
    const first = yield* send
    const second = yield* send
    return { first, second, log: yield* store.streamFrom(0) }
  })
