/**
 * The suite catalogue (D75, D80): every suite's id, the pattern whose contract
 * it checks, and the gate that records its claim. The one place a suite is
 * declared. Vitest defines one test tag per suite from it, so a test tagged
 * with an unknown suite fails, and `verify` checks registry entries against it.
 * A suite's checks live with its contract, in that lib's `src/suites/`.
 */

/** The patterns (D65). A suite belongs to exactly one. */
export const PATTERNS = [
  'log-store',
  'changesets',
  'durable-workflow',
  'device-durability',
  'interaction-state',
  'sync',
  'tracing',
  'identity',
  'links-and-routing',
] as const

export type Pattern = (typeof PATTERNS)[number]

export type Suite = {
  readonly id: `${Pattern}/${string}`
  readonly pattern: Pattern
  readonly aspect: string
  readonly gate: `P${number}`
  readonly description: string
  /** Where its checks live, repository-relative. */
  readonly source: string
  /** A lab-only suite runs in qualify, never in `verify`. */
  readonly labOnly?: true
}

const suite = <const P extends Pattern, const A extends string>(
  pattern: P,
  aspect: A,
  rest: Omit<Suite, 'id' | 'pattern' | 'aspect'>,
) => ({ id: `${pattern}/${aspect}` as const, pattern, aspect, ...rest })

export const SUITES = [
  suite('log-store', 'conformance', {
    gate: 'P04',
    description: 'A log store appends, reads, orders by HLC, stays idempotent and stamps acceptance time.',
    source: 'libs/datom/src/suites/log-store.ts',
  }),
  suite('changesets', 'conformance', {
    gate: 'P05',
    description: 'Changesets commit, abort, check their basis and project, on a log store.',
    source: 'libs/datom/src/suites/changesets.ts',
  }),
  suite('durable-workflow', 'crash-matrix', {
    gate: 'P06',
    description: 'The engine resumes after a kill at every boundary, each effect at most once; the memory engine must fail.',
    source: 'libs/workflow-engine/src/suites/crash-matrix.ts',
  }),
  suite('device-durability', 'launch-sweep', {
    gate: 'P07',
    description: 'Work parked when the app died resumes at the next launch.',
    source: 'libs/workflow-engine/src/suites/launch-sweep.ts',
  }),
  suite('tracing', 'engine-trace', {
    gate: 'P10',
    description: 'The engine journals what a trace needs: one start per attempt, causing spans, live spans only in bodies.',
    source: 'libs/workflow-engine/src/suites/trace-scenario.ts',
  }),
  suite('tracing', 'projection', {
    gate: 'P10',
    description: 'The trace projector derives one lossless, stable trace from the log and keeps its cursor honest.',
    source: 'libs/telemetry/src/suites/projection.ts',
  }),
  suite('tracing', 'sink', {
    gate: 'P10',
    description: 'A TraceSink delivers projected spans to motel, Jaeger and otel-lgtm.',
    source: 'tools/qualification/src/probes/p10-checks.ts',
    labOnly: true,
  }),
  suite('interaction-state', 'intent-composer', {
    gate: 'P08',
    description: "IntentComposer's behaviour, the same for every interaction-state implementation.",
    source: 'features/evidence/client/src/intent-composer/checks.ts',
  }),
  suite('sync', 'protocol', {
    gate: 'P09',
    description: 'Outbox, cursor, acknowledgement and blobs between the sync client and server.',
    source: 'tools/qualification/src/probes/p09-checks.ts',
  }),
  suite('identity', 'token-verifier', {
    gate: 'P11',
    description: 'A token verifier accepts a valid token and refuses every forged, foreign or expired one.',
    source: 'libs/identity/src/suites/token-verifier.ts',
  }),
  suite('identity', 'membership', {
    gate: 'P11',
    description: 'Sync enforces membership, the actor and server-only attributes for the signed-in person.',
    source: 'tools/qualification/src/probes/p11-checks.ts',
  }),
] as const satisfies ReadonlyArray<Suite>

export type SuiteId = (typeof SUITES)[number]['id']

/** Vitest test tags, one per suite. `strictTags` makes a mistyped suite id fail. */
export const suiteTags = SUITES.map((entry) => ({
  name: entry.id,
  description: `${entry.gate}: ${entry.description}`,
}))

/** Test options that tag a test as a run of one suite. */
export const runsSuite = (id: SuiteId, timeout?: number) => ({
  tags: [id],
  ...(timeout === undefined ? {} : { timeout }),
})
