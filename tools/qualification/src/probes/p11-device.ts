/**
 * P11 device checks (design review section 1: 2, the device leg of 3, 10,
 * 11, plus token storage (Q9) and removing an account (Q11)). One scenario
 * runs on every platform through a driver: Playwright on web, agent-device
 * and Hermes on the iOS simulator and the Android emulator. A driver only
 * taps controls by `testID`, types into the identity provider's login page,
 * relaunches the app, and reads the report the app publishes; the scenario
 * decides what passed.
 */
import { randomBytes } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from 'playwright'
import { agentCliJson, agentDevice } from './agent-cli.ts'
import {
  APP_ID,
  relaunchOnDevice,
  sleep,
  startDeviceSession,
  stopDev,
  waitForMetro,
  writeJson,
  type CheckResult,
} from './dev-client.ts'
import {
  ensureAndroidEmulator,
  forceQuitApp,
  prepareAndroidChrome,
  rebootIosSimulator,
} from './devices.ts'
import {
  LAB_USERS,
  MOBILE_ACCESS_TOKEN_SECONDS,
  type KeycloakLab,
  type LabUser,
} from './keycloak.ts'
import { startP11Lab, WEB_ORIGIN, type P11Lab } from './p11-lab.ts'
import { launchChrome, startExpoWeb } from './web-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const APP = join(ROOT, 'apps/evidence-mobile')
const QUAL = join(ROOT, 'tools/qualification')

export const P11_SLOT = '__viviefsP11'

export const P11_DEVICE_CHECK_NAMES = [
  'PKCE sign-in',
  'cross-organization denied on the device',
  'token storage',
  'sign-in needed keeps the outbox',
  'local replica per provider account',
  'removing the account deletes its replica',
] as const

export type P11DeviceCheckName = (typeof P11_DEVICE_CHECK_NAMES)[number]

/**
 * The positive controls the evidence app can be built with
 * (`apps/evidence-mobile/src/p11-control.ts`), each with the one device
 * check it must fail. The checks before it must still pass, so the control
 * shows that check failing for its own reason.
 */
export const P11_DEVICE_CONTROLS = {
  'ignore-invalid-grant': 'sign-in needed keeps the outbox',
  'shared-replica': 'local replica per provider account',
  'persistent-web-vault': 'token storage',
} as const satisfies Record<string, P11DeviceCheckName>

export type P11DeviceControl = keyof typeof P11_DEVICE_CONTROLS

/** Controls that only exist on some platforms. */
const CONTROL_PLATFORMS: Partial<Record<P11DeviceControl, ReadonlyArray<P11Platform>>> = {
  'persistent-web-vault': ['web'],
}

/**
 * A control run is as expected when its first failing check is the one the
 * control targets and every check before it passed.
 */
export const judgeControl = (
  control: P11DeviceControl,
  checks: ReadonlyArray<CheckResult>,
): CheckResult => {
  const target = P11_DEVICE_CONTROLS[control]
  const firstFailure = checks.findIndex((check) => check.status !== 'PASS')
  const failed = checks[firstFailure]
  const ok =
    failed !== undefined &&
    failed.name === target &&
    checks.slice(0, firstFailure).every((check) => check.status === 'PASS')
  return {
    name: `control ${control}`,
    status: ok ? 'PASS' : 'FAIL',
    detail: ok
      ? `fails ${target}: ${failed.detail}`
      : `expected ${target} to fail first; got ${failed === undefined ? 'no failure' : `${failed.name}: ${failed.detail}`}`,
  }
}

type Counts = { pending: number; acked: number; rejected: number; waiting: number }

/** The report `apps/evidence-mobile/src/p11-runtime.ts` publishes. */
export type P11DeviceReport = {
  gate: 'P11'
  platform: 'ios' | 'android' | 'web'
  variant: string
  ready: boolean
  error: string | null
  extra: {
    run: string
    control: string | null
    state: 'starting' | 'SignedOut' | 'SignedIn' | 'SignInNeeded'
    subject: string | null
    person: string | null
    organizations: string[]
    reason: string | null
    replica: string | null
    outbox: { acme: Counts; other: Counts }
    rows: { acme: number; other: number }
    busy: string | null
    actions: number
    last: { action: string; outcome: string } | null
  }
}

