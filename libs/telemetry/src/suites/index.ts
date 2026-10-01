/**
 * `@viviefs/telemetry/suites`: the `tracing/projection` suite (D80), run
 * against the trace projector on each log store. Test-support: only tests,
 * other suites, `tools/` and the evidence apps may import it.
 */
export {
  P10_PROJECTION_CHECK_COUNT,
  P10_PROJECTION_CHECK_NAMES,
  expectedSpanIds,
  judgeTraceProjection,
  runTraceProjection,
  runTraceProjectionChecks,
  type ProjectionRun,
} from './projection.ts'
