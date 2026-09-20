import { randomBytes } from 'node:crypto'
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
} from './dev-client.ts'
import {
  MOTEL_ORIGIN,
  MOTEL_SERVICE,
  PINNED_MOTEL,
  WRONG_OTLP_ORIGIN,
  assertPhysicalDeviceDoc,
  ensureMotelDaemon,
  searchSpansByToken,
  waitForSpan,
} from './motel.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p03')
const SLOT = '__viviefsP03'
const CHECK_COUNT = 2

const tokenFor = (variant: string) =>
  `p03-${variant}-${Date.now()}-${randomBytes(4).toString('hex')}`

const envFor = (
  variant: 'motel' | 'wrong-endpoint',
  token: string,
  extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv => ({
  ...extra,
  EXPO_PUBLIC_GATE: 'P03',
  EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  EXPO_PUBLIC_OTLP_VARIANT: variant,
  EXPO_PUBLIC_P03_TOKEN: token,
  EXPO_PUBLIC_OTLP_URL:
    variant === 'motel' ? MOTEL_ORIGIN : WRONG_OTLP_ORIGIN,
})

const runNative = (
  platform: 'ios' | 'android',
  variant: 'motel' | 'wrong-endpoint',
  token: string,
  extra: NodeJS.ProcessEnv = {},
) =>
  runDeviceVariant({
    cwd: APP,
    artifacts: ARTIFACTS,
    qualificationCwd: QUAL,
    platform,
    env: envFor(variant, token, extra),
    slot: SLOT,
    gate: 'P03',
    variant,
    treeTokens: ['p03-status', 'p03-check-emit-span'],
  })

const assertMotelPin = async () => {
  const vendor = await readFile(join(ROOT, 'vendor/motel/package.json'), 'utf8')
  if (!vendor.includes(`"@kitlangton/motel": "${PINNED_MOTEL}"`)) {
    fail(`vendor/motel must pin @kitlangton/motel ${PINNED_MOTEL}`)
  }
  if (!vendor.includes('"effect": "4.0.0-beta.90"')) {
    fail(
      'vendor/motel must override effect to 4.0.0-beta.90 so motel does not resolve the workspace RC.',
    )
  }
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  await assertMotelPin()
  await assertPhysicalDeviceDoc()
  await recordAgentStatus(APP, ARTIFACTS, 'P03')
  await ensureMotelDaemon(ARTIFACTS)

  const wrongToken = tokenFor('wrong-endpoint')
  console.log('P03 iOS wrong-endpoint (positive control)...')
  const iosWrong = await runNative('ios', 'wrong-endpoint', wrongToken)
  assertAllPass(iosWrong, CHECK_COUNT, 'ios wrong-endpoint')
  const wrongHits = await searchSpansByToken(wrongToken)
  await writeJson(ARTIFACTS, 'motel-wrong-endpoint.json', {
    token: wrongToken,
    hits: wrongHits,
  })
  if ((wrongHits.data?.length ?? 0) > 0) {
    fail(
      `P03 positive control failed: wrong-endpoint token ${wrongToken} appeared in motel.`,
    )
  }
  console.log('P03 wrong-endpoint produced no motel entry.')

  const iosToken = tokenFor('motel')
  console.log('P03 iOS motel...')
  const iosMotel = await runNative('ios', 'motel', iosToken)
  assertAllPass(iosMotel, CHECK_COUNT, 'ios motel')
  const iosHits = await waitForSpan(iosToken, 30_000)
  await writeJson(ARTIFACTS, 'motel-ios.json', { token: iosToken, hits: iosHits })
  if ((iosHits.data?.length ?? 0) === 0) {
    fail(
      `P03 iOS: motel did not receive span p03.known-span with probe.token=${iosToken}`,
    )
  }
  console.log(
    `P03 iOS span arrived in motel (${iosHits.data?.length} hit(s)).`,
  )

  console.log('P03 booting Android emulator...')
  await ensureAndroidEmulator()
  await reverseAndroidPorts([8081, 27686])
  const androidToken = tokenFor('motel')
  const androidBase = androidEnv()
  console.log('P03 Android motel...')
  const androidMotel = await runNative(
    'android',
    'motel',
    androidToken,
    androidBase,
  )
  assertAllPass(androidMotel, CHECK_COUNT, 'android motel')
  const androidHits = await waitForSpan(androidToken, 30_000)
  await writeJson(ARTIFACTS, 'motel-android.json', {
    token: androidToken,
    hits: androidHits,
  })
  if ((androidHits.data?.length ?? 0) === 0) {
    fail(
      `P03 Android: motel did not receive span p03.known-span with probe.token=${androidToken}`,
    )
  }
  console.log(
    `P03 Android span arrived in motel (${androidHits.data?.length} hit(s)).`,
  )

  await writeJson(ARTIFACTS, 'reports.json', {
    host: 'dev-client',
    motel: {
      version: PINNED_MOTEL,
      license: 'MIT',
      origin: MOTEL_ORIGIN,
      service: MOTEL_SERVICE,
    },
    reports: [iosWrong, iosMotel, androidMotel],
  })
  console.log(
    'P03 passed: Effect OTLP/JSON on Hermes reached motel from iOS and Android; wrong endpoint did not crash and wrote nothing.',
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
