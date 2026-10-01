import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from '@effect/vitest'
import { loadRuns, readLockfile } from './evidence-artifacts.ts'

const write = (root: string, path: string, value: unknown) => {
  mkdirSync(join(root, path, '..'), { recursive: true })
  writeFileSync(join(root, path), JSON.stringify(value))
}

describe('evidence artifacts', () => {
  it('reads only the producers of the requested run, with repository-relative paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'viviefs-evidence-'))
    try {
      write(root, 'node_modules/@vitest/coverage-istanbul/package.json', { name: '@vitest/coverage-istanbul', version: '5.0.1' })
      write(root, '.artifacts/verify/unit/run.json', { producer: 'unit', run: 'this' })
      write(root, '.artifacts/verify/unit/report.json', { testResults: [] })
      write(root, '.artifacts/verify/unit/coverage/coverage-final.json', {
        [join(root, 'libs/a/src/a.ts')]: { statementMap: {}, s: {}, f: {}, b: {} },
      })
      write(root, '.artifacts/verify/integration/run.json', { producer: 'integration', run: 'earlier' })
      const runs = loadRuns('this', root)
      expect(Object.keys(runs)).toEqual(['unit'])
      expect(Object.keys(runs.unit?.coverage ?? {})).toEqual(['libs/a/src/a.ts'])
      expect(runs.unit?.provider).toEqual({ name: 'istanbul', package: '@vitest/coverage-istanbul', version: '5.0.1' })
      expect(readLockfile(root)).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
