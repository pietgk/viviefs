/**
 * verify quality / evidence (D71, D75-D77): judges what the coverage producers
 * produced in this run against the registry and the evidence lockfile. Pure
 * over injected data; `check-evidence.ts` reads the artifacts and runs it.
 *
 * - An exactly covered file's tuple from its owning producer equals the
 *   lockfile. A regression fails; an improvement fails until
 *   `pnpm verify baseline` records it. Other producers reaching the file are
 *   informational and can neither fail nor rescue it.
 * - A suite an entry names has a passing test tagged with it in the owning
 *   producer; every suite the catalogue declares, except a lab-only one, runs.
 * - Test support is reached; a rendered component's stories ran and passed; a
 *   process entry's named test ran and passed.
 * - The lockfile's registry digest and coverage provider match this run.
 */
import type { Suite } from '@viviefs/testing'
import { COVERAGE_PRODUCERS, type CoverageProducer } from '@viviefs/testing/vitest'
import { hasExactCoverage, owningProducer, type RegistryEntry } from './file-treatments.ts'
import {
  METRICS,
  covered,
  formatTuple,
  sameTuple,
  tupleOf,
  type FileCoverage,
  type Lockfile,
  type Provider,
  type Tuple,
  uncovered,
} from './lockfile.ts'

/** The part of Vitest's JSON report the judge reads. */
export type TestReport = {
  readonly testResults: ReadonlyArray<{
    readonly name: string
    readonly assertionResults: ReadonlyArray<{
      readonly fullName: string
      readonly status: string
      readonly tags?: ReadonlyArray<string>
    }>
  }>
}

export type ProducerRun = {
  readonly coverage: Readonly<Record<string, FileCoverage>>
  readonly report: TestReport
  readonly provider: Provider
}

export type EvidenceInput = {
  readonly registry: ReadonlyArray<RegistryEntry>
  readonly digest: string
  readonly suites: ReadonlyArray<Suite>
  /** Keyed by repository-relative path. */
  readonly runs: Partial<Record<CoverageProducer, ProducerRun>>
  readonly lockfile: Lockfile | undefined
}

export type Evidence = {
  readonly issues: ReadonlyArray<string>
  /** The owned tuples this run produced, per producer: what baseline records. */
  readonly tuples: Partial<Record<CoverageProducer, Readonly<Record<string, Tuple>>>>
}

const BASELINE = 'record it with `pnpm verify baseline` after review'

const EMPTY: Tuple = { statements: '0/0', branches: '0/0', functions: '0/0', lines: '0/0' }

const passedTagged = (report: TestReport, tag: string) =>
  report.testResults.some(({ assertionResults }) =>
    assertionResults.some((result) => result.status === 'passed' && (result.tags ?? []).includes(tag)),
  )

const testFileOutcome = (report: TestReport, path: string) => {
  const file = report.testResults.find(({ name }) => name === path || name.endsWith(`/${path}`))
  if (!file) return 'did not run'
  if (file.assertionResults.length === 0) return 'ran no tests'
  const failed = file.assertionResults.filter(({ status }) => status !== 'passed' && status !== 'skipped')
  return failed.length > 0 ? `failed ${failed.length} test(s)` : undefined
}

const describeChange = (path: string, producer: CoverageProducer, recorded: Tuple, now: Tuple) => {
  // Less covered, or more left uncovered (new code no test runs), is a regression.
  const regressed = METRICS.some(
    (metric) =>
      covered(now[metric]) < covered(recorded[metric]) || uncovered(now[metric]) > uncovered(recorded[metric]),
  )
  return regressed
    ? `${path} (${producer}): coverage regressed. Lockfile ${formatTuple(recorded)}; now ${formatTuple(now)}.`
    : `${path} (${producer}): coverage changed. Lockfile ${formatTuple(recorded)}; now ${formatTuple(now)}; ${BASELINE}.`
}

