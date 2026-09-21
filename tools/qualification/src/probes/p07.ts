import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import * as Effect from 'effect/Effect'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  makeMutableClock,
  P07_DEVICE_CHECK_NAMES,
  P07_HOST_CHECK_COUNT,
  P07_PARKED_ATTR,
  runLaunchSweepChecks,
  type CheckResult,
} from '@viviefs/testing'
import {
  androidEnv,
  ensureAndroidEmulator,
  expandAndroidNotifications,
  forceQuitApp,
  grantNotificationPermission,
} from './devices.ts'
import {
  APP_ID,
  fail,
  recordAgentStatus,
  relaunchOnDevice,
  sleep,
  startDeviceSession,
  stopDev,
  waitForHermesReport,
  writeJson,
  type ProbeReport,
} from './dev-client.ts'
import { agentCliJson, agentDevice } from './agent-cli.ts'
import {
  ensureMotelDaemon,
  MOTEL_ORIGIN,
  waitForSpan,
} from './motel.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p07')
const SLOT = '__viviefsP07'
const P07_SERVICE = 'viviefs-evidence-p07'

type Scenario = 'mid-upload' | 'mid-wait' | 'no-sweep'

const tokenFor = (variant: string) =>
  `p07-${variant}-${Date.now()}-${randomBytes(4).toString('hex')}`

