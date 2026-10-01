import { describe, expect, it } from '@effect/vitest'
import type { Suite } from '@viviefs/testing'
import { judgeEvidence, type EvidenceInput, type ProducerRun, type TestReport } from './evidence.ts'
import type { RegistryEntry } from './file-treatments.ts'
import type { FileCoverage, Lockfile, Provider } from './lockfile.ts'

const provider: Provider = { name: 'istanbul', package: '@vitest/coverage-istanbul', version: '5.0.1' }

/** Coverage of a file with `hits` per statement, one function, no branches. */
const file = (...hits: ReadonlyArray<number>): FileCoverage => ({
  statementMap: Object.fromEntries(hits.map((_, index) => [String(index), { start: { line: index + 1 } }])),
  s: Object.fromEntries(hits.map((hit, index) => [String(index), hit])),
  f: { '0': hits.some((hit) => hit > 0) ? 1 : 0 },
  b: {},
})

const report = (...tests: ReadonlyArray<{ file: string; status?: string; tags?: ReadonlyArray<string> }>): TestReport => ({
  testResults: tests.map((test) => ({
    name: `/repo/${test.file}`,
    assertionResults: [{ fullName: test.file, status: test.status ?? 'passed', tags: test.tags ?? [] }],
  })),
})

const run = (coverage: Record<string, FileCoverage>, testReport: TestReport = report()): ProducerRun => ({
  coverage,
  report: testReport,
  provider,
})

const suite: Suite = {
  id: 'log-store/conformance',
  pattern: 'log-store',
  aspect: 'conformance',
  gate: 'P04',
  description: 'd',
  source: 's',
}

const store: RegistryEntry = {
  path: 'libs/store/src/layer.ts',
  treatment: 'node-integration',
  rationale: 'r',
  suites: ['log-store/conformance'],
}
const hlc: RegistryEntry = { path: 'libs/datom/src/hlc.ts', treatment: 'node-unit', rationale: 'r' }

const lockfile = (overrides: Partial<Lockfile> = {}): Lockfile => ({
  notice: 'n',
  registryDigest: 'digest',
  providers: { unit: provider, integration: provider },
  coverage: {
    unit: { [hlc.path]: { statements: '2/3', branches: '0/0', functions: '1/1', lines: '2/3' } },
    integration: { [store.path]: { statements: '2/2', branches: '0/0', functions: '1/1', lines: '2/2' } },
  },
  bundle: {},
  ...overrides,
})

const input = (overrides: Partial<EvidenceInput> = {}): EvidenceInput => ({
  registry: [hlc, store],
  digest: 'digest',
  suites: [suite],
  runs: {
    unit: run({ [hlc.path]: file(1, 1, 0) }),
    integration: run(
      { [store.path]: file(3, 1), [hlc.path]: file(1, 1, 1) },
      report({ file: 'libs/store/src/log-store-conformance.integration.test.ts', tags: ['log-store/conformance'] }),
    ),
    storybook: run({}),
  },
  lockfile: lockfile(),
  ...overrides,
})

