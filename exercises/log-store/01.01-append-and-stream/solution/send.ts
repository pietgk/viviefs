import { LogStore, type DatomType } from '@viviefs/datom'
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
    // Mint once: `tx` is the datom's identity, so a resent datom is the same fact.
    const datoms: DatomType[] = []
    for (const fact of facts) {
      const tx = yield* store.mint()
      datoms.push({ ...fact, tx, op: 'assert', cs: tx })
    }
    const send = Effect.gen(function* () {
      let inserted = 0
      let duplicates = 0
      for (const datom of datoms) {
        const result = yield* store.append([datom], envelopeOf(datom.tx))
        inserted += result.inserted
        duplicates += result.duplicates
      }
      return { inserted, duplicates }
    })
    const first = yield* send
    const second = yield* send
    return { first, second, log: yield* store.streamFrom(0) }
  })
