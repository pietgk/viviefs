import { describe, expect, it } from '@effect/vitest'
import { diffText, lineDiff } from './line-diff.ts'

describe('the change from problem to solution', () => {
  it('keeps the lines both have, and marks what was removed and added', () => {
    expect(lineDiff('a\nb\nc\n', 'a\nx\nc\n')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'x' },
      { kind: 'same', text: 'c' },
    ])
  })

  it('handles lines added at the end and removed at the start', () => {
    expect(diffText(lineDiff('a\nb', 'b\nc'))).toBe('-a\n b\n+c')
  })

  it('shows nothing changed for the same file', () => {
    expect(lineDiff('a\nb', 'a\nb').every(({ kind }) => kind === 'same')).toBe(true)
  })
})
