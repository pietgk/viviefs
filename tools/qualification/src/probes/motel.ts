import { randomBytes } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from '../process.ts'
import { fail, sleep, writeJson } from './dev-client.ts'

export const PINNED_MOTEL = '0.2.8'
export const MOTEL_ORIGIN = 'http://127.0.0.1:27686'
export const MOTEL_SERVICE = 'viviefs-evidence-p03'
export const WRONG_OTLP_ORIGIN = 'http://127.0.0.1:27687'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
export const MOTEL_VENDOR = join(ROOT, 'vendor/motel')

type SpanSearch = {
  data?: Array<{
    span?: { tags?: Record<string, string>; operationName?: string }
  }>
}

const bun = async (
  args: string[],
  options: { cwd?: string | undefined; timeout?: number | undefined } = {},
) =>
  command('bun', args, {
    cwd: options.cwd ?? MOTEL_VENDOR,
    timeout: options.timeout ?? 60_000,
  })

export const motelHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${MOTEL_ORIGIN}/api/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return false
    const body = (await response.json()) as { ok?: boolean; version?: string }
    return body.ok === true
  } catch {
    return false
  }
}

export const searchSpansByToken = async (
  token: string,
  service = MOTEL_SERVICE,
  origin = MOTEL_ORIGIN,
): Promise<SpanSearch> => {
  const url = new URL(`${origin}/api/spans/search`)
  url.searchParams.set('service', service)
  url.searchParams.set('attr.probe.token', token)
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) {
    throw new Error(`motel search failed: ${response.status}`)
  }
  return (await response.json()) as SpanSearch
}

export const waitForSpan = async (
  token: string,
  ms: number,
  service = MOTEL_SERVICE,
  origin = MOTEL_ORIGIN,
): Promise<SpanSearch> => {
  const deadline = Date.now() + ms
  let last: SpanSearch = { data: [] }
  while (Date.now() < deadline) {
    last = await searchSpansByToken(token, service, origin)
    if ((last.data?.length ?? 0) > 0) return last
    await sleep(1000)
  }
  return last
}

export const assertPhysicalDeviceDoc = async () => {
  const { readFile } = await import('node:fs/promises')
  const path = join(ROOT, 'docs/evidence/p03-physical-device.md')
  const text = await readFile(path, 'utf8')
  if (!/LAN binding/i.test(text) || !/cursor catch-up/i.test(text)) {
    fail(
      'P03 requires docs/evidence/p03-physical-device.md to document LAN binding and cursor catch-up.',
    )
  }
  if (!/MOTEL_OTEL_HOST=0\.0\.0\.0/.test(text)) {
    fail(
      'P03 physical-device path must name MOTEL_OTEL_HOST=0.0.0.0 for LAN binding.',
    )
  }
}

const CANARY_SERVICE = 'viviefs-qualification-canary'

/**
 * Whether motel stores a span posted now. `/api/health` is not enough: on
 * 2026-09-28 a daemon started eight days earlier from a `/tmp` copy (which
 * macOS had since emptied) still answered health and search while every
 * `POST /v1/traces` hung, and P07 and P10 lost their spans.
 */
export const motelIngests = async (origin = MOTEL_ORIGIN): Promise<boolean> => {
  const token = `canary-${Date.now()}-${randomBytes(4).toString('hex')}`
  const now = BigInt(Date.now()) * 1_000_000n
  const body = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: CANARY_SERVICE } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: CANARY_SERVICE },
            spans: [
              {
                traceId: randomBytes(16).toString('hex'),
                spanId: randomBytes(8).toString('hex'),
                name: 'qualification.canary',
                kind: 1,
                startTimeUnixNano: String(now),
                endTimeUnixNano: String(now + 1_000_000n),
                attributes: [
                  { key: 'probe.token', value: { stringValue: token } },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
  try {
    const posted = await fetch(`${origin}/v1/traces`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
    if (!posted.ok) return false
    const found = await waitForSpan(token, 10_000, CANARY_SERVICE, origin)
    return (found.data?.length ?? 0) > 0
  } catch {
    return false
  }
}

const startMotelDaemon = async (artifacts: string) => {
  const installed = await bun(['install'], { timeout: 120_000 })
  await writeJson(artifacts, 'motel-install.json', {
    code: installed.code,
    stdout: installed.stdout.slice(-2000),
    stderr: installed.stderr.slice(-2000),
  })
  if (installed.code !== 0) {
    fail(
      `bun install in vendor/motel failed: ${installed.stderr || installed.stdout}`,
    )
  }
  const started = await bun(['x', 'motel', 'daemon'], { timeout: 30_000 })
  await writeJson(artifacts, 'motel-daemon.json', {
    code: started.code,
    stdout: started.stdout,
    stderr: started.stderr,
  })
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (await motelHealth()) return
    await sleep(500)
  }
  fail(
    `motel daemon did not become healthy. ${started.stderr || started.stdout}`,
  )
}

export const ensureMotelDaemon = async (artifacts: string) => {
  await mkdir(MOTEL_VENDOR, { recursive: true })
  if (await motelHealth()) {
    if (await motelIngests()) {
      console.log('P03 motel already healthy on 127.0.0.1:27686')
      return
    }
    console.log('P03 motel answers but does not store spans; restarting it')
    const stopped = await bun(['x', 'motel', 'stop'], { timeout: 30_000 })
    await writeJson(artifacts, 'motel-stop.json', {
      code: stopped.code,
      stdout: stopped.stdout,
      stderr: stopped.stderr,
    })
    const deadline = Date.now() + 20_000
    while (Date.now() < deadline && (await motelHealth())) await sleep(500)
    if (await motelHealth()) {
      fail(`motel stop left the daemon running. ${stopped.stderr || stopped.stdout}`)
    }
  }
  await startMotelDaemon(artifacts)
  if (!(await motelIngests())) {
    fail('motel daemon started but did not store a canary span')
  }
  console.log('P03 motel daemon healthy')
}
