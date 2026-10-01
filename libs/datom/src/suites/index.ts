/**
 * `@viviefs/datom/suites`: the `log-store/conformance` and
 * `changesets/conformance` suites (D80), run by every log store. Test-support:
 * only tests, other suites, `tools/` and the evidence apps may import it.
 */
export {
  P04_CHECK_COUNT,
  P04_CHECK_NAMES,
  makeMutableClock,
  runLogStoreChecks,
  type MutableClock,
} from './log-store.ts'
export {
  P05_CHECK_COUNT,
  P05_CHECK_NAMES,
  runChangesetChecks,
} from './changesets.ts'
