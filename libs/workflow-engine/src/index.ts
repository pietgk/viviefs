/**
 * Datom-backed WorkflowEngine (D10, D39), the P06 crash-matrix harness,
 * the P07 launch sweep / wake-scheduler ports, and the P10 durable span
 * identity. First exemplars: `libs/testing/src/crash-matrix.ts`,
 * `libs/testing/src/launch-sweep.ts` and `libs/telemetry/src/projector.ts`.
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
  encodeActivityStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
} from './journal.ts'
export type {
  ActivityStartedValue,
  ClockValue,
  LeaseValue,
  StartedValue,
} from './journal.ts'
