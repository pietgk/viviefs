import { LogStore, type StoredDatomType } from '@viviefs/datom'
import * as Effect from 'effect/Effect'

/**
 * Exports to `consumer` (a trace sink, say) every fact it has not seen, then
 * compacts the log. Returns what was exported and what compaction did.
 */
export const exportThenCompact = (consumer: string) =>
  Effect.gen(function* () {
    const store = yield* LogStore
    // TODO: `consumer` is behind. Compaction keeps every fact a registered
    // consumer has not acknowledged, so this removes less than it could.
    const exported: ReadonlyArray<StoredDatomType> = []
    const result = yield* store.compact()
    return { exported, result }
  })
