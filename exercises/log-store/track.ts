/**
 * What every exercise of the log-store track shares: a real log store on
 * sqlite-node in a temporary directory, and the envelope a self-committed
 * datom carries. Guide: apps/docs/src/content/docs/guides/log-store/index.mdx
 */
import { join } from 'node:path'
import { liveClock, LogStore, type EnvelopeType } from '@viviefs/datom'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

/** Runs `body` against a fresh log store, removed afterwards. */
export const onLogStore = <A, E>(body: Effect.Effect<A, E, LogStore>): Effect.Effect<A, unknown> =>
  Effect.scoped(
    Effect.gen(function* () {
      const directory = yield* withTempDirectory('viviefs-exercise-')
      const store = sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId: 'learner' })
      return yield* body.pipe(Effect.provide(store.pipe(Layer.provide(liveClock))))
    }),
  )

/** The envelope of a self-committed datom (`cs == tx`): a changeset of one. */
export const envelopeOf = (cs: string): EnvelopeType => ({
  cs,
  actor: 'learner',
  device: 'learner-device',
  leaseEpoch: null,
  traceId: '0'.repeat(32),
  spanId: '0'.repeat(16),
  sampled: false,
  command: 'exercise',
  acceptedAt: null,
})
