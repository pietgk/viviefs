/**
 * Datom-backed WorkflowEngine (D10, D39), the P06 crash-matrix harness,
 * the P07 launch sweep / wake-scheduler ports, and the P10 durable span
 * identity. Its suites (D80) are `@viviefs/workflow-engine/suites`:
 * `src/suites/crash-matrix.ts`, `src/suites/launch-sweep.ts` and
 * `src/suites/trace-scenario.ts`, run on each store by the
 * `*.integration.test.ts` files here.
 */
export { EngineConfig, engineConfigLayer } from './config.ts'
export {
  armedCrashHook,
  CrashHook,
  noopCrashHook,
  type CrashBoundary,
} from './crash-hook.ts'
export { engineLayer, Leases, StaleLease } from './engine.ts'
export { EngineSweep } from './sweep.ts'
export { noopWakeScheduler, WakeScheduler } from './wake.ts'
export {
  callerContext,
  durableContext,
  isRecordedContext,
  spanIdFor,
  traceIdFor,
  type TraceContext,
} from './trace.ts'
export {
  decodeActivityStarted,
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  decodeWorkflowExit,
  encodeActivityStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
  encodeWorkflowExit,
} from './journal.ts'
export type {
  ActivityStartedValue,
  ClockValue,
  LeaseValue,
  StartedValue,
} from './journal.ts'