export type P11Driver = {
  readonly platform: 'ios' | 'android' | 'web'
  readonly report: () => Promise<P11DeviceReport | undefined>
  readonly tap: (testId: string) => Promise<void>
  /** Taps sign in and completes the identity provider's login page. */
  readonly signIn: (user: LabUser, password: string) => Promise<void>
  /** Ends the app's process and starts it again. */
  readonly relaunch: () => Promise<void>
}

class StepFailed extends Error {}

const require = (condition: boolean, detail: string) => {
  if (!condition) throw new StepFailed(detail)
}

const summary = (report: P11DeviceReport) =>
  JSON.stringify({
    state: report.extra.state,
    person: report.extra.person,
    organizations: report.extra.organizations,
    outbox: report.extra.outbox,
    rows: report.extra.rows,
    last: report.extra.last,
  })

const waitReport = async (
  driver: P11Driver,
  until: (report: P11DeviceReport) => boolean,
  what: string,
  timeoutMs = 120_000,
): Promise<P11DeviceReport> => {
  const deadline = Date.now() + timeoutMs
  let latest: P11DeviceReport | undefined
  while (Date.now() < deadline) {
    latest = await driver.report()
    if (latest?.ready && until(latest)) return latest
    await sleep(latest?.platform === 'web' ? 250 : 1000)
  }
  throw new StepFailed(`${what}: timed out; last ${latest ? summary(latest) : 'no report'}`)
}

/** Runs one action and waits for the app to count it; returns its report. */
const act = async (
  driver: P11Driver,
  run: () => Promise<void>,
  label: string,
): Promise<P11DeviceReport> => {
  const before = await waitReport(driver, (r) => r.extra.busy === null, `idle before ${label}`)
  await run()
  return waitReport(
    driver,
    (r) => r.extra.actions > before.extra.actions && r.extra.busy === null,
    label,
    180_000,
  )
}

const outcome = (report: P11DeviceReport) => report.extra.last?.outcome ?? ''

