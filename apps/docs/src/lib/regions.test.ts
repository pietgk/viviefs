// Samples come from source by region (D60). A page that names a region the
// file does not have must fail the build, next to a region that is found.
import { describe, expect, it } from '@effect/vitest'
import { extractRegion, readSample } from './regions.ts'

const source = [
  "import * as Schema from 'effect/Schema'",
  '',
  'export const layer = () => {',
  '  // #region body',
  '  const a = 1',
  '  // #region inner',
  '  const b = 2',
  '  // #endregion inner',
  '  return a + b',
  '  // #endregion body',
  '}',
].join('\n')

describe('extractRegion', () => {
  it('returns the region dedented, without marker lines', () => {
    expect(extractRegion(source, 'body')).toBe(
      ['const a = 1', 'const b = 2', 'return a + b'].join('\n'),
    )
  })

  it('returns a nested region on its own', () => {
    expect(extractRegion(source, 'inner')).toBe('const b = 2')
  })

  it('fails on a region the file does not have', () => {
    expect(() => extractRegion(source, 'missing')).toThrow('No region "missing".')
  })

  it('fails on a region marked twice', () => {
    const twice = `${source}\n// #region body\n// #endregion body`
    expect(() => extractRegion(twice, 'body')).toThrow('marked 2 times')
  })

  it('fails on a region without an end', () => {
    expect(() => extractRegion('// #region open\nconst a = 1', 'open')).toThrow(
      'has no #endregion',
    )
  })

  it('fails when the end names another region', () => {
    const crossed = '// #region one\nconst a = 1\n// #endregion two'
    expect(() => extractRegion(crossed, 'one')).toThrow('closed by "#endregion two"')
  })
})

describe('readSample', () => {
  it('reads the region the first page embeds from the exemplar', () => {
    const sample = readSample('libs/datom/src/schema.ts', 'datom')
    expect(sample.lang).toBe('ts')
    expect(sample.code).toMatch(/^export const Datom = Schema\.Struct\(\{/)
    expect(sample.code).toContain('export type Datom = typeof Datom.Type')
  })

  it('names the file when its region is missing', () => {
    expect(() => readSample('libs/datom/src/schema.ts', 'missing')).toThrow(
      'Sample libs/datom/src/schema.ts: No region "missing".',
    )
  })
})
