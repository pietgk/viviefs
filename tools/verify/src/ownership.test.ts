import { describe, expect, it } from '@effect/vitest'
import { REGISTRY } from './evidence-registry.ts'
import type { RegistryEntry } from './file-treatments.ts'
import { isProductionFile, projectProblems, registryProblems, type RegistryContext } from './ownership.ts'

const context = (overrides: Partial<RegistryContext> & { files?: Record<string, string> } = {}): RegistryContext => {
  const files = overrides.files ?? {}
  return {
    productionFiles: Object.keys(files).filter(isProductionFile),
    source: (path) => files[path],
    gates: ['P01', 'P04'],
    suites: ['log-store/conformance'],
    stepRuns: (step, path) => step === 'ownership' && path === 'tools/verify/src/check-ownership.ts',
    projectTargets: () => ['build'],
    ...overrides,
  }
}

const unit = (path: string): RegistryEntry => ({ path, treatment: 'node-unit', rationale: 'pure' })

describe('production files', () => {
  it('are source under apps, features, libs and tools, minus evidence', () => {
    expect(isProductionFile('libs/datom/src/hlc.ts')).toBe(true)
    expect(isProductionFile('apps/evidence-mobile/metro.config.js')).toBe(true)
    expect(isProductionFile('libs/datom/src/hlc.test.ts')).toBe(false)
    expect(isProductionFile('libs/a/src/x.integration.test.ts')).toBe(false)
    expect(isProductionFile('features/c/src/X.stories.test.tsx')).toBe(false)
    expect(isProductionFile('libs/datom/vitest.integration.config.ts')).toBe(false)
    expect(isProductionFile('docs/adr/0001.md')).toBe(false)
    expect(isProductionFile('repos/effect/src/x.ts')).toBe(false)
  })
})

describe('projects', () => {
  it('fail without a kind tag, or with a per-project evidence owner', () => {
    const problems = projectProblems(
      [
        { path: 'libs/a/project.json', parsed: { tags: ['layer:core'] } },
        { path: 'libs/b/project.json', parsed: { tags: ['kind:lib'], metadata: { evidenceOwner: 'unit' } } },
      ],
      [],
    )
    expect(problems.join('\n')).toContain('libs/a/project.json has no kind: tag')
    expect(problems.join('\n')).toContain('libs/b/project.json declares metadata.evidenceOwner')
  })

  it('fail a workspace package without a project.json', () => {
    expect(
      projectProblems([{ path: 'libs/a/project.json', parsed: { tags: ['kind:lib'] } }], ['libs/stray/package.json']),
    ).toEqual(['libs/stray/package.json has no sibling project.json. Every workspace package must declare tags.'])
  })
})

describe('the registry', () => {
  it('fails an unclassified file, a stale entry and a duplicate', () => {
    const problems = registryProblems(
      [unit('libs/a/src/gone.ts'), unit('libs/a/src/twice.ts'), unit('libs/a/src/twice.ts')],
      context({ files: { 'libs/a/src/new.ts': 'export const a = 1', 'libs/a/src/twice.ts': 'export const b = 1' } }),
    ).join('\n')
    expect(problems).toContain('libs/a/src/new.ts: no registry entry')
    expect(problems).toContain('libs/a/src/gone.ts: registry entry has no production file')
    expect(problems).toContain('libs/a/src/twice.ts: 2 registry entries')
  })

  it('fails an empty rationale', () => {
    expect(
      registryProblems(
        [{ path: 'libs/a/src/a.ts', treatment: 'node-unit', rationale: ' ' }],
        context({ files: { 'libs/a/src/a.ts': 'export const a = 1' } }),
      ),
    ).toEqual(['libs/a/src/a.ts: a rationale is required'])
  })

  it('checks each shape its file treatment claims', () => {
    const files = {
      'libs/a/src/index.ts': "export { a } from './a.ts'\nexport const b = 1\n",
      'libs/a/src/slot.ts': 'export const c = 1\n',
      'libs/a/src/types.ts': 'export const d = 1\n',
      'libs/a/src/run.ts': 'x()\n',
      'libs/a/src/device.ts': 'x()\n',
      'libs/a/src/suite.ts': 'x()\n',
      'libs/a/src/entry.ts': 'x()\n',
    }
    const problems = registryProblems(
      [
        { path: 'libs/a/src/index.ts', treatment: 're-export', rationale: 'r' },
        { path: 'libs/a/src/slot.ts', treatment: 'named-slot', rationale: 'r' },
        { path: 'libs/a/src/types.ts', treatment: 'type-only', rationale: 'r' },
        { path: 'libs/a/src/run.ts', treatment: 'process-entry', runBy: { step: 'unit' }, rationale: 'r' },
        { path: 'libs/a/src/device.ts', treatment: 'device', gate: 'P99', rationale: 'r' },
        { path: 'libs/a/src/suite.ts', treatment: 'node-unit', suites: ['sync/protocol'], rationale: 'r' },
        { path: 'libs/a/src/entry.ts', treatment: 'process-entry', runBy: { test: 'libs/a/src/missing.test.ts' }, rationale: 'r' },
      ],
      context({ files }),
    ).join('\n')
    expect(problems).toContain('index.ts: re-export')
    expect(problems).toContain('slot.ts: named-slot')
    expect(problems).toContain('types.ts: type-only')
    expect(problems).toContain('run.ts: process-entry names verify step unit, which does not run it')
    expect(problems).toContain('device.ts: device names gate P99')
    expect(problems).toContain('suite.ts: node-unit names unknown suites sync/protocol')
    expect(problems).toContain('entry.ts: process-entry names test libs/a/src/missing.test.ts')
  })

  it('accepts shapes that match', () => {
    const files = {
      'libs/a/src/index.ts': "/** entry */\nexport { a } from './a.ts'\nexport type { B } from './b.ts'\n",
      'libs/a/src/slot.ts': '/** Named slot. */\nexport {}\n',
      'libs/a/src/types.ts': "import type { X } from './x.ts'\nexport type Y = X\nexport interface Z { y: Y }\n",
      'tools/verify/src/check-ownership.ts': 'x()\n',
    }
    expect(
      registryProblems(
        [
          { path: 'libs/a/src/index.ts', treatment: 're-export', rationale: 'r' },
          { path: 'libs/a/src/slot.ts', treatment: 'named-slot', rationale: 'r' },
          { path: 'libs/a/src/types.ts', treatment: 'type-only', rationale: 'r' },
          { path: 'tools/verify/src/check-ownership.ts', treatment: 'process-entry', runBy: { step: 'ownership' }, rationale: 'r' },
        ],
        context({ files }),
      ),
    ).toEqual([])
  })

  it('gives every entry of the real registry a rationale', () => {
    expect(REGISTRY.filter((entry) => entry.rationale.trim() === '')).toEqual([])
  })
})
