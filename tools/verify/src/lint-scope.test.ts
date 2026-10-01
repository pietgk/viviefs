import { describe, expect, it } from '@effect/vitest'
import { judgeLintScope } from './lint-scope.ts'

describe('lint scope', () => {
  it('passes when every source file is linted', () => {
    const scope = judgeLintScope([
      { path: 'libs/a/src/a.ts', covered: true },
      { path: 'assets/logo.png', covered: false },
    ])
    expect(scope).toEqual({ problems: [], linted: 1, sources: 1 })
  })

  it('fails a source file no configuration covers', () => {
    const scope = judgeLintScope([{ path: 'hidden/unseen.ts', covered: false }])
    expect(scope.problems.join()).toContain('hidden/unseen.ts')
  })

  it('excuses vendored trees, and fails an excuse that is no longer needed', () => {
    expect(judgeLintScope([{ path: 'repos/effect/x.ts', covered: false }]).problems).toEqual([])
    expect(
      judgeLintScope([{ path: '.agents/skills/x.ts', covered: true }]).problems.join(),
    ).toContain('the excuse is stale')
  })

  it('fails an extension that encodes a module system', () => {
    expect(
      judgeLintScope([{ path: 'tools/x/y.mjs', covered: true }]).problems.join(),
    ).toContain('encode a module system')
  })
})
