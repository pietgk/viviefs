import { describe, expect, it } from '@effect/vitest'
import { bytesPerPackage, bytesPerSource, decodeVlq, packageOf } from './bundle-report.ts'
import { formatReport, reportPlatform } from './bundle-size.ts'

describe('bundle attribution', () => {
  it('decodes base64 VLQ segments', () => {
    expect(decodeVlq('AAAA')).toEqual([0, 0, 0, 0])
    expect(decodeVlq('CAAC')).toEqual([1, 0, 0, 1])
    expect(decodeVlq('D')).toEqual([-1])
    expect(decodeVlq('gB')).toEqual([16])
  })

  it('names the package of a source path', () => {
    expect(packageOf('node_modules/.pnpm/effect@4.0.0/node_modules/effect/dist/Effect.js')).toBe('effect')
    expect(packageOf('/x/node_modules/@noble/hashes/sha2.js')).toBe('@noble/hashes')
    expect(packageOf('libs/datom/src/log-store.ts')).toBe('workspace:libs/datom')
    expect(packageOf('libs/sync/client/src/client.ts')).toBe('workspace:libs/sync/client')
    expect(packageOf('features/evidence/model/src/command.ts')).toBe('workspace:features/evidence/model')
    expect(packageOf('__prelude__')).toBe('__prelude__')
  })

  // "aaaa;bbb": segment 0 starts source a at column 0, segment 1 starts
  // source b at column 2 (sources index +1); line 2 continues source b.
  const code = 'aaaa\nbbb'
  const basic = { sources: ['a.js', 'b.js'], mappings: 'AAAA,ECAA;AAAA' }

  it('attributes every byte of a basic map, the newline to the segment before it', () => {
    const totals = bytesPerSource(code, basic)
    expect(Object.fromEntries(totals)).toEqual({ 'a.js': 2, 'b.js': 6 })
    expect([...totals.values()].reduce((sum, bytes) => sum + bytes, 0)).toBe(code.length)
  })

  it('attributes an indexed map section by section', () => {
    const indexed = {
      sections: [
        { offset: { line: 0, column: 0 }, map: { sources: ['a.js'], mappings: 'AAAA' } },
        { offset: { line: 1, column: 0 }, map: { sources: ['node_modules/b/i.js'], mappings: 'AAAA' } },
      ],
    }
    const shares = bytesPerPackage(bytesPerSource(code, indexed))
    expect(shares).toEqual([
      { name: 'a.js', bytes: 5 },
      { name: 'b', bytes: 3 },
    ])
  })
})

describe('bundle-size gate', () => {
  const budget = {
    budgetBytes: 1000,
    references: {
      ios: { label: 'ref', commit: 'abc', recordedAt: '2026-09-27', hbcBytes: 600, jsBytes: 8, packages: { 'a.js': 8 } },
    },
  }
  const js = { code: 'aaaa\nbbb', map: { sources: ['a.js', 'b.js'], mappings: 'AAAA,ECAA;AAAA' } }

  it('passes under the budget and reports the change against the reference', () => {
    const report = reportPlatform('ios', 900, js, budget)
    expect(report.overBudget).toBe(false)
    expect(report.reference.delta).toBe(300)
    expect(report.changes).toEqual([])
    expect(formatReport(report)).toContain('vs ref (abc, 2026-09-27)')
  })

  it('fails over the budget', () => {
    const report = reportPlatform('ios', 1001, js, budget)
    expect(report.overBudget).toBe(true)
    expect(formatReport(report)).toContain('OVER BUDGET')
  })
})
