import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { command } from '../process.ts'
import { agentCli, agentCliJson, agentDevice } from './agent-cli.ts'

export type CheckResult = {
  name: string
  status: 'PASS' | 'FAIL'
  detail: string
}

export type ProbeReport = {
  gate: string
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: string
  ready: boolean
  error: string | null
  report: string
  checks: CheckResult[]
  globals?: Record<string, string>
  extra?: Record<string, unknown>
}

type EvalJson = {
  threw?: boolean
  value?: ProbeReport | null
  exception?: unknown
}

export const APP_ID = 'dev.viviefs.evidence'

export const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export const writeJson = async (directory: string, name: string, value: unknown) => {
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, name), JSON.stringify(value, null, 2) + '\n')
}

export const freeListenPort = async (port: number) => {
  for (let attempt = 0; attempt < 15; attempt++) {
    const listed = await command(
      'lsof',
      ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'],
      { timeout: 5_000 },
    )
    const pids = listed.stdout
      .split(/\s+/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (pids.length === 0) return
    for (const pid of pids) {
      await command('kill', ['-9', pid], { timeout: 5_000 })
    }
    await sleep(400)
  }
}

const METRO_HOSTS = ['127.0.0.1', '[::1]', 'localhost'] as const

export const metroOrigin = async (port = 8081): Promise<string | undefined> => {
  for (const host of METRO_HOSTS) {
    try {
      const response = await fetch(`http://${host}:${port}/status`, {
        signal: AbortSignal.timeout(3000),
      })
      if (response.ok) return `http://${host}:${port}`
    } catch {
      // Expo --localhost may bind IPv6 only; try the next host.
    }
  }
  return undefined
}

export const metroStatusOk = async (port = 8081): Promise<boolean> =>
  Boolean(await metroOrigin(port))

export const waitForMetro = async (
  ms: number,
  label: string,
  port = 8081,
): Promise<string> => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    const origin = await metroOrigin(port)
    if (origin) return origin
    await sleep(5000)
  }
  throw new Error(
    `${label} Metro did not become ready within ${Math.round(ms / 1000)}s`,
  )
}

export const stopDev = async (cwd: string) => {
  await agentCli(['dev:stop', '--json'], { cwd, timeout: 30_000 })
  await freeListenPort(8081)
}

export const planNeedsNativeBuild = (plan: unknown): boolean => {
  const steps = (plan as { steps?: Array<{ id?: string }> }).steps ?? []
  return steps.some((step) => step.id === 'run' || step.id === 'prebuild')
}

export const openOnDevice = async (
  cwd: string,
  artifacts: string,
  platform: 'ios' | 'android',
  variant: string,
  env?: NodeJS.ProcessEnv,
) => {
  const opened = await agentCliJson(
    ['navigate', '/', `--${platform}`, '--json'],
    { cwd, env, timeout: 60_000 },
  )
  await writeJson(artifacts, `navigate-${platform}-${variant}.json`, opened.data)
  if (opened.code !== 0) {
    fail(
      `agent-cli navigate / --${platform} failed:\n${opened.stderr || opened.stdout}`,
    )
  }
}

const isProbeReport = (
  value: unknown,
  gate: string,
): value is ProbeReport => {
  if (!value || typeof value !== 'object') return false
  const report = value as ProbeReport
  return (
    report.gate === gate &&
    typeof report.variant === 'string' &&
    typeof report.ready === 'boolean' &&
    Array.isArray(report.checks)
  )
}

export const readHermesReport = async (
  cwd: string,
  artifacts: string,
  platform: 'ios' | 'android',
  slot: string,
  gate: string,
  env?: NodeJS.ProcessEnv,
): Promise<ProbeReport | undefined> => {
  const evaluated = await agentCliJson(
    [
      'runtime:eval',
      `globalThis.${slot}`,
      '--json',
      `--${platform}`,
      '--timeout',
      '20s',
    ],
    { cwd, env, timeout: 40_000 },
  )
  await writeJson(
    artifacts,
    `eval-${platform}-${Date.now()}.json`,
    evaluated.data,
  )
  if (evaluated.code !== 0) {
    console.log(
      `${gate} runtime:eval ${platform} exited ${evaluated.code}: ${evaluated.stderr.slice(-1000)}`,
    )
    return undefined
  }
  const payload = evaluated.data as EvalJson
  if (payload.threw) return undefined
  return isProbeReport(payload.value, gate) ? payload.value : undefined
}

