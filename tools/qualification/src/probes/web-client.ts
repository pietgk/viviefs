import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import {
  fail,
  metroStatusOk,
  sleep,
  stopDev,
  waitForMetro,
  writeJson,
  type ProbeReport,
} from './dev-client.ts'

type EvalJson = {
  threw?: boolean
  value?: ProbeReport | null
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

const launchChrome = async () => {
  const { chromium } = await import('playwright')
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return chromium.launch({ headless: true })
  }
}

const startExpoWeb = (
  cwd: string,
  env: NodeJS.ProcessEnv,
  logFile: string,
) => {
  const child = spawn(
    'pnpm',
    [
      'exec',
      'expo',
      'start',
      '--web',
      '--localhost',
      '--clear',
      '--port',
      '8081',
    ],
    {
      cwd,
      env: {
        ...process.env,
        ...env,
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
        BROWSER: 'none',
        REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
        NODE_OPTIONS: [
          process.env.NODE_OPTIONS,
          env.NODE_OPTIONS,
          '--dns-result-order=ipv4first',
        ]
          .filter(Boolean)
          .join(' '),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    },
  )
  const append = (data: string) => {
    void writeFile(logFile, data, { flag: 'a' })
  }
  void writeFile(logFile, '')
  child.stdout?.setEncoding('utf8').on('data', append)
  child.stderr?.setEncoding('utf8').on('data', append)
  child.on('exit', (code) => {
    append(`\n[expo web exited ${code}]\n`)
  })
  child.unref()
  return child
}

export const runWebVariant = async (options: {
  cwd: string
  artifacts: string
  env: NodeJS.ProcessEnv
  slot: string
  gate: string
  variant: string
}): Promise<ProbeReport> => {
  await stopDev(options.cwd)
  const logFile = join(options.artifacts, `web-metro-${options.variant}.log`)
  startExpoWeb(options.cwd, options.env, logFile)
  const browser = await launchChrome()
  try {
    if (!(await metroStatusOk())) {
      console.log(
        `${options.gate} waiting for Expo web Metro (${options.variant})`,
      )
    }
    const origin = await waitForMetro(180_000, `web ${options.variant}`)
    const page = await browser.newPage()
    const consoleLines: string[] = []
    page.on('console', (message) => {
      consoleLines.push(`${message.type()}: ${message.text()}`)
    })
    page.on('pageerror', (error) => {
      consoleLines.push(`pageerror: ${String(error)} ${error.stack ?? ''}`)
    })
    await page.goto(origin, {
      waitUntil: 'load',
      timeout: 60_000,
    })
    const deadline = Date.now() + 180_000
    while (Date.now() < deadline) {
      const evaluated = (await page.evaluate((slot) => {
        const value = (globalThis as Record<string, unknown>)[slot]
        return { threw: false, value: value ?? null }
      }, options.slot)) as EvalJson
      await writeJson(
        options.artifacts,
        `web-eval-${options.variant}-${Date.now()}.json`,
        evaluated,
      )
      if (isProbeReport(evaluated.value, options.gate)) {
        const report = evaluated.value
        if (report.ready && report.variant === options.variant) return report
      }
      await sleep(3000)
    }
    const html = await page.content()
    await writeFile(
      join(options.artifacts, `web-page-${options.variant}.html`),
      html,
    )
    await writeFile(
      join(options.artifacts, `web-console-${options.variant}.log`),
      consoleLines.join('\n'),
    )
    return fail(
      `web ${options.variant} did not publish ${options.slot} within 180s`,
    )
  } finally {
    await browser.close()
    await stopDev(options.cwd)
    await sleep(2000)
  }
}
