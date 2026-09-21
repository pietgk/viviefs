import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { command } from '../process.ts'

export const ANDROID_AVD = 'viviefs-p01'
const SYSTEM_IMAGE = 'system-images;android-36;google_apis;arm64-v8a'

export const resolveAndroidHome = (): string => {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    '/opt/homebrew/share/android-commandlinetools',
    join(homedir(), 'Library/Android/sdk'),
  ].filter((path): path is string => Boolean(path))
  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error(
      'ANDROID_HOME not found. P01 fails if the Android emulator is missing. Install Android command-line tools and a system image.',
    )
  }
  return found
}

export const androidEnv = (androidHome = resolveAndroidHome()): NodeJS.ProcessEnv => {
  const javaHome =
    process.env.JAVA_HOME ??
    join(homedir(), '.local/share/mise/installs/java/temurin-17.0.19+10')
  return {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    JAVA_HOME: javaHome,
    PATH: [
      join(androidHome, 'cmdline-tools/latest/bin'),
      join(androidHome, 'platform-tools'),
      join(androidHome, 'emulator'),
      process.env.PATH ?? '',
    ].join(':'),
  }
}

/** Put SDK tools on this process so later agent-cli calls find adb without an env bag. */
export const applyAndroidEnv = (): NodeJS.ProcessEnv => {
  const env = androidEnv()
  process.env.ANDROID_HOME = env.ANDROID_HOME
  process.env.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT
  process.env.JAVA_HOME = env.JAVA_HOME
  process.env.PATH = env.PATH
  return env
}

const sdkBin = (name: string, androidHome: string): string => {
  const nested = join(androidHome, 'cmdline-tools/latest/bin', name)
  if (existsSync(nested)) return nested
  return name
}

export const ensureAndroidEmulator = async (): Promise<void> => {
  const env = applyAndroidEnv()
  const androidHome = env.ANDROID_HOME as string
  const adb = join(androidHome, 'platform-tools/adb')
  if (!existsSync(adb)) {
    throw new Error(
      `adb missing at ${adb}. Install platform-tools into ANDROID_HOME. P01 fails without the Android emulator.`,
    )
  }
  const emulator = join(androidHome, 'emulator/emulator')
  if (!existsSync(emulator)) {
    throw new Error(
      `emulator missing at ${emulator}. P01 fails without the Android emulator.`,
    )
  }
  const avds = await command(emulator, ['-list-avds'], { env, timeout: 30_000 })
  if (!avds.stdout.split('\n').map((line) => line.trim()).includes(ANDROID_AVD)) {
    const avdmanager = sdkBin('avdmanager', androidHome)
    const created = await command(
      avdmanager,
      [
        'create',
        'avd',
        '--force',
        '--name',
        ANDROID_AVD,
        '--package',
        SYSTEM_IMAGE,
        '--device',
        'pixel_6',
      ],
      { env, timeout: 60_000 },
    )
    if (created.code !== 0) {
      throw new Error(
        `Could not create AVD ${ANDROID_AVD} from ${SYSTEM_IMAGE}: ${created.stderr || created.stdout}`,
      )
    }
  }
  const devices = await command(adb, ['devices'], { env, timeout: 15_000 })
  if (!/emulator-\d+\s+device/.test(devices.stdout)) {
    const child = spawn(
      emulator,
      [
        '-avd',
        ANDROID_AVD,
        '-no-window',
        '-no-audio',
        '-no-boot-anim',
        '-no-metrics',
        '-gpu',
        'auto',
      ],
      { env, stdio: 'ignore', detached: true },
    )
    child.unref()
  }
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    const boot = await command(
      adb,
      ['shell', 'getprop', 'sys.boot_completed'],
      { env, timeout: 10_000 },
    )
    if (boot.stdout.trim() === '1') return
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  throw new Error(
    'Android emulator did not boot within 180s. P01 fails if the Android emulator fails.',
  )
}

export const ANDROID_APP_ID = 'dev.viviefs.evidence'

