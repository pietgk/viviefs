/**
 * Datom-backed WorkflowEngine (D10, D39), the P06 crash-matrix harness,
 * and the P07 launch sweep / wake-scheduler ports. First exemplars:
 * `libs/testing/src/crash-matrix.ts` and `libs/testing/src/launch-sweep.ts`.
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
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
} from './journal.ts'
export type { ClockValue, LeaseValue, StartedValue } from './journal.ts'
