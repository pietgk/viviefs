/**
 * The three P10 telemetry sinks (D45'), each behind one OTLP/HTTP base URL
 * and one query that returns the span ids a sink holds for a trace, as hex.
 *
 * motel runs from `vendor/motel` like P03. Jaeger and otel-lgtm run on
 * Apple Container, pinned by digest in `lab-images.json`, on ports that do
 * not clash with complyj's lab.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from '../process.ts'
import { fail, sleep } from './dev-client.ts'
import { MOTEL_ORIGIN, ensureMotelDaemon } from './motel.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const LAB_IMAGES = join(ROOT, 'tools/qualification/lab-images.json')

export type SinkSpan = {
  readonly spanId: string
  readonly parentSpanId: string | undefined
  readonly name: string
}

export type P10Sink = {
  readonly name: 'motel' | 'jaeger' | 'otel-lgtm'
  readonly otlpBaseUrl: string
  /** Where a person can look at the trace. */
  readonly viewer: (traceId: string) => string
  readonly start: (artifacts: string) => Promise<void>
  readonly stop: () => Promise<void>
  readonly spans: (traceId: string) => Promise<ReadonlyArray<SinkSpan>>
}

const getJson = async (url: string): Promise<{ status: number; body: unknown }> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const text = await response.text()
    try {
      return { status: response.status, body: text.length > 0 ? JSON.parse(text) : undefined }
    } catch {
      // Health endpoints such as Tempo's /ready answer in plain text.
      return { status: response.status, body: text }
    }
  } catch (error) {
    return { status: 0, body: String(error) }
  }
}

const until = async (label: string, ms: number, ready: () => Promise<boolean>) => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (await ready()) return
    await sleep(500)
  }
  fail(`${label} did not become ready within ${ms} ms`)
}

