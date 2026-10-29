// Passages in another project's words (D204): the marker a comment is, and
// the pairing every reader of a document (the site, `pnpm refs`, `verify`)
// applies to it the same way.
import { describe, expect, it } from '@effect/vitest'
import { inlineItems, quotedLines, theirWords, theirWordsMarker } from './their-words.ts'

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
  it('knows a quoted line, also one that starts a list item or sits inside one', () => {
    expect(quotedLines(['> We will be spending', '    > My hot take', '- > Pinot answers', '1. > A quote', '', 'A line with > in it'])).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ])
  })

  it('keeps a quote through its lazy continuation lines, until a blank line or a new block', () => {
    expect(quotedLines(['> Pinot answers', 'in 10ms P95.', '', 'Ours again.'])).toEqual([true, true, false, false])
    expect(quotedLines(['> A quote', '- a list item', '# A heading'])).toEqual([true, false, false])
    expect(quotedLines(['> Their text.', '***', 'Our D107.'])).toEqual([true, false, false])
    expect(quotedLines(['> Their text.', '---', 'Ours.', '> Theirs.', '_ _ _'])).toEqual([true, false, false, true, false])
  })
})

describe('comments and code spans in source text', () => {
  it('finds both in order, with where each starts and ends', () => {
    const text = 'A `node` <!-- their words: x --> and {/* /their words */}.'
    expect(inlineItems(text).map(({ kind, start }) => [kind, start])).toEqual([
      ['code', 2],
      ['comment', 9],
      ['comment', 37],
    ])
    expect(inlineItems('`node`')[0]).toEqual({ kind: 'code', start: 0, end: 6, text: 'node' })
  })

  it('reads a comment or a code span across a line break, as Markdown does', () => {
    expect(inlineItems('<!-- their words: vivief\n-->')).toEqual([
      { kind: 'comment', start: 0, end: 28, text: '<!-- their words: vivief\n-->' },
    ])
    expect(inlineItems('A `\nnode\n` here.')).toEqual([{ kind: 'code', start: 2, end: 10, text: 'node' }])
  })

  it('finds no code span inside a comment, nor one a blank line breaks', () => {
    expect(inlineItems('<!-- a `node` note -->').map(({ kind }) => kind)).toEqual(['comment'])
    expect(inlineItems('A `node\n\nnode` here.')).toEqual([])
  })
})
