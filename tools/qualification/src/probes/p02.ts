import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p02')
const SLOT = '__viviefsP02'
const CHECK_COUNT = 6
const PINNED_OP_SQLITE = '18.2.5'

const readJson = async (path: string) =>
  JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>

const resolvePackageJson = (name: string): string => {
  const candidates = [
    join(APP, 'node_modules', name, 'package.json'),
    join(ROOT, 'node_modules', name, 'package.json'),
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) throw new Error(`${name} package.json not found`)
  return found
}

const assertOpSqlitePin = async () => {
  const workspace = await readFile(join(ROOT, 'pnpm-workspace.yaml'), 'utf8')
  if (!/@op-engineering\/op-sqlite['"]?\s*:\s*['"]?18\.2\.5/.test(workspace)) {
    fail(
      `P02 requires pnpm-workspace.yaml to pin @op-engineering/op-sqlite to ${PINNED_OP_SQLITE}.`,
    )
  }
  const opSqlite = (await readJson(
    resolvePackageJson('@op-engineering/op-sqlite'),
  )) as { version: string; license?: string }
  if (opSqlite.version !== PINNED_OP_SQLITE) {
    fail(
      `P02 expected op-sqlite ${PINNED_OP_SQLITE}, found ${opSqlite.version}`,
    )
  }
  const effectSql = (await readJson(
    resolvePackageJson('@effect/sql-sqlite-react-native'),
  )) as { version: string; peerDependencies?: { '@op-engineering/op-sqlite'?: string } }
  const peer = effectSql.peerDependencies?.['@op-engineering/op-sqlite'] ?? ''
  if (!peer.includes('<18')) {
    fail(
      `@effect/sql-sqlite-react-native peer for op-sqlite is ${peer}; P02 records the stale <18 bound as the conflict being overridden.`,
    )
  }
  const pin = {
    opSqlite: opSqlite.version,
    license: opSqlite.license ?? 'unknown',
    effectSqlNative: effectSql.version,
    peer,
    override: PINNED_OP_SQLITE,
    whyNot17:
      'op-sqlite 17.1.3 does not compile on RN 0.88 New Architecture: RCTCxxBridge was removed in 0.87. 18.2.5 installs JSI via RCTBridgeProxy. D16 named 17.x; this pin is the P02-measured resolution of the peer conflict.',
  }
  await writeJson(ARTIFACTS, 'op-sqlite-pin.json', pin)
  console.log(
    `P02 pinned @op-engineering/op-sqlite@${opSqlite.version} (Effect peer ${peer}, overridden).`,
  )
  return pin
}

const envFor = (
  driver: 'official' | 'fallback',
  extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv => ({
  ...extra,
  EXPO_PUBLIC_GATE: 'P02',
  EXPO_PUBLIC_SQL_DRIVER: driver,
  EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
})

const runNative = (
  platform: 'ios' | 'android',
  driver: 'official' | 'fallback',
  extra: NodeJS.ProcessEnv = {},
) =>
  runDeviceVariant({
    cwd: APP,
    artifacts: ARTIFACTS,
    qualificationCwd: QUAL,
    platform,
    env: envFor(driver, extra),
    slot: SLOT,
    gate: 'P02',
    variant: driver,
    treeTokens: ['p02-status', 'p02-check-migrate'],
  })

const requireReport = (
  reports: ProbeReport[],
  platform: ProbeReport['platform'],
  variant: string,
): ProbeReport => {
  const found = reports.find(
    (report) => report.platform === platform && report.variant === variant,
  )
  if (!found) return fail(`P02 missing ${platform} ${variant} report`)
  return found
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  const pin = await assertOpSqlitePin()
  await recordAgentStatus(APP, ARTIFACTS, 'P02')

  const reports: ProbeReport[] = []
  console.log('P02 iOS official (op-sqlite 18.2.5)...')
  reports.push(await runNative('ios', 'official'))
  console.log('P02 iOS fallback (expo-sqlite)...')
  reports.push(await runNative('ios', 'fallback'))

  console.log('P02 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081])
  const androidBase = androidEnv()
  console.log('P02 Android official (op-sqlite 18.2.5)...')
  reports.push(await runNative('android', 'official', androidBase))
  console.log('P02 Android fallback (expo-sqlite)...')
  reports.push(await runNative('android', 'fallback', androidBase))

  console.log('P02 web official (sql-sqlite-wasm OPFS)...')
  reports.push(
    await runWebVariant({
      cwd: APP,
      artifacts: ARTIFACTS,
      env: envFor('official'),
      slot: SLOT,
      gate: 'P02',
      variant: 'official',
    }),
  )
  console.log('P02 web fallback (expo-sqlite)...')
  reports.push(
    await runWebVariant({
      cwd: APP,
      artifacts: ARTIFACTS,
      env: envFor('fallback'),
      slot: SLOT,
      gate: 'P02',
      variant: 'fallback',
    }),
  )

  const required: Array<[ProbeReport['platform'], string]> = [
    ['ios', 'official'],
    ['ios', 'fallback'],
    ['android', 'official'],
    ['android', 'fallback'],
    ['web', 'official'],
    ['web', 'fallback'],
  ]
  for (const [platform, variant] of required) {
    assertAllPass(
      requireReport(reports, platform, variant),
      CHECK_COUNT,
      `${platform} ${variant}`,
    )
  }

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'dev-client+web',
    pin,
    reports,
  })
  console.log(
    'P02 passed: official drivers on iOS, Android and web; expo-sqlite fallback passed the same checks.',
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
