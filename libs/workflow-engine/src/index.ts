/**
 * Datom-backed WorkflowEngine (D10, D39) and the P06 crash-matrix
 * harness (D20). First exemplar: `libs/testing/src/crash-matrix.ts`.
 */
export { EngineConfig, engineConfigLayer } from './config.ts'
export {
  armedCrashHook,
  CrashHook,
  noopCrashHook,
  type CrashBoundary,
} from './crash-hook.ts'
export { engineLayer, Leases, StaleLease } from './engine.ts'
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