export const runP11DeviceScenario = async (
  driver: P11Driver,
  lab: KeycloakLab,
  log: (line: string) => void = () => undefined,
  control: P11DeviceControl | null = null,
): Promise<CheckResult[]> => {
  const alice = () => driver.signIn('alice', lab.password('alice'))
  const tap = (id: string) => () => driver.tap(id)
  const checks: CheckResult[] = []
  let broken: string | null = null
  const check = async (
    name: (typeof P11_DEVICE_CHECK_NAMES)[number],
    body: () => Promise<string>,
  ) => {
    if (broken !== null) {
      checks.push({ name, status: 'FAIL', detail: `not reached: ${broken} failed` })
      return
    }
    try {
      const detail = await body()
      checks.push({ name, status: 'PASS', detail })
      log(`PASS ${name}: ${detail}`)
    } catch (error) {
      broken = name
      const detail = error instanceof Error ? error.message : String(error)
      checks.push({ name, status: 'FAIL', detail })
      log(`FAIL ${name}: ${detail}`)
    }
  }

  let aliceReplica = ''
  let alicePerson = ''

  await check('PKCE sign-in', async () => {
    const start = await waitReport(driver, () => true, 'app start')
    require(
      start.extra.control === control,
      `the app carries control ${start.extra.control ?? 'none'}, expected ${control ?? 'none'}`,
    )
    require(start.extra.state === 'SignedOut', `a fresh run starts signed out: ${summary(start)}`)
    const signedIn = await act(driver, alice, 'sign in alice')
    require(
      signedIn.extra.state === 'SignedIn' &&
        signedIn.extra.subject === LAB_USERS.alice.id &&
        signedIn.extra.person !== null &&
        JSON.stringify(signedIn.extra.organizations) === '["acme"]' &&
        signedIn.extra.replica !== null,
      `signed in as alice with acme: ${summary(signedIn)}`,
    )
    aliceReplica = signedIn.extra.replica ?? ''
    alicePerson = signedIn.extra.person ?? ''
    await act(driver, tap('p11-write-acme'), 'write acme')
    const synced = await act(driver, tap('p11-sync-acme'), 'sync acme')
    require(
      outcome(synced) === 'acked 1' &&
        synced.extra.outbox.acme.acked === 1 &&
        synced.extra.rows.acme > 0,
      `the token authenticates a push: ${summary(synced)}`,
    )
    return `alice is person ${alicePerson}; push acked; ${synced.extra.rows.acme} acme rows pulled back`
  })

  await check('cross-organization denied on the device', async () => {
    await act(driver, tap('p11-write-other'), 'write other')
    const pushed = await act(driver, tap('p11-sync-other'), 'sync other')
    require(
      outcome(pushed) === 'acked 0 rejected MembershipMissing' &&
        pushed.extra.outbox.other.rejected === 1,
      `the same token asking for other is refused: ${summary(pushed)}`,
    )
    const again = await act(driver, tap('p11-write-other'), 'write other again')
    require(
      outcome(again) === 'MembershipMissing' && again.extra.outbox.acme.acked === 1,
      `other is read-only afterwards, acme unaffected: ${summary(again)}`,
    )
    return 'acme acked, other refused with MembershipMissing and read-only after'
  })

  await check('token storage', async () => {
    await driver.relaunch()
    const restarted = await waitReport(driver, () => true, 'app restart')
    if (driver.platform === 'web') {
      // Web keeps tokens in memory only (Q9): a reload ends the session.
      require(restarted.extra.state === 'SignedOut', `web forgets tokens: ${summary(restarted)}`)
      const back = await act(driver, alice, 'sign in alice after reload')
      require(back.extra.replica === aliceReplica, `same replica: ${summary(back)}`)
      return 'reload signs out (tokens in memory only); signing in finds the same replica'
    }
    require(
      restarted.extra.state === 'SignedIn' && restarted.extra.replica === aliceReplica,
      `secure storage restores the session and replica: ${summary(restarted)}`,
    )
    await act(driver, tap('p11-write-acme'), 'write acme after restart')
    const synced = await act(driver, tap('p11-sync-acme'), 'sync acme after restart')
    require(outcome(synced) === 'acked 1', `the stored refresh token works: ${summary(synced)}`)
    return 'restart keeps the session (offline refresh token in secure storage); the next push refreshed and was acked'
  })

  await check('sign-in needed keeps the outbox', async () => {
    const written = await act(driver, tap('p11-write-acme'), 'write acme before revocation')
    require(written.extra.outbox.acme.pending === 1, `one pending: ${summary(written)}`)
    await lab.revokeSessions('alice')
    // Any access token the device holds is due for refresh by then.
    await sleep((MOBILE_ACCESS_TOKEN_SECONDS - 10 + 3) * 1000)
    const refused = await act(driver, tap('p11-sync-acme'), 'sync acme after revocation')
    require(
      refused.extra.state === 'SignInNeeded' &&
        outcome(refused).startsWith('SignInNeeded') &&
        refused.extra.outbox.acme.pending === 1 &&
        refused.extra.replica === aliceReplica,
      `sign-in needed, outbox kept: ${summary(refused)}`,
    )
    const signedIn = await act(driver, alice, 'sign in alice again')
    require(signedIn.extra.state === 'SignedIn', `signed in again: ${summary(signedIn)}`)
    const resumed = await act(driver, tap('p11-sync-acme'), 'sync acme after sign-in')
    require(
      outcome(resumed) === 'acked 1' && resumed.extra.outbox.acme.pending === 0,
      `sync resumes: ${summary(resumed)}`,
    )
    return `refresh refused (${refused.extra.reason}); the pending write waited and was acked after signing in again`
  })

  await check('local replica per provider account', async () => {
    const pending = await act(driver, tap('p11-write-acme'), 'alice writes, unsynced')
    const aliceRows = pending.extra.rows.acme
    require(pending.extra.outbox.acme.pending === 1, `alice has one pending: ${summary(pending)}`)
    const out = await act(driver, tap('p11-signOut'), 'alice signs out')
    require(out.extra.state === 'SignedOut' && out.extra.replica === null, `closed: ${summary(out)}`)
    const bob = await act(
      driver,
      () => driver.signIn('bob', lab.password('bob')),
      'sign in bob',
    )
    const bobOutbox = bob.extra.outbox.acme
    require(
      bob.extra.state === 'SignedIn' &&
        bob.extra.subject === LAB_USERS.bob.id &&
        bob.extra.person === null &&
        bob.extra.organizations.length === 0 &&
        bob.extra.replica !== null &&
        bob.extra.replica !== aliceReplica &&
        bob.extra.rows.acme === 0 &&
        bobOutbox.pending + bobOutbox.acked + bobOutbox.rejected === 0,
      `bob sees none of alice's data or outbox: ${summary(bob)}`,
    )
    const bobWrite = await act(driver, tap('p11-write-acme'), 'bob writes')
    require(outcome(bobWrite) === 'no person', `bob, a member of nothing, cannot label a write: ${summary(bobWrite)}`)
    await act(driver, tap('p11-signOut'), 'bob signs out')
    const back = await act(driver, alice, 'alice signs back in')
    require(
      back.extra.replica === aliceReplica &&
        back.extra.outbox.acme.pending === 1 &&
        back.extra.rows.acme === aliceRows,
      `alice finds her data and outbox intact: ${summary(back)}`,
    )
    const synced = await act(driver, tap('p11-sync-acme'), 'alice syncs')
    require(outcome(synced) === 'acked 1', `and syncs it: ${summary(synced)}`)
    return `bob's replica was empty; alice's ${aliceRows} rows and pending write survived and synced`
  })

  await check('removing the account deletes its replica', async () => {
    const removed = await act(driver, tap('p11-removeAccount'), 'remove alice')
    require(
      removed.extra.state === 'SignedOut' && outcome(removed) === 'removed',
      `removed and signed out: ${summary(removed)}`,
    )
    const fresh = await act(driver, alice, 'alice signs in after removal')
    require(
      fresh.extra.replica === aliceReplica &&
        fresh.extra.rows.acme === 0 &&
        fresh.extra.outbox.acme.acked === 0,
      `a new, empty replica: ${summary(fresh)}`,
    )
    const pulled = await act(driver, tap('p11-sync-acme'), 'pull after removal')
    require(pulled.extra.rows.acme > 0, `the server's copy comes back: ${summary(pulled)}`)
    return `replica deleted; signing in again starts empty and pulls ${pulled.extra.rows.acme} acme rows from the server`
  })

  return checks
}

