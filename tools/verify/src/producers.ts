/**
 * Coverage producers (D77): `unit`, `integration` and `storybook` are each one
 * Vitest run from the workspace root, over the projects whose `project.json`
 * declares the producer's target. Coverage is limited to the files the
 * registry gives to that producer, so a file is judged only by its owner.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CONFIG_FILES, type CoverageProducer } from '@viviefs/testing/vitest'
import { REGISTRY } from './evidence-registry.ts'
import { owningProducer } from './file-treatments.ts'
import { ROOT } from './stages.ts'

/** The Nx target a project declares to take part in a producer. */
export const PRODUCER_TARGETS: Readonly<Record<CoverageProducer, string>> = {
  unit: 'test',
  integration: 'test-integration',
  storybook: 'test-storybook',
}

export const artifactsOf = (producer: CoverageProducer, root = ROOT) => join(root, '.artifacts/verify', producer)

export const coverageFileOf = (producer: CoverageProducer, root = ROOT) =>
  join(artifactsOf(producer, root), 'coverage/coverage-final.json')

export const reportFileOf = (producer: CoverageProducer, root = ROOT) => join(artifactsOf(producer, root), 'report.json')

export const runFileOf = (producer: CoverageProducer, root = ROOT) => join(artifactsOf(producer, root), 'run.json')

/** Project directories that declare the producer's target, from `project.json`. */
export const producerProjects = (producer: CoverageProducer): ReadonlyArray<string> =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((path) => path.endsWith('/project.json') && !/^(?:repos|vendor|\.agents)\//.test(path))
    .filter((path) => {
      const targets = (JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as { targets?: object }).targets
      return targets !== undefined && PRODUCER_TARGETS[producer] in targets
    })
    .map((path) => dirname(path))
    .filter((dir) => existsSync(join(ROOT, dir, CONFIG_FILES[producer])))
    .sort()

/** Files whose evidence this producer owns. */
export const ownedFiles = (producer: CoverageProducer): ReadonlyArray<string> =>
  REGISTRY.filter((entry) => owningProducer(entry) === producer)
    .map(({ path }) => path)
    .sort()
