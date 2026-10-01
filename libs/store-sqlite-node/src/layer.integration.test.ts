import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import { join } from 'node:path'
import { HlcClock, LogStore } from '@viviefs/datom'
import { makeMutableClock } from '@viviefs/datom/suites'
import { withTempDirectory } from '@viviefs/testing/node'
import { sqliteNodeLayer, sqliteNodeLogStore } from './layer.ts'

const WALL = 1_700_000_000_000

describe('sqlite-node log store layer', () => {
  it.live(
    'adds accepted_at to a changesets table created before P11',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p11-migrate-')
        const filename = join(directory, 'log.sqlite')
        yield* Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient
          yield* sql`CREATE TABLE changesets (
            cs TEXT PRIMARY KEY,
            actor TEXT NOT NULL,
            device TEXT NOT NULL,
            lease_epoch INTEGER,
            trace_id TEXT NOT NULL,
            span_id TEXT NOT NULL,
            sampled INTEGER NOT NULL,
            command TEXT NOT NULL
          )`
          yield* sql`INSERT INTO changesets VALUES
            ('old', 'a', 'd', NULL, 't', 's', 0, 'c')`
        }).pipe(Effect.provide(sqliteNodeLayer(filename)), Effect.scoped)
        const clock = makeMutableClock(WALL)
        const envelope = yield* Effect.gen(function* () {
          const store = yield* LogStore
          return yield* store.envelope('old')
        }).pipe(
          Effect.provide(
            sqliteNodeLogStore({ filename, deviceId: 'p11-node' }).pipe(
              Layer.provide(Layer.succeed(HlcClock, clock.service)),
            ),
          ),
          Effect.scoped,
        )
        expect(envelope?.acceptedAt).toBeNull()
        expect(envelope?.command).toBe('c')
      }),
    30_000,
  )
})
