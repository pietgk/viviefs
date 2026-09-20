import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  makeMutableClock,
  P06_CHECK_COUNT,
  P06_DATOM_CHECK_COUNT,
  runCrashMatrix,
  runMemoryDurabilityControl,
  type CheckResult,
} from '@viviefs/testing'
import { fail, writeJson } from './dev-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p06')

const requirePass = (checks: CheckResult[], label: string, expected: number) => {
  if (checks.length !== expected) {
    fail(`${label}: expected ${expected} checks, got ${checks.length}`)
  }
  const failed = checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    fail(
      `${label} failed: ${failed.map((check) => `${check.name}: ${check.detail}`).join('; ')}`,
    )
  }
}

const runHost = async (
  label: string,
  openStore: Parameters<typeof runCrashMatrix>[0],
): Promise<CheckResult[]> => {
  const clock = makeMutableClock(1_700_000_000_000)
  const checks = await Effect.runPromise(runCrashMatrix(openStore, clock))
  requirePass(checks, label, P06_DATOM_CHECK_COUNT)
  console.log(`${label} passed (${P06_DATOM_CHECK_COUNT} crash-matrix checks).`)
  return checks
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  await writeJson(ARTIFACTS, 'picks.json', {
    attributes: [
      'viviefs/workflow/started',
      'viviefs/workflow/result',
      'viviefs/activity/exit',
      'viviefs/deferred/exit',
      'viviefs/clock/wake-at',
      'viviefs/lease/holder',
    ],
    idShapes: [
      'O{org}/W{exec}',
      'O{org}/W{exec}/A{name}#{attempt}',
      'O{org}/W{exec}/D{name}',
      'O{org}/W{exec}/C{name}',
    ],
  })

  const nodeDir = await mkdtemp(join(tmpdir(), 'viviefs-p06-node-'))
  try {
    console.log('P06 sqlite-node crash matrix...')
    const nodeChecks = await runHost('sqlite-node', (deviceId) =>
      sqliteNodeLogStore({
        filename: join(nodeDir, 'log.sqlite'),
        deviceId,
      }),
    )
    await writeJson(ARTIFACTS, 'sqlite-node.json', nodeChecks)

    console.log('P06 postgres (PGlite) crash matrix...')
    const pgDir = await mkdtemp(join(tmpdir(), 'viviefs-p06-pg-'))
    try {
      const pgChecks = await runHost('postgres', (deviceId) =>
        pgliteLogStore({ deviceId, dataDir: pgDir }),
      )
      await writeJson(ARTIFACTS, 'postgres.json', pgChecks)
    } finally {
      await rm(pgDir, { recursive: true, force: true })
    }
  } finally {
    await rm(nodeDir, { recursive: true, force: true })
  }

  console.log('P06 memory-engine durability positive control...')
  const memory = await Effect.runPromise(runMemoryDurabilityControl())
  requirePass([memory], 'memory durability control', 1)
  await writeJson(ARTIFACTS, 'memory.json', memory)

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'node+postgres+memory-control',
    checkCount: P06_CHECK_COUNT,
    memory,
  })
  console.log(
    `P06 passed: datom-backed engine resumed after kills on sqlite-node and postgres; memory engine failed durability.`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