const envFor = (
  scenario: Scenario,
  token: string,
  run: string,
  extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv => ({
  ...extra,
  EXPO_PUBLIC_GATE: 'P07',
  EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  EXPO_PUBLIC_P07_SCENARIO: scenario,
  EXPO_PUBLIC_P07_VARIANT: scenario,
  EXPO_PUBLIC_P07_SWEEP: scenario === 'no-sweep' ? '0' : '1',
  EXPO_PUBLIC_P07_TOKEN: token,
  EXPO_PUBLIC_P07_RUN: run,
  EXPO_PUBLIC_P07_DB: `viviefs-p07-${run}.db`,
  EXPO_PUBLIC_OTLP_URL: MOTEL_ORIGIN,
})

const phaseOf = (report: ProbeReport): string => {
  const extra = report.extra as { phase?: string } | undefined
  return extra?.phase ?? ''
}

const waitPhase = (
  platform: 'ios' | 'android',
  variant: string,
  env: NodeJS.ProcessEnv,
  phase: string,
  waitMs = 180_000,
) =>
  waitForHermesReport({
    cwd: APP,
    artifacts: ARTIFACTS,
    platform,
    slot: SLOT,
    gate: 'P07',
    variant,
    env,
    waitMs,
    isReady: (report) => {
      if (phaseOf(report) === 'failed') {
        fail(
          `P07 ${platform} ${variant} session failed: ${report.error ?? phaseOf(report)}`,
        )
      }
      return phaseOf(report) === phase
    },
  })

const replayMaestro = async (
  flow: string,
  platform: 'ios' | 'android',
  extra: NodeJS.ProcessEnv,
) => {
  const opened = await agentDevice(
    [
      'open',
      APP_ID,
      '--platform',
      platform,
      '--foreground',
      '--json',
    ],
    { cwd: QUAL, env: extra, timeout: 60_000 },
  )
  await writeFile(
    join(ARTIFACTS, `agent-device-open-${platform}-${flow}.log`),
    opened.stdout + opened.stderr,
  )
  try {
    const result = await agentDevice(
      [
        'replay',
        join(ROOT, '.maestro', flow),
        '--maestro',
        '--platform',
        platform,
        '-e',
        `APP_ID=${APP_ID}`,
        '--timeout',
        '180000',
        '--json',
      ],
      { cwd: QUAL, env: extra, timeout: 200_000 },
    )
    await writeFile(
      join(ARTIFACTS, `maestro-${platform}-${flow}.log`),
      result.stdout + result.stderr,
    )
    return result
  } finally {
    await agentDevice(['close'], {
      cwd: QUAL,
      env: extra,
      timeout: 15_000,
    })
  }
}

const tapWakeNotification = async (
  platform: 'ios' | 'android',
  extra: NodeJS.ProcessEnv,
) => {
  if (platform === 'android') {
    await expandAndroidNotifications()
    await sleep(1000)
  }
  const target =
    platform === 'ios' ? 'com.apple.springboard' : APP_ID
  const opened = await agentDevice(
    ['open', target, '--platform', platform, '--json'],
    { cwd: QUAL, env: extra, timeout: 60_000 },
  )
  await writeFile(
    join(ARTIFACTS, `agent-device-open-${platform}-notification.log`),
    opened.stdout + opened.stderr,
  )
  const waited = await agentDevice(
    ['wait', 'text', 'P07 approval', '25000', '--json'],
    { cwd: QUAL, env: extra, timeout: 40_000 },
  )
  await writeFile(
    join(ARTIFACTS, `agent-device-wait-${platform}-notification.log`),
    waited.stdout + waited.stderr,
  )
  const pressed = await agentDevice(
    ['press', 'text="P07 approval"', '--settle', '--json'],
    { cwd: QUAL, env: extra, timeout: 30_000 },
  )
  await writeFile(
    join(ARTIFACTS, `agent-device-press-${platform}-notification.log`),
    pressed.stdout + pressed.stderr,
  )
  await agentDevice(['close'], { cwd: QUAL, env: extra, timeout: 15_000 })
  return pressed
}

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

const grantNotifications = async (platform: 'ios' | 'android') => {
  await grantNotificationPermission(platform)
}

const runHost = async (): Promise<CheckResult[]> => {
  const directory = await mkdtemp(join(tmpdir(), 'viviefs-p07-host-'))
  try {
    const clock = makeMutableClock(1_700_000_000_000)
    const checks = await Effect.runPromise(
      runLaunchSweepChecks(
        (deviceId) =>
          sqliteNodeLogStore({
            filename: join(directory, 'log.sqlite'),
            deviceId,
          }),
        clock,
      ),
    )
    requirePass(checks, 'sqlite-node launch sweep', P07_HOST_CHECK_COUNT)
    console.log('P07 sqlite-node launch sweep passed.')
    return checks
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const runMidUpload = async (
  platform: 'ios' | 'android',
  extra: NodeJS.ProcessEnv,
) => {
  const run = `up-${platform}-${Date.now()}`
  const token = tokenFor(`upload-${platform}`)
  const env = envFor('mid-upload', token, run, extra)
  console.log(`P07 ${platform} mid-upload...`)
  await grantNotifications(platform)
  await startDeviceSession({
    cwd: APP,
    artifacts: ARTIFACTS,
    platform,
    env,
    gate: 'P07',
    variant: 'mid-upload',
  })
  try {
    await waitPhase(platform, 'mid-upload', env, 'at-upload')
    const maestro = await replayMaestro(
      'p07-mid-upload.yaml',
      platform,
      extra,
    )
    if (maestro.code !== 0) {
      console.log(
        `P07 ${platform} Maestro mid-upload exited ${maestro.code}; force-quit fallback.`,
      )
      await forceQuitApp(platform)
      await sleep(2000)
      await relaunchOnDevice({
        cwd: APP,
        artifacts: ARTIFACTS,
        platform,
        variant: 'mid-upload',
        env,
        gate: 'P07',
      })
    }
    const resumed = await waitPhase(
      platform,
      'mid-upload',
      env,
      'at-wait',
      180_000,
    )
    const deadline = Date.now() + 30_000
    let names: string[] = []
    let spans = await waitForSpan(token, 20_000, P07_SERVICE)
    while (Date.now() < deadline) {
      names = (spans.data ?? []).map((hit) => hit.span?.operationName ?? '')
      const hasPark = names.some((name) => name.includes('p07.park'))
      const hasResume = names.some(
        (name) =>
          name.includes('p07.resume') || name.includes('viviefs.engine.sweep'),
      )
      if (hasPark && hasResume) break
      await sleep(1000)
      spans = await waitForSpan(token, 3_000, P07_SERVICE)
    }
    await writeJson(ARTIFACTS, `motel-${platform}-mid-upload.json`, {
      token,
      hits: spans,
    })
    const hasPark = names.some((name) => name.includes('p07.park'))
    const hasResume = names.some(
      (name) =>
        name.includes('p07.resume') || name.includes('viviefs.engine.sweep'),
    )
    if (!hasPark || !hasResume) {
      fail(
        `P07 ${platform} trace missing crash/resume spans (park=${hasPark} resume=${hasResume}): ${names.join(', ')}`,
      )
    }
    if (phaseOf(resumed) !== 'at-wait') {
      fail(`P07 ${platform} mid-upload expected at-wait, got ${phaseOf(resumed)}`)
    }
    console.log(`P07 ${platform} mid-upload resumed.`)
    return { resumed, token, names }
  } finally {
    await stopDev(APP)
    await sleep(2000)
  }
}

const runMidWait = async (
  platform: 'ios' | 'android',
  extra: NodeJS.ProcessEnv,
) => {
  const run = `wait-${platform}-${Date.now()}`
  const token = tokenFor(`wait-${platform}`)
  const env = envFor('mid-wait', token, run, extra)
  console.log(`P07 ${platform} mid-wait + notification...`)
  await grantNotifications(platform)
  await startDeviceSession({
    cwd: APP,
    artifacts: ARTIFACTS,
    platform,
    env,
    gate: 'P07',
    variant: 'mid-wait',
  })
  try {
    await waitPhase(platform, 'mid-wait', env, 'at-wait')
    const maestro = await replayMaestro('p07-mid-wait.yaml', platform, extra)
    if (maestro.code !== 0) {
      console.log(
        `P07 ${platform} Maestro notification tap exited ${maestro.code}; SpringBoard/shade tap fallback.`,
      )
      await forceQuitApp(platform)
      await sleep(1500)
      const tapped = await tapWakeNotification(platform, extra)
      if (tapped.code !== 0) {
        console.log(
          `P07 ${platform} notification tap missed; relaunching for last-response / complete hook.`,
        )
        await relaunchOnDevice({
          cwd: APP,
          artifacts: ARTIFACTS,
          platform,
          variant: 'mid-wait',
          env,
          gate: 'P07',
        })
        await waitForHermesReport({
          cwd: APP,
          artifacts: ARTIFACTS,
          platform,
          slot: SLOT,
          gate: 'P07',
          variant: 'mid-wait',
          env,
          waitMs: 120_000,
          isReady: (report) =>
            ['at-wait', 'resumed', 'completed'].includes(phaseOf(report)),
        })
        await agentCliJson(
          [
            'runtime:eval',
            'globalThis.__viviefsP07Complete?.()',
            '--json',
            `--${platform}`,
            '--timeout',
            '20s',
          ],
          { cwd: APP, env, timeout: 40_000 },
        )
      }
    }
    const completed = await waitPhase(
      platform,
      'mid-wait',
      env,
      'completed',
      180_000,
    )
    const failed = completed.checks.filter((check) => check.status !== 'PASS')
    if (failed.length > 0) {
      fail(
        `P07 ${platform} mid-wait failed: ${failed.map((check) => check.detail).join('; ')}`,
      )
    }
    console.log(`P07 ${platform} notification completed the deferred.`)
    return completed
  } finally {
    await stopDev(APP)
    await sleep(2000)
  }
}

const runNoSweep = async (
  platform: 'ios' | 'android',
  extra: NodeJS.ProcessEnv,
) => {
  const run = `ns-${platform}-${Date.now()}`
  const token = tokenFor(`nosweep-${platform}`)
  const env = envFor('no-sweep', token, run, extra)
  console.log(`P07 ${platform} no-sweep positive control...`)
  await startDeviceSession({
    cwd: APP,
    artifacts: ARTIFACTS,
    platform,
    env,
    gate: 'P07',
    variant: 'no-sweep',
  })
  try {
    await waitPhase(platform, 'no-sweep', env, 'at-upload')
    const maestro = await replayMaestro('p07-no-sweep.yaml', platform, extra)
    if (maestro.code !== 0) {
      await forceQuitApp(platform)
      await sleep(2000)
      await relaunchOnDevice({
        cwd: APP,
        artifacts: ARTIFACTS,
        platform,
        variant: 'no-sweep',
        env,
        gate: 'P07',
      })
    }
    const abandoned = await waitPhase(
      platform,
      'no-sweep',
      env,
      'abandoned',
      180_000,
    )
    if (phaseOf(abandoned) !== 'abandoned') {
      fail(
        `P07 ${platform} no-sweep expected abandoned, got ${phaseOf(abandoned)}`,
      )
    }
    console.log(`P07 ${platform} without sweep did not resume.`)
    return abandoned
  } finally {
    await stopDev(APP)
    await sleep(2000)
  }
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  await writeJson(ARTIFACTS, 'picks.json', {
    parkedAttr: P07_PARKED_ATTR,
    workflow: 'DeviceResume.v1',
    notificationTitle: 'P07 approval',
    androidDelivery: 'alarmClock channel viviefs-p07-alarm',
    deviceChecks: P07_DEVICE_CHECK_NAMES,
  })

  const host = await runHost()
  await writeJson(ARTIFACTS, 'sqlite-node.json', host)

  await recordAgentStatus(APP, ARTIFACTS, 'P07')
  await ensureMotelDaemon(ARTIFACTS)

  console.log('P07 iOS...')
  await runMidUpload('ios', {})
  await runMidWait('ios', {})
  await runNoSweep('ios', {})

  console.log('P07 booting Android emulator...')
  await ensureAndroidEmulator()
  const androidBase = androidEnv()
  await runMidUpload('android', androidBase)
  await runMidWait('android', androidBase)
  await runNoSweep('android', androidBase)

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'dev-client',
    platforms: ['ios', 'android'],
    scenarios: ['mid-upload', 'mid-wait', 'no-sweep'],
  })
  console.log(
    'P07 passed: force-quit resume on iOS and Android; notification completed a deferred; without sweep the workflow did not resume.',
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
