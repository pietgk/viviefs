import { LogStore } from '@viviefs/datom'
import * as Effect from 'effect/Effect'

/**
 * Exports to `consumer` (a trace sink, say) every fact it has not seen, then
 * compacts the log. Returns what was exported and what compaction did.
 */
export const exportThenCompact = (consumer: string) =>
  Effect.gen(function* () {
    const store = yield* LogStore
    // Read from the consumer's own cursor, and acknowledge only what it saw.
    const cursor = (yield* store.acknowledged(consumer)) ?? 0
    const exported = yield* store.streamFrom(cursor)
    const seen = exported.at(-1)
    if (seen) yield* store.acknowledge(consumer, seen.seq)
    const result = yield* store.compact()
    return { exported, result }
  })