export const waitForHermesReport = async (options: {
  cwd: string
  artifacts: string
  platform: 'ios' | 'android'
  slot: string
  gate: string
  variant: string
  env?: NodeJS.ProcessEnv
}): Promise<ProbeReport> => {
  const deadline = Date.now() + 180_000
  let recovered = false
  while (Date.now() < deadline) {
    const report = await readHermesReport(
      options.cwd,
      options.artifacts,
      options.platform,
      options.slot,
      options.gate,
      options.env,
    )
    if (report?.ready && report.variant === options.variant) return report
    if (!recovered) {
      await openOnDevice(
        options.cwd,
        options.artifacts,
        options.platform,
        options.variant,
        options.env,
      )
      await agentCliJson(
        ['runtime:reload', `--${options.platform}`, '--json'],
        { cwd: options.cwd, env: options.env, timeout: 60_000 },
      )
      recovered = true
    }
    await sleep(3000)
  }
  const errors = await agentCliJson(
    ['runtime:errors', '--json', `--${options.platform}`, '--duration', '5s'],
    { cwd: options.cwd, env: options.env, timeout: 30_000 },
  )
  await writeJson(
    options.artifacts,
    `errors-${options.platform}-${options.variant}.json`,
    errors.data,
  )
  return fail(
    `${options.platform} ${options.variant} did not publish Hermes results within 180s. See runtime:errors artifact.`,
  )
}

export const captureTree = async (options: {
  cwd: string
  artifacts: string
  platform: 'ios' | 'android'
  variant: string
  expected: string[]
  env?: NodeJS.ProcessEnv
}) => {
  const tree = await agentCliJson(
    ['runtime:tree', '--all', '--json', `--${options.platform}`],
    { cwd: options.cwd, env: options.env, timeout: 60_000 },
  )
  await writeJson(
    options.artifacts,
    `tree-${options.platform}-${options.variant}.json`,
    tree.data,
  )
  const serialized = JSON.stringify(tree.data ?? {})
  const missing = options.expected.filter((token) => !serialized.includes(token))
  if (missing.length > 0) {
    console.log(
      `${options.platform} ${options.variant} runtime:tree missed ${missing.join(', ')} (recorded anyway).`,
    )
  }
}

export const captureDeviceSnapshot = async (options: {
  cwd: string
  artifacts: string
  platform: 'ios' | 'android'
  variant: string
  env?: NodeJS.ProcessEnv
}) => {
  const opened = await agentDevice(
    ['open', APP_ID, '--platform', options.platform, '--json'],
    { cwd: options.cwd, env: options.env, timeout: 60_000 },
  )
  await writeFile(
    join(options.artifacts, `agent-device-open-${options.platform}-${options.variant}.log`),
    opened.stdout + opened.stderr,
  )
  const snapshot = await agentDevice(['snapshot', '-i', '--json'], {
    cwd: options.cwd,
    env: options.env,
    timeout: 30_000,
  })
  await writeFile(
    join(
      options.artifacts,
      `agent-device-snapshot-${options.platform}-${options.variant}.json`,
    ),
    snapshot.stdout || snapshot.stderr,
  )
  await agentDevice(['close'], { cwd: options.cwd, env: options.env, timeout: 15_000 })
}