describe('evidence', () => {
  it('holds when each owned tuple equals the lockfile and each named suite passed', () => {
    const evidence = judgeEvidence(input())
    expect(evidence.issues).toEqual([])
    expect(evidence.tuples.unit?.[hlc.path]?.statements).toBe('2/3')
  })

  it('judges a file only by its owning producer', () => {
    // integration reaches every statement of hlc.ts, but unit owns it.
    expect(judgeEvidence(input()).tuples.integration?.[hlc.path]).toBeUndefined()
  })

  it('fails a regression and an unrecorded improvement', () => {
    const regressed = judgeEvidence(input({ runs: { ...input().runs, unit: run({ [hlc.path]: file(1, 0, 0) }) } }))
    expect(regressed.issues.join('\n')).toContain('libs/datom/src/hlc.ts (unit): coverage regressed')
    const improved = judgeEvidence(input({ runs: { ...input().runs, unit: run({ [hlc.path]: file(1, 1, 1) }) } }))
    expect(improved.issues.join('\n')).toContain('coverage changed')
    expect(improved.issues.join('\n')).toContain('pnpm verify baseline')
    const uncoveredCode = judgeEvidence(
      input({ runs: { ...input().runs, unit: run({ [hlc.path]: file(1, 1, 0, 0) }) } }),
    )
    expect(uncoveredCode.issues.join('\n')).toContain('libs/datom/src/hlc.ts (unit): coverage regressed')
  })

  it('fails an owned file no test reaches, and a named suite that did not pass', () => {
    const issues = judgeEvidence(
      input({
        runs: {
          ...input().runs,
          unit: run({ [hlc.path]: file(0, 0, 0) }),
          integration: run(
            { [store.path]: file(3, 1) },
            report({ file: 'libs/store/src/x.integration.test.ts', status: 'failed', tags: ['log-store/conformance'] }),
          ),
        },
      }),
    ).issues.join('\n')
    expect(issues).toContain('libs/datom/src/hlc.ts: node-unit, owned by unit, but no unit test reaches it')
    expect(issues).toContain('names suite log-store/conformance, but no passing integration test runs it')
    expect(issues).toContain('Suite log-store/conformance is declared, but no passing test runs it')
  })

  it('treats a file with nothing Istanbul counts as an empty tuple', () => {
    const tag: RegistryEntry = { path: 'libs/a/src/tag.ts', treatment: 'node-unit', rationale: 'r' }
    const base = lockfile()
    const evidence = judgeEvidence(
      input({
        registry: [hlc, store, tag],
        lockfile: {
          ...base,
          coverage: {
            ...base.coverage,
            unit: {
              ...base.coverage.unit,
              [tag.path]: { statements: '0/0', branches: '0/0', functions: '0/0', lines: '0/0' },
            },
          },
        },
      }),
    )
    expect(evidence.issues).toEqual([])
  })

  it('checks stories, the test of a process entry, and support files', () => {
    const view: RegistryEntry = { path: 'features/a/src/View.tsx', treatment: 'rendered-ui', stories: 'features/a/src/View.stories.test.tsx', rationale: 'r' }
    const cli: RegistryEntry = { path: 'tools/a/src/cli.ts', treatment: 'process-entry', runBy: { test: 'tools/a/src/cli.test.ts' }, rationale: 'r' }
    const harness: RegistryEntry = { path: 'libs/a/src/harness.ts', treatment: 'test-support', producer: 'unit', rationale: 'r' }
    const issues = judgeEvidence(
      input({
        registry: [hlc, store, view, cli, harness],
        runs: {
          ...input().runs,
          unit: run({ [hlc.path]: file(1, 1, 0), [harness.path]: file(0) }, report({ file: 'tools/a/src/cli.test.ts', status: 'failed' })),
          storybook: run({ [view.path]: file(1) }),
        },
      }),
    ).issues.join('\n')
    expect(issues).toContain('features/a/src/View.tsx: its stories features/a/src/View.stories.test.tsx did not run in storybook')
    expect(issues).toContain('tools/a/src/cli.ts: its test tools/a/src/cli.test.ts failed 1 test(s) in unit')
    expect(issues).toContain('libs/a/src/harness.ts: test-support, owned by unit, but no unit test reaches it')
  })

  it('fails a changed registry, a changed provider, a stale entry and a missing producer', () => {
    const base = lockfile()
    const issues = judgeEvidence(
      input({
        digest: 'another',
        runs: { unit: { ...run({ [hlc.path]: file(1, 1, 0) }), provider: { ...provider, version: '6.0.0' } } },
        lockfile: {
          ...base,
          coverage: {
            ...base.coverage,
            unit: { ...base.coverage.unit, 'libs/gone.ts': { statements: '1/1', branches: '0/0', functions: '1/1', lines: '1/1' } },
          },
        },
      }),
    ).issues.join('\n')
    expect(issues).toContain('The registry changed since the lockfile was written')
    expect(issues).toContain('the lockfile has @vitest/coverage-istanbul@5.0.1')
    expect(issues).toContain('libs/gone.ts (unit): in the lockfile but no longer exactly owned by unit')
    expect(issues).toContain('The integration producer did not run in this verify run')
  })

  it('asks for a baseline when there is no lockfile', () => {
    expect(judgeEvidence(input({ lockfile: undefined })).issues).toEqual([
      'No evidence lockfile; record it with `pnpm verify baseline` after review.',
    ])
  })
})
