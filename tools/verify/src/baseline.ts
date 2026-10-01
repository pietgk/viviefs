/**
 * `pnpm verify baseline` (D70, D77): the one command that writes the evidence
 * lockfile. It runs every coverage producer three times and refuses to write
 * when an owned tuple differs between runs, because a tuple that varies is a
 * flaky test, fixed as a defect. `verify.ts` runs the steps; this module holds
 * the decisions.
 */
import type { CoverageProducer } from '@viviefs/testing/vitest'
import type { PlatformReport } from './bundle-size.ts'
import {
  NOTICE,
  formatTuple,
  sameTuple,
  type BundleReference,
  type Lockfile,
  type Provider,
  type Tuple,
} from './lockfile.ts'

export const BASELINE_RUNS = 3

type Tuples = Partial<Record<CoverageProducer, Readonly<Record<string, Tuple>>>>

/** Owned tuples that are not the same in every run. */
export const unstableTuples = (runs: ReadonlyArray<Tuples>): ReadonlyArray<string> => {
  const [first, ...rest] = runs
  if (!first) return []
  const unstable: string[] = []
  const producers = new Set(runs.flatMap((run) => Object.keys(run))) as Set<CoverageProducer>
  for (const producer of producers) {
    const paths = new Set(runs.flatMap((run) => Object.keys(run[producer] ?? {})))
    for (const path of [...paths].sort()) {
      const seen = runs.map((run) => run[producer]?.[path])
      const reference = first[producer]?.[path]
      const stable =
        reference !== undefined &&
        rest.every((run) => {
          const tuple = run[producer]?.[path]
          return tuple !== undefined && sameTuple(tuple, reference)
        })
      if (!stable) {
        unstable.push(
          `${path} (${producer}): ` +
            seen.map((tuple, index) => `run ${index + 1} ${tuple ? formatTuple(tuple) : 'absent'}`).join('; '),
        )
      }
    }
  }
  return unstable
}

export const bundleReferences = (
  reports: ReadonlyArray<PlatformReport>,
  recordedAt: string,
): Readonly<Record<string, BundleReference>> =>
  Object.fromEntries(
    reports.map((report) => [
      report.platform,
      { recordedAt, hbcBytes: report.hbcBytes, jsBytes: report.jsBytes, packages: report.packages },
    ]),
  )

export const composeLockfile = (input: {
  readonly digest: string
  readonly providers: Partial<Record<CoverageProducer, Provider>>
  readonly tuples: Tuples
  readonly bundle: Lockfile['bundle']
}): Lockfile => ({
  notice: NOTICE,
  registryDigest: input.digest,
  providers: input.providers,
  coverage: input.tuples,
  bundle: input.bundle,
})
