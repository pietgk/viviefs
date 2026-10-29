import { describe, expect, it } from '@effect/vitest'
import { evidenceRegistryDigest, sameTuple, stableJson, tupleOf } from './lockfile.ts'

describe('lockfile', () => {
  it('counts covered and total statements, branches, functions and lines', () => {
    const tuple = tupleOf({
      statementMap: { '0': { start: { line: 1 } }, '1': { start: { line: 1 } }, '2': { start: { line: 2 } } },
      s: { '0': 0, '1': 3, '2': 0 },
      f: { '0': 1, '1': 0 },
      b: { '0': [1, 0] },
    })
    expect(tuple).toEqual({ statements: '1/3', branches: '1/2', functions: '1/2', lines: '1/2' })
    expect(sameTuple(tuple, { ...tuple })).toBe(true)
    expect(sameTuple(tuple, { ...tuple, lines: '2/2' })).toBe(false)
  })

  it('writes keys in a stable order and digests the evidence registry by path', () => {
    expect(stableJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}\n')
    const one = { path: 'b', treatment: 'node-unit', rationale: 'r' } as const
    const two = { path: 'a', treatment: 'node-unit', rationale: 'r' } as const
    expect(evidenceRegistryDigest([one, two])).toBe(evidenceRegistryDigest([two, one]))
    expect(evidenceRegistryDigest([one])).not.toBe(evidenceRegistryDigest([{ ...one, rationale: 'other' }]))
  })
})
