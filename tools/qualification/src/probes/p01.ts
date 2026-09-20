import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from '../process.ts'
import { androidEnv, ensureAndroidEmulator, reverseAndroidPorts } from './devices.ts'
import {
  assertAllPass,
  fail,
  recordAgentStatus,
  runDeviceVariant,
  writeJson,
  type ProbeReport,
} from './dev-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p01')

const CHECK_COUNT = 15
const WORKFLOW_CHECK = 'workflow memory'
const WORKFLOW_TEST_ID = 'p01-check-workflow-memory'
const SLOT = '__viviefsP01'

const assertPositiveControl = (report: ProbeReport, platform: string) => {
  const workflow = report.checks.find((check) => check.name === WORKFLOW_CHECK)
  if (!workflow) {
    return fail(`${platform} no-polyfill omitted ${WORKFLOW_CHECK}`)
  }
  if (workflow.status !== 'FAIL') {
    return fail(
      `${platform} positive control failed: ${WORKFLOW_CHECK} passed without the crypto polyfill`,
    )
  }
}

const expoEnv = (options: {
  polyfill: boolean
  importSql?: boolean
}): NodeJS.ProcessEnv => ({
  EXPO_PUBLIC_GATE: 'P01',
  EXPO_PUBLIC_CRYPTO_POLYFILL: options.polyfill ? '1' : '0',
  EXPO_PUBLIC_IMPORT_SQL: options.importSql ? '1' : '0',
})

const runP01Device = (
  platform: 'ios' | 'android',
  polyfill: boolean,
  env: NodeJS.ProcessEnv,
) =>
  runDeviceVariant({
    cwd: APP,
    artifacts: ARTIFACTS,
    qualificationCwd: QUAL,
    platform,
    env,
    slot: SLOT,
    gate: 'P01',
    variant: polyfill ? 'polyfill' : 'no-polyfill',
    treeTokens: ['p01-status', WORKFLOW_TEST_ID],
  })

const recordIos27Meaning = async () => {
  const xcode = await command('xcodebuild', ['-version'], { timeout: 30_000 })
  const simulators = await command(
    'xcrun',
    ['simctl', 'list', 'runtimes'],
    { timeout: 30_000 },
  )
  const expoPkgFile = [
    join(APP, 'node_modules/expo/package.json'),
    join(ROOT, 'node_modules/expo/package.json'),
  ].find((path) => existsSync(path))
  if (!expoPkgFile) throw new Error('expo package.json not found')
  const expoPkg = JSON.parse(await readFile(expoPkgFile, 'utf8')) as {
    version: string
  }
  const config = await command(
    'pnpm',
    ['exec', 'expo', 'config', '--type', 'public', '--json'],
    { cwd: APP, timeout: 60_000 },
  )
  let parsedConfig: unknown
  try {
    parsedConfig = JSON.parse(config.stdout)
  } catch {
    parsedConfig = { raw: config.stdout, stderr: config.stderr }
  }
  const meaning = {
    changelogClaim:
      'SDK 58 is built for iOS 27 (Expo changelog 2026-09-15). Apps built with the iOS 27 SDK get the UIKit scene-based life cycle and iPhone resizing automatically.',
    measuredMeaning:
      'Build SDK, not the minimum deployment target. Local Xcode 26.6 / iOS 26.x simulators can still compile and run SDK 58; EAS `latest` also ships Xcode 26.6 until the Xcode 27 image lands. Scene-based lifecycle is already required in the Expo template regardless of the installed simulator OS.',
    localXcode: xcode.stdout.trim(),
    simulatorRuntimes: simulators.stdout.trim(),
    expoVersion: expoPkg.version,
    appConfig: parsedConfig,
    appJsonDeploymentTarget: 'unset; Expo default applies at prebuild',
  }
  await writeJson(ARTIFACTS, 'ios-27-meaning.json', meaning)
  console.log('P01 iOS 27 meaning recorded.')
  return meaning
}