/** Web: the app in a Chromium page; the login page opens as a popup. */
export const webDriver = (page: Page, origin: string): P11Driver => ({
  platform: 'web',
  report: () =>
    page.evaluate(
      (slot) => (globalThis as Record<string, unknown>)[slot] as P11DeviceReport | undefined,
      P11_SLOT,
    ),
  tap: (testId) => page.getByTestId(testId).click(),
  signIn: async (user, password) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByTestId('p11-signIn').click(),
    ])
    await popup.waitForSelector('#password', { timeout: 60_000 })
    // With `prompt=login` Keycloak asks again even when the browser still has
    // a provider session; it then names that session's user and asks only
    // for the password. That must be the person signing in now.
    if ((await popup.$('#username')) === null) {
      const remembered = await popup.inputValue('#kc-attempted-username')
      if (remembered !== user) {
        throw new StepFailed(`the login page still remembers ${remembered} while ${user} signs in`)
      }
    } else {
      await popup.fill('#username', user)
    }
    await popup.fill('#password', password)
    await popup.click('#kc-login')
  },
  relaunch: async () => {
    await page.goto(origin, { waitUntil: 'load' })
  },
})

// Keycloak's login form as each platform's accessibility tree names it: iOS
// by the visible labels, Android (a Chrome Custom Tab) by the HTML ids.
const LOGIN_FORM = {
  ios: {
    username: 'role=textfield label="Username or email"',
    usernameShown: '"Username or email"',
    password: 'role=securetextfield label="Password"',
    passwordShown: '"Password"',
    submit: 'role=button label="Sign In"',
  },
  android: {
    username: 'id="username"',
    usernameShown: '"username"',
    password: 'id="password"',
    passwordShown: '"password"',
    submit: 'id="kc-login"',
  },
} as const

