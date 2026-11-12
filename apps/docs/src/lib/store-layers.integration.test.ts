// Lesson 4's widget against the exemplar (D216): every database the widget
// lets Node run, composed as the widget writes it, put through the real
// `log-store/conformance`, fails exactly the checks the model says.
import { join } from 'node:path'
import { describe, expect, it } from '@effect/vitest'
import { cryptoEntropy, deviceLayer, logStoreLayer } from '@viviefs/datom'
import { makeMutableClock, runLogStoreChecks } from '@viviefs/datom/suites'
import { pgliteClientLayer } from '@viviefs/store-postgres'
import { sqliteNodeLayer } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { conformance, DATABASES, type Database } from './store-layers.ts'

const sqlLayer = (database: Database['id'], directory: string) => {
  switch (database) {
    case 'sqlite-file':
      return sqliteNodeLayer(join(directory, 'log.sqlite'))
    case 'sqlite-memory':
      return sqliteNodeLayer(':memory:')
    case 'pglite-dir':
      return pgliteClientLayer(join(directory, 'pg'))
    default:
      return pgliteClientLayer()
  }
}

describe("lesson 4's widget model", () => {
  for (const database of DATABASES.filter(({ here }) => here)) {
    it.live(
      `says what log-store/conformance says of ${database.label}`,
      () =>
        Effect.scoped(
          Effect.gen(function* () {
            const directory = yield* withTempDirectory('viviefs-docs-stores-')
            const store = logStoreLayer.pipe(Layer.provideMerge(sqlLayer(database.id, directory)), Layer.provide(cryptoEntropy), Layer.provide(deviceLayer('learner')))
            const real = yield* runLogStoreChecks(store, makeMutableClock(1_700_000_000_000))
            expect(real.map(({ name, status }) => ({ name, status: status === 'PASS' ? 'PASS' : 'FAIL' }))).toEqual(conformance(database))
          }),
        ),
      120_000,
    )
  }
})
