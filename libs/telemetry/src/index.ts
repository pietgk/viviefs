/**
 * `@viviefs/telemetry`: the live OTLP layer (P03) and the trace projector
 * with its sink contract (P10).
 */
export {
  DEFAULT_OTLP_SERVICE_NAME,
  otlpJsonLayer,
} from './layer.ts'
export {
  END_ATTRIBUTES,
  executionEntityOf,
  spanForEndFact,
  type AttributeValue,
  type DurableSpan,
  type ExecutionJournal,
} from './durable-spans.ts'
export {
  SinkRejected,
  TraceSink,
  otlpTraceSink,
  toOtlpSpan,
  toTraceData,
} from './trace-sink.ts'
export {
  DEFAULT_TRACE_BATCH,
  TraceProjector,
  traceConsumer,
  traceProjectorLayer,
  type ExportResult,
} from './trace-projector.ts'
