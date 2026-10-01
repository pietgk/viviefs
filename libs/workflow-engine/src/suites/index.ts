/**
 * `@viviefs/workflow-engine/suites`: the engine suites (D78, D80):
 * `durable-workflow/crash-matrix`, `device-durability/launch-sweep` and
 * `tracing/engine-trace`, run against the engine on each log store.
 * Test-support: only tests, other suites, `tools/` and the evidence apps may
 * import it.
 */
export {
  P06_CHECK_COUNT,
  P06_CHECK_NAMES,
  P06_DATOM_CHECK_COUNT,
  P06_DATOM_CHECK_NAMES,
  runCrashMatrix,
  runHappyPath,
  runMemoryDurabilityControl,
  type StoreFactory,
} from './crash-matrix.ts'
export {
  P07_CHECK_COUNT,
  P07_CHECK_NAMES,
  P07_DEVICE_CHECK_COUNT,
  P07_DEVICE_CHECK_NAMES,
  P07_HOST_CHECK_COUNT,
  P07_HOST_CHECK_NAMES,
  P07_PARKED_ATTR,
  runLaunchSweepChecks,
} from './launch-sweep.ts'
export { LAB_PERSON } from './lab.ts'
export {
  P10_ENGINE_CHECK_COUNT,
  P10_ENGINE_CHECK_NAMES,
  P10_ORG,
  TraceProbe,
  judgeTraceJournal,
  runTraceJournalChecks,
  runTraceScenario,
  type SpanContext,
  type TraceScenario,
} from './trace-scenario.ts'
