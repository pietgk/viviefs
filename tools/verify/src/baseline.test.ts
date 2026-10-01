import { describe, expect, it } from '@effect/vitest'
import { bundleReferences, composeLockfile, unstableTuples } from './baseline.ts'
import type { Tuple } from './lockfile.ts'

const tuple = (statements: `${number}/${number}`): Tuple => ({
  statements,
  branches: '1/2',
  functions: '1/1',
  lines: statements,
})

describe('baseline', () => {
  it('accepts tuples that are the same in every run', () => {
    const run = { unit: { 'libs/a/src/a.ts': tuple('3/4') } }
    expect(unstableTuples([run, run, run])).toEqual([])
  })

  it('refuses a tuple that differs between runs, or goes missing', () => {
    const unstable = unstableTuples([
      { unit: { 'libs/a/src/a.ts': tuple('3/4'), 'libs/a/src/b.ts': tuple('1/1') } },
      { unit: { 'libs/a/src/a.ts': tuple('4/4'), 'libs/a/src/b.ts': tuple('1/1') } },
      { unit: { 'libs/a/src/a.ts': tuple('3/4') } },
    ])
    expect(unstable).toHaveLength(2)
    expect(unstable[0]).toContain('libs/a/src/a.ts (unit): run 1 statements 3/4')
    expect(unstable[1]).toContain('libs/a/src/b.ts (unit)')
    expect(unstable[1]).toContain('run 3 absent')
  })

  it('records each platform bundle and composes the lockfile', () => {
    const bundle = bundleReferences(
      [
        {
          platform: 'ios',
          hbcBytes: 10,
          budgetBytes: 100,
          overBudget: false,
          reference: { label: 'none', hbcBytes: 0, delta: 10 },
          jsBytes: 5,
          packages: { effect: 4 },
          topPackages: [],
          changes: [],
        },
      ],
      '2026-09-30',
    )
    expect(bundle).toEqual({
      ios: { recordedAt: '2026-09-30', hbcBytes: 10, jsBytes: 5, packages: { effect: 4 } },
    })
    const lockfile = composeLockfile({ digest: 'd', providers: {}, tuples: {}, bundle: { 'apps/x': bundle } })
    expect(lockfile.registryDigest).toBe('d')
    expect(lockfile.bundle['apps/x']?.ios?.hbcBytes).toBe(10)
  })
})
