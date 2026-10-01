import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { makeMutableClock } from '@viviefs/datom/suites'
import {
  P10_PROJECTION_CHECK_COUNT,
  judgeTraceProjection,
  runTraceProjection,
} from '@viviefs/telemetry/suites'
import type { CheckResult } from '@viviefs/testing'
import {
  P10_ENGINE_CHECK_COUNT,
  runTraceJournalChecks,
  type StoreFactory,
} from '@viviefs/workflow-engine/suites'
import { fail, writeJson } from './dev-client.ts'
import { runSinkChecks } from './p10-checks.ts'
import { spanReviewDrift } from './p10-review.ts'
import { P10_SINKS } from './p10-sinks.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p10')
const EVIDENCE = join(ROOT, 'docs/evidence/2026-09-26-p10.md')
const WALL = 1_700_000_000_000

const requirePass = (checks: ReadonlyArray<CheckResult>, label: string, expected: number) => {
  if (checks.length !== expected) fail(`${label}: expected ${expected} checks, got ${checks.length}`)
  const failed = checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    fail(`${label} failed: ${failed.map((check) => `${check.name}: ${check.detail}`).join('; ')}`)
  }
  console.log(`${label} passed (${expected} checks).`)
}

const withTemp = async <A>(prefix: string, use: (directory: string) => Promise<A>) => {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  try {
    return await use(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const hostStores: ReadonlyArray<{
  readonly label: string
  readonly open: (directory: string) => StoreFactory
}> = [
  {
    label: 'sqlite-node',
    open: (directory) => (deviceId) =>
      sqliteNodeLogStore({ filename: join(directory, 'log.sqlite'), deviceId }),
  },
  {
    label: 'postgres',
    open: (directory) => (deviceId) => pgliteLogStore({ deviceId, dataDir: directory }),
  },
]

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  const host: Record<string, { engine: CheckResult[]; projection: CheckResult[] }> = {}

  for (const store of hostStores) {
    console.log(`P10 ${store.label} engine and projection checks...`)
    const engine = await withTemp(`viviefs-p10-engine-${store.label}-`, (directory) =>
      Effect.runPromise(
        runTraceJournalChecks(store.open(directory), makeMutableClock(WALL), `p10-${store.label}`),
      ),
    )
    requirePass(engine, `${store.label} engine`, P10_ENGINE_CHECK_COUNT)
    const projection = await withTemp(`viviefs-p10-projection-${store.label}-`, (directory) =>
      Effect.runPromise(
        runTraceProjection(store.open(directory), makeMutableClock(WALL), `p10-${store.label}`),
      ),
    )
    const checks = judgeTraceProjection(projection)
    requirePass(checks, `${store.label} projection`, P10_PROJECTION_CHECK_COUNT)
    host[store.label] = { engine, projection: checks }
    if (store.label === 'sqlite-node') {
      const drift = spanReviewDrift(projection, await readFile(EVIDENCE, 'utf8'))
      if (drift !== undefined) fail(drift)
      console.log('P10 span review matches the evidence note.')
    }
  }
  await writeJson(ARTIFACTS, 'host.json', host)

  const keep = process.env['P10_KEEP_SINKS'] === '1'
  const sinks = await runSinkChecks({ artifacts: ARTIFACTS, keep })
  await writeJson(ARTIFACTS, 'sinks.json', {
    traceId: sinks.traceId,
    executionEntity: sinks.run.executionEntity,
    reports: sinks.reports,
  })
  requirePass(
    sinks.reports.map((report) => report.check),
    'sinks',
    P10_SINKS.length,
  )
  if (keep) {
    for (const report of sinks.reports) console.log(`P10 ${report.sink}: ${report.viewer}`)
  }
  console.log(
    `P10 passed: durable spans derived from the journal on sqlite-node and postgres; one trace, deterministic ids, no duplicates on replay, attempts linked; motel, Jaeger and otel-lgtm hold trace ${sinks.traceId}; a disabled trace cursor kept the backlog.`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
