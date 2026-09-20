/**
 * Effect-native OTLP/HTTP JSON export. P03 exemplar of the telemetry sink
 * adapter: one base URL chooses motel, Jaeger, or otel-lgtm. Trace projection
 * from the log arrives at P10.
 */
import * as Layer from 'effect/Layer'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as OtlpSerialization from 'effect/unstable/observability/OtlpSerialization'
import * as OtlpTracer from 'effect/unstable/observability/OtlpTracer'

export const DEFAULT_OTLP_SERVICE_NAME = 'viviefs-evidence'

export const otlpJsonLayer = (options: {
  baseUrl: string
  serviceName?: string
}) =>
  OtlpTracer.layer({
    url: `${options.baseUrl.replace(/\/$/, '')}/v1/traces`,
    resource: {
      serviceName: options.serviceName ?? DEFAULT_OTLP_SERVICE_NAME,
    },
    exportInterval: '100 millis',
    maxBatchSize: 1,
    shutdownTimeout: '8 seconds',
  }).pipe(
    Layer.provide(OtlpSerialization.layerJson),
    Layer.provide(FetchHttpClient.layer),
  )
