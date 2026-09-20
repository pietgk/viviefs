import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from '../process.ts'
import { agentCli, agentCliJson, agentDevice } from './agent-cli.ts'
import { androidEnv, ensureAndroidEmulator, reverseAndroidPorts } from './devices.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p01')
const APP_ID = 'dev.viviefs.evidence'

const CHECK_COUNT = 15
const WORKFLOW_CHECK = 'workflow memory'
const WORKFLOW_TEST_ID = 'p01-check-workflow-memory'

type CheckResult = {
  name: string
  status: 'PASS' | 'FAIL'
  detail: string
}

type ProbeReport = {
  gate: string
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client'
  ready: boolean
  error: string | null
  report: string
  checks: CheckResult[]
  globals: Record<string, string>
}

type EvalJson = {
  threw?: boolean
  value?: ProbeReport | null
  exception?: unknown
}

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const writeJson = async (name: string, value: unknown) => {
  await writeFile(join(ARTIFACTS, name), JSON.stringify(value, null, 2) + '\n')
}

const assertPolyfill = (report: ProbeReport, platform: string) => {
  if (report.checks.length !== CHECK_COUNT) {
    fail(
      `${platform} polyfill reported ${report.checks.length} checks, expected ${CHECK_COUNT}`,
    )
  }
  const failed = report.checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    fail(
      `${platform} polyfill failed:\n${failed.map((check) => `  ${check.name}: ${check.detail}`).join('\n')}`,
    )
  }
}

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
  EXPO_PUBLIC_CRYPTO_POLYFILL: options.polyfill ? '1' : '0',
  EXPO_PUBLIC_IMPORT_SQL: options.importSql ? '1' : '0',
})

const stopDev = async () => {
  await agentCli(['dev:stop', '--json'], { cwd: APP, timeout: 30_000 })
  await freeListenPort(8081)
}

const freeListenPort = async (port: number) => {
  for (let attempt = 0; attempt < 15; attempt++) {
    const listed = await command(
      'lsof',
      ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'],
      { timeout: 5_000 },
    )
    const pids = listed.stdout.split(/\s+/).map((line) => line.trim()).filter(Boolean)
    if (pids.length === 0) return
    for (const pid of pids) {
      await command('kill', ['-9', pid], { timeout: 5_000 })
    }
    await sleep(400)
  }
}

const metroStatusOk = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://127.0.0.1:8081/status', {
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

const waitForMetro = async (ms: number, label: string): Promise<void> => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (await metroStatusOk()) return
    await sleep(5000)
  }
  fail(`${label} Metro did not become ready within ${Math.round(ms / 1000)}s`)
}

const planNeedsNativeBuild = (plan: unknown): boolean => {
  const steps = (plan as { steps?: Array<{ id?: string }> }).steps ?? []
  return steps.some((step) => step.id === 'run' || step.id === 'prebuild')
}

const openOnDevice = async (platform: 'ios' | 'android', variant: string) => {
  const opened = await agentCliJson(
    ['navigate', '/', `--${platform}`, '--json'],
    { cwd: APP, timeout: 60_000 },
  )
  await writeJson(`navigate-${platform}-${variant}.json`, opened.data)
  if (opened.code !== 0) {
    fail(
      `agent-cli navigate / --${platform} failed:\n${opened.stderr || opened.stdout}`,
    )
  }
}

const isProbeReport = (value: unknown): value is ProbeReport => {
  if (!value || typeof value !== 'object') return false
  const report = value as ProbeReport
  return (
    report.gate === 'P01' &&
    typeof report.variant === 'string' &&
    typeof report.ready === 'boolean' &&
    Array.isArray(report.checks)
  )
}

const readHermesReport = async (
  platform: 'ios' | 'android',
): Promise<ProbeReport | undefined> => {
  const evaluated = await agentCliJson(
    [
      'runtime:eval',
      'globalThis.__viviefsP01',
      '--json',
      `--${platform}`,
      '--timeout',
      '20s',
    ],
    { cwd: APP, timeout: 40_000 },
  )
  await writeJson(`eval-${platform}-${Date.now()}.json`, evaluated.data)
  if (evaluated.code !== 0) {
    console.log(
      `P01 runtime:eval ${platform} exited ${evaluated.code}: ${evaluated.stderr.slice(-1000)}`,
    )
    return undefined
  }
  const payload = evaluated.data as EvalJson
  if (payload.threw) return undefined
  return isProbeReport(payload.value) ? payload.value : undefined
}

