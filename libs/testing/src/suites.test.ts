import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from '@effect/vitest'
import { PATTERNS, SUITES, suiteTags } from './suites.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('suite catalogue', () => {
  it('names each suite <pattern>/<aspect> once, for a known pattern', () => {
    const ids = SUITES.map((suite) => suite.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const suite of SUITES) {
      expect(PATTERNS).toContain(suite.pattern)
      expect(suite.id).toBe(`${suite.pattern}/${suite.aspect}`)
    }
  })

  it('points each suite at a file that exists', () => {
    const missing = SUITES.filter((suite) => !existsSync(resolve(ROOT, suite.source)))
    expect(missing.map((suite) => suite.source)).toEqual([])
  })

  it('defines one Vitest tag per suite', () => {
    expect(suiteTags.map((tag) => tag.name)).toEqual(SUITES.map((suite) => suite.id))
  })
})