export const runDeviceVariant = async (options: {
  cwd: string
  artifacts: string
  qualificationCwd: string
  platform: 'ios' | 'android'
  env: NodeJS.ProcessEnv
  slot: string
  gate: string
  variant: string
  treeTokens: string[]
}): Promise<ProbeReport> => {
  const plan = await agentCliJson(
    [
      'dev',
      `--${options.platform}`,
      '--dev-client',
      '--localhost',
      '--plan',
      '--json',
    ],
    { cwd: options.cwd, env: options.env, timeout: 60_000 },
  )
  await writeJson(
    options.artifacts,
    `plan-${options.platform}-${options.variant}.json`,
    plan.data,
  )
  const planData = plan.data as { target?: string; rule?: string }
  if (planData.target === 'expo-go' || planData.rule === 'expo-go') {
    fail(
      `${options.gate} refused Expo Go for ${options.platform}: agent-cli still planned Expo Go.`,
    )
  }

  await stopDev(options.cwd)
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
      cwd: options.cwd,
      env: options.env,
      timeout: nativeBuild ? 1_200_000 : 180_000,
    },
  )
  await writeJson(
    options.artifacts,
    `dev-${options.platform}-${options.variant}.json`,
    started.data,
  )
  if (started.code !== 0 && !(await metroStatusOk())) {
    fail(
      `agent-cli dev --${options.platform} --dev-client failed:\n${started.stderr || started.stdout}`,
    )
  }
  try {
    if (nativeBuild || !(await metroStatusOk())) {
      console.log(
        `${options.gate} waiting for Metro after ${options.platform} ${options.variant}${nativeBuild ? ' native build' : ''}`,
      )
      await waitForMetro(1_200_000, `${options.platform} ${options.variant}`)
    }

    const other = options.platform === 'ios' ? 'android' : 'ios'
    await agentCli(['runtime:stop', `--${other}`, '--json'], {
      cwd: options.cwd,
      timeout: 30_000,
    })

    await openOnDevice(
      options.cwd,
      options.artifacts,
      options.platform,
      options.variant,
      options.env,
    )
    const reloaded = await agentCliJson(
      ['runtime:reload', `--${options.platform}`, '--json'],
      { cwd: options.cwd, env: options.env, timeout: 60_000 },
    )
    await writeJson(
      options.artifacts,
      `reload-${options.platform}-${options.variant}.json`,
      reloaded.data,
    )

    const report = await waitForHermesReport({
      cwd: options.cwd,
      artifacts: options.artifacts,
      platform: options.platform,
      slot: options.slot,
      gate: options.gate,
      variant: options.variant,
      env: options.env,
    })
    await captureTree({
      cwd: options.cwd,
      artifacts: options.artifacts,
      platform: options.platform,
      variant: options.variant,
      expected: options.treeTokens,
      env: options.env,
    })
    try {
      await captureDeviceSnapshot({
        cwd: options.qualificationCwd,
        artifacts: options.artifacts,
        platform: options.platform,
        variant: options.variant,
        env: options.env,
      })
    } catch (error) {
      await writeFile(
        join(
          options.artifacts,
          `agent-device-${options.platform}-${options.variant}.error`,
        ),
        String(error),
      )
      console.log(
        `${options.gate} ${options.platform} ${options.variant} agent-device snapshot skipped: ${String(error)}`,
      )
    }
    return report
  } finally {
    await stopDev(options.cwd)
    await sleep(2000)
  }
}

export const recordAgentStatus = async (
  cwd: string,
  artifacts: string,
  gate: string,
) => {
  const status = await agentCliJson(['status', '--json'], {
    cwd,
    timeout: 60_000,
  })
  await writeJson(artifacts, 'agent-cli-status.json', status.data)
  const project = (
    status.data as { project?: { usesDevClient?: boolean; sdkVersion?: string } }
  ).project
  if (!project || project.usesDevClient !== true) {
    return fail(
      `${gate} requires expo-dev-client. agent-cli status.project.usesDevClient is false; Expo Go is not the host.`,
    )
  }
  console.log(
    `${gate} agent-cli status: SDK ${project.sdkVersion}, usesDevClient=${project.usesDevClient}`,
  )
  return status.data
}

export const assertAllPass = (
  report: ProbeReport,
  expectedCount: number,
  label: string,
) => {
  if (report.checks.length !== expectedCount) {
    fail(
      `${label} reported ${report.checks.length} checks, expected ${expectedCount}`,
    )
  }
  const failed = report.checks.filter((check) => check.status !== 'PASS')
  if (failed.length > 0) {
    fail(
      `${label} failed:\n${failed.map((check) => `  ${check.name}: ${check.detail}`).join('\n')}`,
    )
  }
}