// Chrome's first-run screens on a fresh emulator, before the login page.
const BROWSER_FIRST_RUN = ['Use without an account', 'No thanks', 'Got it']

/**
 * iOS and Android: controls through the accessibility tree (agent-device),
 * the report through Hermes (`runtime:eval`). The login page is Keycloak in
 * the system's authentication browser, driven the same way.
 */
export const nativeDriver = (options: {
  readonly platform: 'ios' | 'android'
  readonly appCwd: string
  readonly qualificationCwd: string
  readonly relaunchApp: () => Promise<void>
}): P11Driver => {
  const device = async (args: string[], timeout = 60_000) => {
    const result = await agentDevice([...args, '--platform', options.platform, '--json'], {
      cwd: options.qualificationCwd,
      timeout,
    })
    if (result.code !== 0) {
      throw new StepFailed(`agent-device ${args.join(' ')}: ${(result.stdout || result.stderr).slice(-600)}`)
    }
    return result.stdout
  }
  // Keycloak's login form as the platform's accessibility tree names it.
  const form = LOGIN_FORM[options.platform]
  const snapshot = async () => {
    const taken = await agentDevice(['snapshot', '-i', '--platform', options.platform], {
      cwd: options.qualificationCwd,
      timeout: 60_000,
    })
    return taken.code === 0 ? taken.stdout : ''
  }
  // While the sign-in sheet loads its tree can be unreadable ("requires a
  // valid viewport"), and agent-device then defers its slower reader for a
  // while; waiting with calm snapshots works where retrying at once does not.
  const waitForLoginPage = async () => {
    const deadline = Date.now() + 90_000
    for (;;) {
      const tree = await snapshot()
      if (tree.includes(form.passwordShown)) {
        if (!tree.includes(form.usernameShown)) {
          throw new StepFailed('the login page asks only for a remembered user\'s password')
        }
        return
      }
      const firstRun = BROWSER_FIRST_RUN.find((label) => tree.includes(`"${label}"`))
      if (firstRun !== undefined) await device(['press', `label="${firstRun}"`])
      else if (Date.now() > deadline) {
        throw new StepFailed(`the login page did not show: ${tree.slice(-400)}`)
      } else await sleep(5000)
    }
  }
  return {
    platform: options.platform,
    report: async () => {
      const evaluated = await agentCliJson(
        ['runtime:eval', `globalThis.${P11_SLOT}`, '--json', `--${options.platform}`, '--timeout', '20s'],
        { cwd: options.appCwd, timeout: 40_000 },
      )
      if (evaluated.code !== 0) return undefined
      const payload = evaluated.data as { threw?: boolean; value?: P11DeviceReport | null }
      return payload.threw ? undefined : (payload.value ?? undefined)
    },
    // Right after the sign-in sheet closes, iOS can fail to match the app's
    // accessibility tree for a few seconds ("Could not match active AX
    // application"), and a press then finds nothing. Only that miss is retried,
    // calmly; a control that is really absent still fails.
    tap: async (testId) => {
      const deadline = Date.now() + 60_000
      for (;;) {
        try {
          await device(['press', `id="${testId}"`])
          return
        } catch (error) {
          const missed = error instanceof StepFailed && error.message.includes('selector_not_found')
          if (!missed || Date.now() > deadline) throw error
          await sleep(5000)
        }
      }
    },
    signIn: async (user, password) => {
      await device(['press', 'id="p11-signIn"'])
      await waitForLoginPage()
      await device(['fill', form.username, user])
      await device(['fill', form.password, password])
      // The keyboard (or its toolbar) can cover the submit button.
      await device(['keyboard', 'dismiss']).catch(() => undefined)
      await device(['press', form.submit])
    },
    relaunch: async () => {
      await forceQuitApp(options.platform, APP_ID)
      await options.relaunchApp()
    },
  }
}