export const terminateIosApp = async (
  appId = ANDROID_APP_ID,
): Promise<void> => {
  const udid = await iosSimulatorUdid()
  const stopped = await command(
    'xcrun',
    ['simctl', 'terminate', udid, appId],
    { timeout: 15_000 },
  )
  if (
    stopped.code !== 0 &&
    !/not in a running|found running|Invalid device/i.test(
      stopped.stderr + stopped.stdout,
    )
  ) {
    throw new Error(
      `simctl terminate ${appId} failed: ${stopped.stderr || stopped.stdout}`,
    )
  }
}

export const grantNotificationPermission = async (
  platform: 'ios' | 'android',
  appId = ANDROID_APP_ID,
): Promise<void> => {
  if (platform === 'ios') {
    const udid = await iosSimulatorUdid()
    await command(
      'xcrun',
      ['simctl', 'privacy', udid, 'grant', 'notifications', appId],
      { timeout: 15_000 },
    )
    return
  }
  const env = androidEnv()
  const androidHome = env.ANDROID_HOME as string
  const adb = join(androidHome, 'platform-tools/adb')
  for (const permission of [
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
  ]) {
    await command(adb, ['shell', 'pm', 'grant', appId, permission], {
      env,
      timeout: 15_000,
    })
  }
}

export const forceQuitApp = async (
  platform: 'ios' | 'android',
  appId = ANDROID_APP_ID,
): Promise<void> => {
  if (platform === 'android') {
    await forceStopAndroidApp(appId)
    return
  }
  await terminateIosApp(appId)
}

export const forceStopAndroidApp = async (
  appId = ANDROID_APP_ID,
): Promise<void> => {
  const env = androidEnv()
  const androidHome = env.ANDROID_HOME as string
  const adb = join(androidHome, 'platform-tools/adb')
  const stopped = await command(adb, ['shell', 'am', 'force-stop', appId], {
    env,
    timeout: 15_000,
  })
  if (stopped.code !== 0) {
    throw new Error(
      `adb force-stop ${appId} failed: ${stopped.stderr || stopped.stdout}`,
    )
  }
}

export const expandAndroidNotifications = async (): Promise<void> => {
  const env = androidEnv()
  const androidHome = env.ANDROID_HOME as string
  const adb = join(androidHome, 'platform-tools/adb')
  await command(adb, ['shell', 'cmd', 'statusbar', 'expand-notifications'], {
    env,
    timeout: 15_000,
  })
}

export const reverseAndroidPorts = async (ports: number[]): Promise<void> => {
  const env = androidEnv()
  const androidHome = env.ANDROID_HOME as string
  const adb = join(androidHome, 'platform-tools/adb')
  for (const port of ports) {
    const reversed = await command(
      adb,
      ['reverse', `tcp:${port}`, `tcp:${port}`],
      { env, timeout: 15_000 },
    )
    if (reversed.code !== 0) {
      throw new Error(
        `adb reverse tcp:${port} failed: ${reversed.stderr || reversed.stdout}`,
      )
    }
  }
}

export const iosSimulatorUdid = async (): Promise<string> => {
  const listed = await command(
    'xcrun',
    ['simctl', 'list', 'devices', 'available', '-j'],
    { timeout: 30_000 },
  )
  if (listed.code !== 0) {
    throw new Error(`xcrun simctl failed: ${listed.stderr}`)
  }
  const parsed = JSON.parse(listed.stdout) as {
    devices: Record<string, Array<{ name: string; udid: string; state: string; isAvailable: boolean }>>
  }
  const all = Object.values(parsed.devices).flat().filter((device) => device.isAvailable)
  const preferred =
    all.find((device) => device.name === 'iPhone 17 Pro') ??
    all.find((device) => device.name.startsWith('iPhone')) ??
    all[0]
  if (!preferred) throw new Error('No available iOS simulator')
  if (preferred.state !== 'Booted') {
    const boot = await command('xcrun', ['simctl', 'boot', preferred.udid], {
      timeout: 60_000,
    })
    if (boot.code !== 0 && !boot.stderr.includes('current state: Booted')) {
      throw new Error(`Could not boot ${preferred.name}: ${boot.stderr}`)
    }
  }
  await command('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', preferred.udid], {
    timeout: 30_000,
  })
  return preferred.udid
}