const acceptsOtlp = (baseUrl: string) => async () => {
  try {
    const response = await fetch(`${baseUrl}/v1/traces`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [] }),
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

type LabImages = { images: Record<'jaeger' | 'otelLgtm', { image: string }> }

const pinnedImage = async (key: 'jaeger' | 'otelLgtm') => {
  const lock = JSON.parse(await readFile(LAB_IMAGES, 'utf8')) as LabImages
  const image = lock.images[key].image
  if (!/@sha256:[0-9a-f]{64}$/.test(image)) fail(`${key} in lab-images.json is not pinned by digest: ${image}`)
  return image
}

const containerCli = async (args: string[], timeout = 120_000) => {
  const result = await command('container', args, { timeout })
  return result
}

const removeContainer = async (name: string) => {
  await containerCli(['stop', name], 30_000)
  await containerCli(['rm', name], 30_000)
}

const runContainer = async (name: string, image: string, ports: ReadonlyArray<string>) => {
  const status = await containerCli(['system', 'status'], 15_000)
  if (status.code !== 0) fail(`Apple Container is not running: ${status.stderr || status.stdout}`)
  await removeContainer(name)
  const args = ['run', '-d', '--name', name]
  for (const port of ports) args.push('-p', port)
  args.push(image)
  const started = await containerCli(args)
  if (started.code !== 0) fail(`container run ${name} failed: ${started.stderr || started.stdout}`)
}

const base64ToHex = (value: string) => Buffer.from(value, 'base64').toString('hex')

// motel: GET /api/traces/{traceId}/spans -> { data: [{ span: { spanId, parentSpanId, operationName } }] }
export const motelSink: P10Sink = {
  name: 'motel',
  otlpBaseUrl: MOTEL_ORIGIN,
  viewer: (traceId) => `${MOTEL_ORIGIN}/api/traces/${traceId}/spans`,
  start: async (artifacts) => {
    await ensureMotelDaemon(artifacts)
  },
  // motel is the shared local daemon P03 also uses; P10 leaves it running.
  stop: () => Promise.resolve(),
  spans: async (traceId) => {
    const { status, body } = await getJson(`${MOTEL_ORIGIN}/api/traces/${traceId}/spans`)
    if (status !== 200) return []
    const data = (body as { data?: Array<{ span?: { spanId: string; parentSpanId: string | null; operationName: string } }> }).data ?? []
    return data.flatMap((row) =>
      row.span
        ? [{ spanId: row.span.spanId, parentSpanId: row.span.parentSpanId ?? undefined, name: row.span.operationName }]
        : [],
    )
  },
}

const JAEGER = { name: 'viviefs-p10-jaeger', query: 'http://127.0.0.1:26686', otlp: 'http://127.0.0.1:24318' }

// Jaeger: GET /api/traces/{traceId} -> { data: [{ spans: [{ spanID, operationName, references }] }] }
export const jaegerSink: P10Sink = {
  name: 'jaeger',
  otlpBaseUrl: JAEGER.otlp,
  viewer: (traceId) => `${JAEGER.query}/trace/${traceId}`,
  start: async () => {
    await runContainer(JAEGER.name, await pinnedImage('jaeger'), [
      '127.0.0.1:26686:16686',
      '127.0.0.1:24318:4318',
    ])
    await until('jaeger query', 60_000, async () => (await getJson(`${JAEGER.query}/api/services`)).status === 200)
    await until('jaeger otlp', 60_000, acceptsOtlp(JAEGER.otlp))
  },
  stop: () => removeContainer(JAEGER.name),
  spans: async (traceId) => {
    const { status, body } = await getJson(`${JAEGER.query}/api/traces/${traceId}`)
    if (status !== 200) return []
    type JaegerSpan = { spanID: string; operationName: string; references?: Array<{ refType: string; spanID: string }> }
    const traces = (body as { data?: Array<{ spans?: Array<JaegerSpan> }> }).data ?? []
    return traces.flatMap((trace) =>
      (trace.spans ?? []).map((span) => ({
        spanId: span.spanID,
        parentSpanId: span.references?.find((ref) => ref.refType === 'CHILD_OF')?.spanID,
        name: span.operationName,
      })),
    )
  },
}

const LGTM = {
  name: 'viviefs-p10-lgtm',
  tempo: 'http://127.0.0.1:23200',
  otlp: 'http://127.0.0.1:25318',
  grafana: 'http://127.0.0.1:23000',
}

// Tempo in otel-lgtm: GET /api/v2/traces/{traceId} -> OTLP JSON with base64 ids
export const otelLgtmSink: P10Sink = {
  name: 'otel-lgtm',
  otlpBaseUrl: LGTM.otlp,
  viewer: (traceId) => `${LGTM.grafana}/explore (Tempo, trace ${traceId})`,
  start: async () => {
    await runContainer(LGTM.name, await pinnedImage('otelLgtm'), [
      '127.0.0.1:25318:4318',
      '127.0.0.1:23200:3200',
      '127.0.0.1:23000:3000',
    ])
    await until('tempo', 120_000, async () => (await getJson(`${LGTM.tempo}/ready`)).status === 200)
    await until('otel-lgtm otlp', 120_000, acceptsOtlp(LGTM.otlp))
  },
  stop: () => removeContainer(LGTM.name),
  spans: async (traceId) => {
    const { status, body } = await getJson(`${LGTM.tempo}/api/v2/traces/${traceId}`)
    if (status !== 200) return []
    type TempoSpan = { spanId: string; parentSpanId?: string; name: string }
    const resourceSpans =
      (body as { trace?: { resourceSpans?: Array<{ scopeSpans?: Array<{ spans?: Array<TempoSpan> }> }> } }).trace
        ?.resourceSpans ?? []
    return resourceSpans.flatMap((resource) =>
      (resource.scopeSpans ?? []).flatMap((scope) =>
        (scope.spans ?? []).map((span) => ({
          spanId: base64ToHex(span.spanId),
          parentSpanId: span.parentSpanId ? base64ToHex(span.parentSpanId) : undefined,
          name: span.name,
        })),
      ),
    )
  },
}

export const P10_SINKS: ReadonlyArray<P10Sink> = [motelSink, jaegerSink, otelLgtmSink]

/** Poll a sink until it holds exactly `expected` span ids for the trace. */
export const waitForSpanIds = async (
  sink: P10Sink,
  traceId: string,
  expected: ReadonlySet<string>,
  ms: number,
): Promise<ReadonlyArray<SinkSpan>> => {
  const deadline = Date.now() + ms
  let last: ReadonlyArray<SinkSpan> = []
  while (Date.now() < deadline) {
    last = await sink.spans(traceId)
    const ids = new Set(last.map((span) => span.spanId))
    if (ids.size === expected.size && [...expected].every((id) => ids.has(id))) return last
    await sleep(1000)
  }
  return last
}