export type P11Platform = 'ios' | 'android' | 'web'

/**
 * A new development build greets its first launch with a sheet
 * ("Continue") that opens the developer menu; both cover the app.
 */
const dismissDevClientOverlays = async (platform: 'ios' | 'android') => {
  const tree = async () =>
    (await agentDevice(['snapshot', '-i', '--platform', platform], { cwd: QUAL, timeout: 60_000 })).stdout
  const press = (label: string) =>
    agentDevice(['press', `label="${label}"`, '--platform', platform], { cwd: QUAL, timeout: 60_000 })
  if ((await tree()).includes('"Continue"')) await press('Continue')
  if ((await tree()).includes('Toggle performance monitor')) await press('Close')
}

/** The app's build-time settings for one P11 run on one platform. */
const appEnv = (
  platform: P11Platform,
  run: string,
  control: P11DeviceControl | null,
): NodeJS.ProcessEnv => ({
  EXPO_PUBLIC_GATE: 'P11',
  EXPO_PUBLIC_CRYPTO_POLYFILL: '1',
  // A fresh namespace per run: its own secure-storage key and replica files.
  EXPO_PUBLIC_P11_RUN: `${platform}${run}`,
  EXPO_PUBLIC_P11_VARIANT: control ?? 'sign-in',
  EXPO_PUBLIC_P11_CONTROL: control ?? '',
})

/**
 * Starts the app on `platform` against a running lab, runs the scenario,
 * and stops the app. The lab outlives it, so one lab serves all platforms.
 */