const waitForHermesReport = async (
  platform: 'ios' | 'android',
  variant: string,
): Promise<ProbeReport> => {
  const deadline = Date.now() + 180_000
  let recovered = false
  while (Date.now() < deadline) {
    const report = await readHermesReport(platform)
    if (report?.ready && report.variant === variant) return report
    if (!recovered) {
      await openOnDevice(platform, variant)
      await agentCliJson(
        ['runtime:reload', `--${platform}`, '--json'],
        { cwd: APP, timeout: 60_000 },
      )
      recovered = true
    }
    await sleep(3000)
  }
  const errors = await agentCliJson(
    ['runtime:errors', '--json', `--${platform}`, '--duration', '5s'],
    { cwd: APP, timeout: 30_000 },
  )
  await writeJson(`errors-${platform}-${variant}.json`, errors.data)
  return fail(
    `${platform} ${variant} did not publish Hermes results within 180s. See runtime:errors artifact.`,
  )
}

const captureTree = async (platform: 'ios' | 'android', variant: string) => {
  const tree = await agentCliJson(
    ['runtime:tree', '--all', '--json', `--${platform}`],
    { cwd: APP, timeout: 60_000 },
  )
  await writeJson(`tree-${platform}-${variant}.json`, tree.data)
  const serialized = JSON.stringify(tree.data ?? {})
  if (!serialized.includes('p01-status') || !serialized.includes(WORKFLOW_TEST_ID)) {
    console.log(
      `P01 ${platform} ${variant} runtime:tree missed expected testIDs (recorded anyway).`,
    )
  }
}

const captureDeviceSnapshot = async (
  platform: 'ios' | 'android',
  variant: string,
) => {
  const opened = await agentDevice(
    [
      'open',
      APP_ID,
      '--platform',
      platform,
      '--json',
    ],
    { cwd: QUAL, timeout: 60_000 },
  )
  await writeFile(
    join(ARTIFACTS, `agent-device-open-${platform}-${variant}.log`),
    opened.stdout + opened.stderr,
  )
  const snapshot = await agentDevice(['snapshot', '-i', '--json'], {
    cwd: QUAL,
    timeout: 30_000,
  })
  await writeFile(
    join(ARTIFACTS, `agent-device-snapshot-${platform}-${variant}.json`),
    snapshot.stdout || snapshot.stderr,
  )
  await agentDevice(['close'], { cwd: QUAL, timeout: 15_000 })
}

