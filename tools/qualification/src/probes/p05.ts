import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import { CHANGESET_TTL_MS } from '@viviefs/datom'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  makeMutableClock,
  P05_CHECK_COUNT,
  runChangesetChecks,
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
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p05')
const SLOT = '__viviefsP05'
const CHECK_COUNT = P05_CHECK_COUNT

const envFor = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
  ...extra,
  EXPO_PUBLIC_GATE: 'P05',
  EXPO_PUBLIC_P05_VARIANT: 'official',
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
  layer: Parameters<typeof runChangesetChecks>[0],
): Promise<CheckResult[]> => {
  const clock = makeMutableClock(1_700_000_000_000)
  const checks = await Effect.runPromise(runChangesetChecks(layer, clock))
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
    gate: 'P05',
    variant: 'official',
    treeTokens: ['p05-status', 'p05-check-incomplete-changeset'],
    hermesWaitMs: 300_000,
  })

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  await writeJson(ARTIFACTS, 'picks.json', {
    changesetTtlMs: CHANGESET_TTL_MS,
    attributes: 'viviefs/changeset/* and evidence/* pinned by P05',
  })

  const nodeDir = await mkdtemp(join(tmpdir(), 'viviefs-p05-node-'))
  try {
    console.log('P05 sqlite-node...')
    const nodeChecks = await runHostStore(
      'sqlite-node',
      sqliteNodeLogStore({
        filename: join(nodeDir, 'log.sqlite'),
        deviceId: 'p05-node',
      }),
    )
    await writeJson(ARTIFACTS, 'sqlite-node.json', nodeChecks)

    console.log('P05 postgres (PGlite)...')
    const pgDir = await mkdtemp(join(tmpdir(), 'viviefs-p05-pg-'))
    try {
      const pgChecks = await runHostStore(
        'postgres',
        pgliteLogStore({ deviceId: 'p05-pg', dataDir: pgDir }),
      )
      await writeJson(ARTIFACTS, 'postgres.json', pgChecks)
    } finally {
      await rm(pgDir, { recursive: true, force: true })
    }
  } finally {
    await rm(nodeDir, { recursive: true, force: true })
  }

  await recordAgentStatus(APP, ARTIFACTS, 'P05')

  const reports: ProbeReport[] = []
  console.log('P05 iOS native (op-sqlite)...')
  reports.push(await runNative('ios'))

  console.log('P05 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081])
  console.log('P05 Android native (op-sqlite)...')
  reports.push(await runNative('android', androidEnv()))

  console.log('P05 web wasm (OPFS)...')
  reports.push(
    await runWebVariant({
      cwd: APP,
      artifacts: ARTIFACTS,
      env: envFor(),
      slot: SLOT,
      gate: 'P05',
      variant: 'official',
    }),
  )

  for (const report of reports) {
    assertAllPass(report, CHECK_COUNT, `${report.platform} ${report.variant}`)
  }

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'node+dev-client+web',
    picks: { changesetTtlMs: CHANGESET_TTL_MS },
    reports,
  })
  console.log(
    `P05 passed: changesets and projections on sqlite-node, postgres (PGlite), iOS, Android and web. TTL ${CHANGESET_TTL_MS}ms.`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