export const runP11OnPlatform = async (options: {
  readonly platform: P11Platform
  readonly lab: P11Lab
  readonly artifacts: string
  readonly log?: (line: string) => void
  /** Build the app with this positive control; the scenario then must fail. */
  readonly control?: P11DeviceControl
}): Promise<CheckResult[]> => {
  const { platform, lab, artifacts } = options
  const control = options.control ?? null
  const only = control === null ? undefined : CONTROL_PLATFORMS[control]
  if (only !== undefined && !only.includes(platform)) {
    throw new Error(`control ${control} exists only on ${only.join(', ')}`)
  }
  const label = control === null ? platform : `${platform} ${control}`
  const log = options.log ?? ((line: string) => console.log(`P11 ${label} ${line}`))
  const run = randomBytes(3).toString('hex')
  const env = appEnv(platform, run, control)
  await mkdir(artifacts, { recursive: true })

  if (platform === 'web') {
    await stopDev(APP)
    startExpoWeb(APP, env, join(artifacts, 'web-metro.log'))
    const browser = await launchChrome()
    try {
      await waitForMetro(180_000, 'P11 web')
      const page = await browser.newPage()
      const consoleLog = createWriteStream(join(artifacts, 'web-console.log'))
      page.on('console', (message) => consoleLog.write(`${message.type()}: ${message.text()}\n`))
      page.on('pageerror', (error) => consoleLog.write(`pageerror: ${String(error)}\n`))
      page.on('popup', (popup) => {
        popup.on('console', (message) => consoleLog.write(`popup ${message.type()}: ${message.text()}\n`))
        popup.on('pageerror', (error) => consoleLog.write(`popup pageerror: ${String(error)}\n`))
      })
      // The app's origin is its sign-in redirect; Keycloak allows `localhost`.
      await page.goto(WEB_ORIGIN, { waitUntil: 'load', timeout: 120_000 })
      const checks = await runP11DeviceScenario(webDriver(page, WEB_ORIGIN), lab.keycloak, log, control)
      await page.screenshot({ path: join(artifacts, `${label.replace(' ', '-')}-final.png`) })
      return checks
    } finally {
      await browser.close()
      await stopDev(APP)
    }
  }

  if (platform === 'ios') await rebootIosSimulator()
  else {
    await ensureAndroidEmulator()
    await prepareAndroidChrome()
    // A running agent-device daemon keeps the PATH it started with; the next
    // one starts from this process, which now has the Android SDK on it.
    await agentDevice(['daemon', 'stop'], { cwd: QUAL, timeout: 30_000 })
  }
  try {
    await startDeviceSession({ cwd: APP, artifacts, platform, env, gate: 'P11', variant: control ?? 'sign-in' })
    if (platform === 'android') await lab.reverseAndroid()
    // agent-device acts within a session on the app.
    const openSession = async () => {
      const opened = await agentDevice(['open', APP_ID, '--platform', platform, '--json'], {
        cwd: QUAL,
        timeout: 120_000,
      })
      if (opened.code !== 0) {
        throw new StepFailed(`agent-device open ${platform}: ${(opened.stdout || opened.stderr).slice(-600)}`)
      }
    }
    await openSession()
    await dismissDevClientOverlays(platform)
    const driver = nativeDriver({
      platform,
      appCwd: APP,
      qualificationCwd: QUAL,
      relaunchApp: async () => {
        await relaunchOnDevice({ cwd: APP, artifacts, platform, variant: control ?? 'sign-in', env, gate: 'P11' })
        if (platform === 'android') await lab.reverseAndroid()
        await openSession()
        await dismissDevClientOverlays(platform)
      },
    })
    const checks = await runP11DeviceScenario(driver, lab.keycloak, log, control)
    await agentDevice(['screenshot', join(artifacts, `${label.replace(' ', '-')}-final.png`), '--platform', platform], {
      cwd: QUAL,
    })
    return checks
  } finally {
    await agentDevice(['close'], { cwd: QUAL, timeout: 15_000 })
    await stopDev(APP)
  }
}

// Run alone for one platform (no ledger entry):
// `mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-device.ts web`
// With `--control <name>` it builds the app with that positive control and
// reports whether the control failed exactly its check.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const at = args.indexOf('--control')
  const control = at >= 0 ? (args[at + 1] as P11DeviceControl) : undefined
  if (control !== undefined && !(control in P11_DEVICE_CONTROLS)) {
    throw new Error(`unknown control ${control}; one of ${Object.keys(P11_DEVICE_CONTROLS).join(', ')}`)
  }
  const platforms = args.filter((_, index) => at < 0 || (index !== at && index !== at + 1)) as P11Platform[]
  const artifacts = join(ROOT, '.artifacts/qualification/p11-device')
  const lab = await startP11Lab(artifacts)
  try {
    for (const platform of platforms.length > 0 ? platforms : (['web'] as const)) {
      const name = control === undefined ? platform : `${platform}-${control}`
      const checks = await runP11OnPlatform({
        platform,
        lab,
        artifacts: join(artifacts, platform),
        ...(control === undefined ? {} : { control }),
      })
      await writeJson(artifacts, `checks-${name}.json`, checks)
      if (control === undefined) {
        if (checks.some((check) => check.status !== 'PASS')) process.exitCode = 1
        continue
      }
      const judged = judgeControl(control, checks)
      console.log(`${judged.status} ${judged.name}: ${judged.detail}`)
      if (judged.status !== 'PASS') process.exitCode = 1
    }
  } finally {
    await lab.stop()
  }
}