const exportBundle = async (
  name: string,
  env: NodeJS.ProcessEnv,
): Promise<{ bytes: number; file: string }> => {
  const outputDir = join(ARTIFACTS, name)
  const exported = await command(
    'pnpm',
    ['exec', 'expo', 'export', '--platform', 'ios', '--output-dir', outputDir],
    {
      cwd: APP,
      env: { ...process.env, ...env, CI: '1', EXPO_NO_TELEMETRY: '1' },
      timeout: 180_000,
    },
  )
  await writeFile(join(ARTIFACTS, `${name}.log`), exported.stdout + exported.stderr)
  if (exported.code !== 0) {
    throw new Error(`${name} export failed:\n${exported.stderr || exported.stdout}`)
  }
  const files: string[] = []
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await walk(path)
      else files.push(path)
    }
  }
  await walk(outputDir)
  const bundles = files.filter(
    (file) => /\.(hbc|js)$/.test(file) && file.includes('ios'),
  )
  const measured = await Promise.all(
    (bundles.length > 0 ? bundles : files).map(async (file) => ({
      file,
      bytes: (await stat(file)).size,
    })),
  )
  measured.sort((a, b) => b.bytes - a.bytes)
  const largest = measured[0]
  if (!largest) throw new Error(`${name} produced no files`)
  return largest
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  const ios27 = await recordIos27Meaning()
  const agentStatus = await recordAgentStatus(APP, ARTIFACTS, 'P01')

  console.log('P01 export with Migrator SQL import...')
  const sqlBundle = await exportBundle('export-sql', {
    EXPO_PUBLIC_GATE: 'P01',
    EXPO_PUBLIC_IMPORT_SQL: '1',
    EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  })
  console.log(`P01 SQL bundle ${sqlBundle.file} ${sqlBundle.bytes} bytes`)

  console.log('P01 export without SQL import (bundle-size baseline)...')
  const baseline = await exportBundle('export-baseline', {
    EXPO_PUBLIC_GATE: 'P01',
    EXPO_PUBLIC_IMPORT_SQL: '0',
    EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  })
  await writeJson(ARTIFACTS, 'bundle-size.json', {
    platform: 'ios',
    file: baseline.file,
    bytes: baseline.bytes,
    sqlImportBundleBytes: sqlBundle.bytes,
  })
  console.log(`P01 baseline bundle ${baseline.bytes} bytes`)

  const reports: ProbeReport[] = []
  reports.push(
    await runP01Device('ios', true, expoEnv({ polyfill: true })),
  )
  reports.push(
    await runP01Device('ios', false, expoEnv({ polyfill: false })),
  )

  console.log('P01 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081])
  const androidBase = androidEnv()
  reports.push(
    await runP01Device('android', true, {
      ...androidBase,
      ...expoEnv({ polyfill: true }),
    }),
  )
  reports.push(
    await runP01Device('android', false, {
      ...androidBase,
      ...expoEnv({ polyfill: false }),
    }),
  )

  const iosPolyfill = reports.find(
    (report) => report.platform === 'ios' && report.variant === 'polyfill',
  )
  const iosControl = reports.find(
    (report) => report.platform === 'ios' && report.variant === 'no-polyfill',
  )
  const androidPolyfill = reports.find(
    (report) => report.platform === 'android' && report.variant === 'polyfill',
  )
  const androidControl = reports.find(
    (report) =>
      report.platform === 'android' && report.variant === 'no-polyfill',
  )
  if (!iosPolyfill || !iosControl || !androidPolyfill || !androidControl) {
    return fail('P01 missing a required iOS or Android report')
  }
  assertAllPass(iosPolyfill, CHECK_COUNT, 'iOS polyfill')
  assertAllPass(androidPolyfill, CHECK_COUNT, 'Android polyfill')
  assertPositiveControl(iosControl, 'iOS')
  assertPositiveControl(androidControl, 'Android')

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'dev-client',
    driver: '@expo/agent-cli runtime:eval',
    ios27,
    agentStatus,
    bundleBytes: baseline.bytes,
    sqlBundleBytes: sqlBundle.bytes,
    reports,
  })
  console.log('P01 passed on iOS simulator and Android emulator (dev-client).')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
