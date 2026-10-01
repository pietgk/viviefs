/**
 * `@viviefs/testing`: generic test helpers and the suite catalogue (D80). It
 * depends on no `@viviefs` lib, so any lib's suites and tests can use it. A
 * suite's checks live with its contract, in that lib's `src/suites/`.
 */
export type { CheckResult, CheckStatus } from './check.ts'
export { runUnscoped } from './run-unscoped.ts'
export {
  PATTERNS,
  SUITES,
  runsSuite,
  suiteTags,
  type Pattern,
  type Suite,
  type SuiteId,
} from './suites.ts'
