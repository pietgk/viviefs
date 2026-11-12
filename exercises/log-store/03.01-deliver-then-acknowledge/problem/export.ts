import { LogStore, type StoredDatomType } from '@viviefs/datom'
import * as Effect from 'effect/Effect'

/**
 * One round of an export: reads the log from `consumer`'s place, sends what
 * it read with `send`, and moves the place past it. Returns how many facts it
 * read. A failed send, a crash say, ends the round.
 */
export const exportOnce = <E>(consumer: string, send: (facts: ReadonlyArray<StoredDatomType>) => Effect.Effect<void, E>) =>
  Effect.gen(function* () {
    const store = yield* LogStore
    const place = (yield* store.acknowledged(consumer)) ?? 0
    const facts = yield* store.streamFrom(place)
    const last = facts.at(-1)
    if (last === undefined) return 0
    // TODO: when `send` fails, the next round starts after facts the sink never got.
    yield* store.acknowledge(consumer, last.seq)
    yield* send(facts)
    return facts.length
  })
