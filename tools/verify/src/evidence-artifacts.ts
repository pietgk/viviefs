/**
 * Reads what the coverage producers wrote under `.artifacts/verify/` and the
 * evidence lockfile. Shared by `check-evidence.ts` and `baseline.ts`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { COVERAGE_PRODUCERS, type CoverageProducer } from '@viviefs/testing/vitest'
import type { ProducerRun, TestReport } from './evidence.ts'
import { LOCKFILE, type FileCoverage, type Lockfile, type Provider } from './lockfile.ts'
import { coverageFileOf, reportFileOf, runFileOf } from './producers.ts'
import { ROOT } from './stages.ts'

const json = <A>(path: string): A => JSON.parse(readFileSync(path, 'utf8')) as A

export const coverageProvider = (root = ROOT): Provider => {
  const pkg = json<{ name: string; version: string }>(
    join(root, 'node_modules/@vitest/coverage-istanbul/package.json'),
  )
  return { name: 'istanbul', package: pkg.name, version: pkg.version }
}

/** The producers that ran in verify run `run`, with repository-relative coverage keys. */
export const loadRuns = (run: string, root = ROOT): Partial<Record<CoverageProducer, ProducerRun>> => {
  const provider = coverageProvider(root)
  const runs: Partial<Record<CoverageProducer, ProducerRun>> = {}
  for (const producer of COVERAGE_PRODUCERS) {
    if (!existsSync(runFileOf(producer, root))) continue
    if (json<{ run: string | null }>(runFileOf(producer, root)).run !== run) continue
    if (!existsSync(coverageFileOf(producer, root)) || !existsSync(reportFileOf(producer, root))) continue
    const coverage = Object.fromEntries(
      Object.entries(json<Record<string, FileCoverage>>(coverageFileOf(producer, root))).map(([path, file]) => [
        relative(root, path),
        file,
      ]),
    )
    runs[producer] = { coverage, report: json<TestReport>(reportFileOf(producer, root)), provider }
  }
  return runs
}

export const readLockfile = (root = ROOT): Lockfile | undefined =>
  existsSync(join(root, LOCKFILE)) ? json<Lockfile>(join(root, LOCKFILE)) : undefined
