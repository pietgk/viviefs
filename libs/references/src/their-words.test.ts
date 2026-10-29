// Passages in another project's words (D204): the marker a comment is, and
// the pairing every reader of a document (the site, `pnpm refs`, `verify`)
// applies to it the same way.
import { describe, expect, it } from '@effect/vitest'
import { isQuotedLine, theirWords, theirWordsMarker } from './their-words.ts'

describe('their-words markers', () => {
  it('reads an opening marker with whose words they are, in Markdown and in MDX', () => {
    expect(theirWordsMarker('<!-- their words: archify -->')).toEqual({ kind: 'open', whose: 'archify' })
    expect(theirWordsMarker('{/* their words: vivief */}')).toEqual({ kind: 'open', whose: 'vivief' })
    expect(theirWordsMarker('/* their words: Matt Pocock */')).toEqual({ kind: 'open', whose: 'Matt Pocock' })
  })

  it('reads a closing marker in both forms', () => {
    expect(theirWordsMarker('<!-- /their words -->')).toEqual({ kind: 'close' })
    expect(theirWordsMarker('{/* /their words */}')).toEqual({ kind: 'close' })
    expect(theirWordsMarker('/* /their words */')).toEqual({ kind: 'close' })
  })

  it('reads an opening marker without a name as one, so the pairing can say what is missing', () => {
    expect(theirWordsMarker('<!-- their words -->')).toEqual({ kind: 'open', whose: '' })
  })

  it('leaves every other comment alone', () => {
    expect(theirWordsMarker('<!-- References: written by pnpm refs fix; do not edit by hand. -->')).toBeUndefined()
    expect(theirWordsMarker('<!-- in their words, roughly -->')).toBeUndefined()
    expect(theirWordsMarker('{/* a note */}')).toBeUndefined()
  })
})

describe('their-words pairing', () => {
  it('is inside from an opening marker to its closing marker', () => {
    const marks = theirWords()
    expect(marks.inside()).toBe(false)
    expect(marks.read('<!-- their words: archify -->')).toBeUndefined()
    expect(marks.inside()).toBe(true)
    expect(marks.read('<!-- a note -->')).toBeUndefined()
    expect(marks.inside()).toBe(true)
    expect(marks.read('<!-- /their words -->')).toBeUndefined()
    expect(marks.inside()).toBe(false)
    expect(marks.end()).toBeUndefined()
  })

  it('names whose words a mark holds', () => {
    expect(theirWords().read('<!-- their words -->')).toMatch(/names whose words they are/)
  })

  it('fails a mark opened inside another, a stray close and a mark left open', () => {
    const nested = theirWords()
    nested.read('<!-- their words: a -->')
    expect(nested.read('<!-- their words: b -->')).toMatch(/opened inside another/)
    expect(theirWords().read('<!-- /their words -->')).toMatch(/closes no open mark/)
    const open = theirWords()
    open.read('{/* their words: vivief */}')
    expect(open.end()).toMatch(/not closed/)
  })
})

describe('block quotes', () => {
  it('knows a quoted line, also inside a list item', () => {
    expect(isQuotedLine('> We will be spending a lot more time')).toBe(true)
    expect(isQuotedLine('    > My hot take')).toBe(true)
    expect(isQuotedLine('A line with > in it')).toBe(false)
  })
})