export const judgeEvidence = (input: EvidenceInput): Evidence => {
  const issues: string[] = []
  const tuples: Partial<Record<CoverageProducer, Record<string, Tuple>>> = {}

  const needed = new Set(
    input.registry.map(owningProducer).filter((producer): producer is CoverageProducer => producer !== undefined),
  )
  for (const producer of COVERAGE_PRODUCERS) {
    if (needed.has(producer) && !input.runs[producer]) {
      issues.push(`The ${producer} producer did not run in this verify run; its evidence cannot be judged.`)
    }
  }

  if (!input.lockfile) {
    issues.push(`No evidence lockfile; ${BASELINE}.`)
  } else {
    if (input.lockfile.registryDigest !== input.digest) {
      issues.push(`The registry changed since the lockfile was written; ${BASELINE}.`)
    }
    for (const producer of COVERAGE_PRODUCERS) {
      const run = input.runs[producer]
      const recorded = input.lockfile.providers[producer]
      if (run && recorded && JSON.stringify(recorded) !== JSON.stringify(run.provider)) {
        issues.push(
          `The ${producer} coverage provider is ${run.provider.package}@${run.provider.version}, ` +
            `the lockfile has ${recorded.package}@${recorded.version}; a provider change needs a fresh, reviewed baseline.`,
        )
      }
    }
  }

  for (const entry of input.registry) {
    const producer = owningProducer(entry)
    if (producer === undefined) {
      if (entry.treatment === 'process-entry' && 'test' in entry.runBy && input.runs.unit) {
        const outcome = testFileOutcome(input.runs.unit.report, entry.runBy.test)
        if (outcome) issues.push(`${entry.path}: its test ${entry.runBy.test} ${outcome} in unit.`)
      }
      continue
    }
    const run = input.runs[producer]
    if (!run) continue
    // Vitest lists every included file, with zero counts when no test loads it.
    // A file missing from the map has nothing Istanbul counts (an Effect
    // service tag, say): its tuple is empty, and the lockfile notices when it
    // gains code.
    const file = run.coverage[entry.path]
    const tuple = file ? tupleOf(file) : EMPTY
    const reached = file === undefined || covered(tuple.statements) > 0

    if (entry.treatment === 'rendered-ui') {
      const outcome = testFileOutcome(run.report, entry.stories)
      if (outcome) issues.push(`${entry.path}: its stories ${entry.stories} ${outcome} in storybook.`)
      continue
    }
    if (!reached) {
      issues.push(`${entry.path}: ${entry.treatment}, owned by ${producer}, but no ${producer} test reaches it.`)
      continue
    }
    if (entry.treatment === 'node-unit' || entry.treatment === 'node-integration') {
      for (const suite of entry.suites ?? []) {
        if (!passedTagged(run.report, suite)) {
          issues.push(`${entry.path}: names suite ${suite}, but no passing ${producer} test runs it.`)
        }
      }
    }
    if (hasExactCoverage(entry)) {
      ;(tuples[producer] ??= {})[entry.path] = tuple
      const recorded = input.lockfile?.coverage[producer]?.[entry.path]
      if (input.lockfile && !recorded) {
        issues.push(`${entry.path} (${producer}): not in the lockfile; ${BASELINE}.`)
      } else if (recorded && !sameTuple(recorded, tuple)) {
        issues.push(describeChange(entry.path, producer, recorded, tuple))
      }
    }
  }

  if (input.lockfile) {
    for (const producer of COVERAGE_PRODUCERS) {
      if (!input.runs[producer]) continue
      const owned = new Set(Object.keys(tuples[producer] ?? {}))
      for (const path of Object.keys(input.lockfile.coverage[producer] ?? {})) {
        if (!owned.has(path)) {
          issues.push(`${path} (${producer}): in the lockfile but no longer exactly owned by ${producer}; ${BASELINE}.`)
        }
      }
    }
  }

  for (const suite of input.suites) {
    if (suite.labOnly) continue
    const ran = COVERAGE_PRODUCERS.some((producer) => {
      const run = input.runs[producer]
      return run !== undefined && passedTagged(run.report, suite.id)
    })
    const judged = COVERAGE_PRODUCERS.every((producer) => input.runs[producer] !== undefined)
    if (!ran && judged) issues.push(`Suite ${suite.id} is declared, but no passing test runs it.`)
  }

  return { issues, tuples }
}