const runDeviceVariant = async (options: {
  platform: 'ios' | 'android'
  polyfill: boolean
  env: NodeJS.ProcessEnv
}): Promise<ProbeReport> => {
  const variant = options.polyfill ? 'polyfill' : 'no-polyfill'
  const plan = await agentCliJson(
    [
      'dev',
      `--${options.platform}`,
      '--dev-client',
      '--localhost',
      '--plan',
      '--json',
    ],
    { cwd: APP, env: options.env, timeout: 60_000 },
  )
  await writeJson(`plan-${options.platform}-${variant}.json`, plan.data)
  const planData = plan.data as { target?: string; rule?: string }
  if (planData.target === 'expo-go' || planData.rule === 'expo-go') {
    fail(
      `P01 refused Expo Go for ${options.platform}: agent-cli still planned Expo Go. Install expo-dev-client and pin expo.agentCli.target to dev-build.`,
    )
  }

  await stopDev()
  const nativeBuild = planNeedsNativeBuild(plan.data)
  const started = await agentCliJson(
    [
      'dev',
      `--${options.platform}`,
      '--dev-client',
      '--localhost',
      '--detach',
      ...(nativeBuild ? [] : ['--wait-ready']),
      '--clear',
      '--json',
    ],
    {
      cwd: APP,
      env: options.env,
      timeout: nativeBuild ? 1_200_000 : 180_000,
    },
  )
  await writeJson(`dev-${options.platform}-${variant}.json`, started.data)
  if (started.code !== 0 && !(await metroStatusOk())) {
    fail(
      `agent-cli dev --${options.platform} --dev-client failed:\n${started.stderr || started.stdout}`,
    )
  }
  if (nativeBuild || !(await metroStatusOk())) {
    console.log(
      `P01 waiting for Metro after ${options.platform} ${variant}${nativeBuild ? ' native build' : ''}`,
    )
    await waitForMetro(1_200_000, `${options.platform} ${variant}`)
  }

  const other = options.platform === 'ios' ? 'android' : 'ios'
  await agentCli(['runtime:stop', `--${other}`, '--json'], {
    cwd: APP,
    timeout: 30_000,
  })

  await openOnDevice(options.platform, variant)
  const reloaded = await agentCliJson(
    ['runtime:reload', `--${options.platform}`, '--json'],
    { cwd: APP, timeout: 60_000 },
  )
  await writeJson(`reload-${options.platform}-${variant}.json`, reloaded.data)

  try {
    const report = await waitForHermesReport(options.platform, variant)
    await captureTree(options.platform, variant)
    try {
      await captureDeviceSnapshot(options.platform, variant)
    } catch (error) {
      await writeFile(
        join(ARTIFACTS, `agent-device-${options.platform}-${variant}.error`),
        String(error),
      )
      console.log(
        `P01 ${options.platform} ${variant} agent-device snapshot skipped: ${String(error)}`,
      )
    }
    return report
  } finally {
    await stopDev()
    await sleep(2000)
  }
}

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
  await writeJson('ios-27-meaning.json', meaning)
  console.log('P01 iOS 27 meaning recorded.')
  return meaning
}

const recordAgentStatus = async () => {
  const status = await agentCliJson(['status', '--json'], {
    cwd: APP,
    timeout: 60_000,
  })
  await writeJson('agent-cli-status.json', status.data)
  const project = (status.data as { project?: { usesDevClient?: boolean; sdkVersion?: string } })
    .project
  if (!project?.usesDevClient) {
    fail(
      'P01 requires expo-dev-client. agent-cli status.project.usesDevClient is false; Expo Go is not the host.',
    )
  }
  console.log(
    `P01 agent-cli status: SDK ${project.sdkVersion}, usesDevClient=${project.usesDevClient}`,
  )
  return status.data
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
  const agentStatus = await recordAgentStatus()

  console.log('P01 export with Migrator SQL import...')
  const sqlBundle = await exportBundle('export-sql', {
    EXPO_PUBLIC_IMPORT_SQL: '1',
    EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  })
  console.log(`P01 SQL bundle ${sqlBundle.file} ${sqlBundle.bytes} bytes`)

  console.log('P01 export without SQL import (bundle-size baseline)...')
  const baseline = await exportBundle('export-baseline', {
    EXPO_PUBLIC_IMPORT_SQL: '0',
    EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  })
  await writeJson('bundle-size.json', {
    platform: 'ios',
    file: baseline.file,
    bytes: baseline.bytes,
    sqlImportBundleBytes: sqlBundle.bytes,
  })
  console.log(`P01 baseline bundle ${baseline.bytes} bytes`)

  const reports: ProbeReport[] = []
  const iosEnv = expoEnv({ polyfill: true })
  reports.push(
    await runDeviceVariant({
      platform: 'ios',
      polyfill: true,
      env: iosEnv,
    }),
  )
  reports.push(
    await runDeviceVariant({
      platform: 'ios',
      polyfill: false,
      env: expoEnv({ polyfill: false }),
    }),
  )

  console.log('P01 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081])
  const androidBase = androidEnv()
  reports.push(
    await runDeviceVariant({
      platform: 'android',
      polyfill: true,
      env: { ...androidBase, ...expoEnv({ polyfill: true }) },
    }),
  )
  reports.push(
    await runDeviceVariant({
      platform: 'android',
      polyfill: false,
      env: { ...androidBase, ...expoEnv({ polyfill: false }) },
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
  assertPolyfill(iosPolyfill, 'iOS')
  assertPolyfill(androidPolyfill, 'Android')
  assertPositiveControl(iosControl, 'iOS')
  assertPositiveControl(androidControl, 'Android')

  await writeJson('reports.json', {
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
