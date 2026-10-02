/**
 * Telemetry sink contract for durable spans (D45'). One implementation
 * posts OTLP/JSON to a base URL, which picks motel, Jaeger or otel-lgtm.
 * `send` succeeds only when the sink acknowledged the batch, so the trace
 * projector can advance its trace cursor on success and keep it on failure
 * (acknowledged cursor).
 *
 * Serialization and HTTP are Effect-native. Effect's batching `OtlpTracer`
 * is not used here: it drops its buffer after repeated failures, which is
 * right for live spans and wrong for durable ones.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import * as OtlpResource from 'effect/observability/OtlpResource'
import * as OtlpSerialization from 'effect/observability/OtlpSerialization'
import type * as OtlpTracer from 'effect/observability/OtlpTracer'
import type { DurableSpan } from './durable-spans.ts'

export class SinkRejected extends Schema.TaggedError<SinkRejected>()(
  'SinkRejected',
  {
    sink: Schema.String,
    reason: Schema.String,
  },
) {}

export class TraceSink extends Context.Service<
  TraceSink,
  {
    readonly name: string
    readonly send: (
      spans: ReadonlyArray<DurableSpan>,
    ) => Effect.Effect<void, SinkRejected>
  }
>()('viviefs/telemetry/TraceSink') {}

type OtlpSpan =
  OtlpTracer.TraceData['resourceSpans'][number]['scopeSpans'][number]['spans'][number]

const nanos = (ms: number): string => (BigInt(ms) * 1_000_000n).toString()

const STATUS = { ok: 1, error: 2 } as const
const INTERNAL = 1

export const toOtlpSpan = (span: DurableSpan): OtlpSpan => ({
  traceId: span.traceId,
  spanId: span.spanId,
  parentSpanId: span.parentSpanId,
  name: span.name,
  kind: INTERNAL,
  startTimeUnixNano: nanos(span.startMs),
  endTimeUnixNano: nanos(span.endMs),
  attributes: OtlpResource.entriesToAttributes(Object.entries(span.attributes)),
  droppedAttributesCount: 0,
  events: span.events.map((event) => ({
    name: event.name,
    timeUnixNano: nanos(event.timeMs),
    attributes: OtlpResource.entriesToAttributes(Object.entries(event.attributes)),
    droppedAttributesCount: 0,
  })),
  droppedEventsCount: 0,
  status:
    span.statusMessage === undefined
      ? { code: STATUS[span.status] }
      : { code: STATUS[span.status], message: span.statusMessage },
  links: span.links.map((link) => ({
    traceId: link.traceId,
    spanId: link.spanId,
    attributes: OtlpResource.entriesToAttributes(Object.entries(link.attributes)),
    droppedAttributesCount: 0,
  })),
  droppedLinksCount: 0,
})

export const toTraceData = (
  spans: ReadonlyArray<DurableSpan>,
  serviceName: string,
): OtlpTracer.TraceData => ({
  resourceSpans: [
    {
      resource: OtlpResource.make({ serviceName }),
      scopeSpans: [
        {
          scope: { name: 'viviefs.trace-projector' },
          spans: spans.map(toOtlpSpan),
        },
      ],
    },
  ],
})

/**
 * OTLP/HTTP JSON sink. `name` keys the trace cursor, so two sinks keep
 * independent cursors over the same log.
 */
export const otlpTraceSink = (options: {
  readonly name: string
  readonly baseUrl: string
  readonly serviceName: string
}): Layer.Layer<TraceSink> =>
  Layer.effect(
    TraceSink,
    Effect.gen(function* () {
      const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
      const serialization = yield* OtlpSerialization.OtlpSerialization
      const url = `${options.baseUrl.replace(/\/$/, '')}/v1/traces`
      return TraceSink.of({
        name: options.name,
        send: (spans) =>
          client
            .execute(
              HttpClientRequest.post(url).pipe(
                HttpClientRequest.setBody(
                  serialization.traces(toTraceData(spans, options.serviceName)),
                ),
              ),
            )
            .pipe(
              Effect.provideService(HttpClient.TracerPropagationEnabled, false),
              Effect.asVoid,
              Effect.mapError(
                (error) =>
                  new SinkRejected({ sink: options.name, reason: error.message }),
              ),
            ),
      })
    }),
  ).pipe(
    Layer.provide(OtlpSerialization.layerJson),
    Layer.provide(FetchHttpClient.layer),
  )
