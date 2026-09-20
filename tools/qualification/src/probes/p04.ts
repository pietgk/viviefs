import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import {
  APPEND_VOLUME,
  FUTURE_SKEW_MS,
} from '@viviefs/datom'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  makeMutableClock,
  P04_CHECK_COUNT,
  runLogStoreChecks,
  type CheckResult,
} from '@viviefs/testing'
import { androidEnv, ensureAndroidEmulator, reverseAndroidPorts } from './devices.ts'
import {
  assertAllPass,
  fail,
  recordAgentStatus,
  runDeviceVariant,
  writeJson,
  type ProbeReport,
} from './dev-client.ts'
import { runWebVariant } from './web-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p04')
const SLOT = '__viviefsP04'
const CHECK_COUNT = P04_CHECK_COUNT

const envFor = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
  ...extra,
  EXPO_PUBLIC_GATE: 'P04',
  EXPO_PUBLIC_P04_VARIANT: 'official',
  EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
})

const requirePass = (checks: CheckResult[], label: string) => {
  if (checks.length !== CHECK_COUNT) {
    fail(`${label}: expected ${CHECK_COUNT} checks, got ${checks.length}`)
  }
  const failed = checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    fail(
      `${label} failed: ${failed.map((check) => `${check.name}: ${check.detail}`).join('; ')}`,
    )
  }
}

const runHostStore = async (
  label: string,
  layer: Parameters<typeof runLogStoreChecks>[0],
): Promise<CheckResult[]> => {
  const clock = makeMutableClock(1_700_000_000_000)
  const checks = await Effect.runPromise(runLogStoreChecks(layer, clock))
  requirePass(checks, label)
  console.log(`${label} passed (${CHECK_COUNT} checks).`)
  return checks
}

const runNative = (platform: 'ios' | 'android', extra: NodeJS.ProcessEnv = {}) =>
  runDeviceVariant({
    cwd: APP,
    artifacts: ARTIFACTS,
    qualificationCwd: QUAL,
    platform,
    env: envFor(extra),
    slot: SLOT,
    gate: 'P04',
    variant: 'official',
    treeTokens: ['p04-status', 'p04-check-append'],
    hermesWaitMs: 300_000,
  })

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  await writeJson(ARTIFACTS, 'picks.json', {
    futureSkewMs: FUTURE_SKEW_MS,
    appendVolume: APPEND_VOLUME,
    postgres: '@effect/sql-pglite (postgres dialect, Apache-2.0)',
  })

  const nodeDir = await mkdtemp(join(tmpdir(), 'viviefs-p04-node-'))
  try {
    console.log('P04 sqlite-node...')
    const nodeChecks = await runHostStore(
      'sqlite-node',
      sqliteNodeLogStore({
        filename: join(nodeDir, 'log.sqlite'),
        deviceId: 'p04-node',
      }),
    )
    await writeJson(ARTIFACTS, 'sqlite-node.json', nodeChecks)

    console.log('P04 postgres (PGlite)...')
    const pgDir = await mkdtemp(join(tmpdir(), 'viviefs-p04-pg-'))
    try {
      const pgChecks = await runHostStore(
        'postgres',
        pgliteLogStore({ deviceId: 'p04-pg', dataDir: pgDir }),
      )
      await writeJson(ARTIFACTS, 'postgres.json', pgChecks)
    } finally {
      await rm(pgDir, { recursive: true, force: true })
    }
  } finally {
    await rm(nodeDir, { recursive: true, force: true })
  }

  await recordAgentStatus(APP, ARTIFACTS, 'P04')

  const reports: ProbeReport[] = []
  console.log('P04 iOS native (op-sqlite)...')
  reports.push(await runNative('ios'))

  console.log('P04 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081])
  console.log('P04 Android native (op-sqlite)...')
  reports.push(await runNative('android', androidEnv()))

  console.log('P04 web wasm (OPFS)...')
  reports.push(
    await runWebVariant({
      cwd: APP,
      artifacts: ARTIFACTS,
      env: envFor(),
      slot: SLOT,
      gate: 'P04',
      variant: 'official',
    }),
  )

  for (const report of reports) {
    assertAllPass(report, CHECK_COUNT, `${report.platform} ${report.variant}`)
  }

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'node+dev-client+web',
    picks: {
      futureSkewMs: FUTURE_SKEW_MS,
      appendVolume: APPEND_VOLUME,
    },
    reports,
  })
  console.log(
    `P04 passed: log store contract on sqlite-node, postgres (PGlite), iOS, Android and web. Future-skew bound ${FUTURE_SKEW_MS}ms, volume ${APPEND_VOLUME}.`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
