import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  judgeTraceProjection,
  makeMutableClock,
  runTraceProjection,
  runUnscoped,
} from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import { spanReviewDrift } from './p10-review.ts'

const EVIDENCE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/evidence/2026-09-26-p10.md',
)

describe('P10 trace projection', () => {
  it.live(
    'derives the reviewed span tree from the crash-and-resume journal',
    () =>
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-p10-review-')
        const projection = yield* runUnscoped(
          runTraceProjection(
            (deviceId) =>
              sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId }),
            makeMutableClock(1_700_000_000_000),
            'p10-review',
          ),
        )
        const failed = judgeTraceProjection(projection).filter((check) => check.status !== 'PASS')
        expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
        expect(spanReviewDrift(projection, readFileSync(EVIDENCE, 'utf8'))).toBeUndefined()
      }),
    60_000,
  )
})
