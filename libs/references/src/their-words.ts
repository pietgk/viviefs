/**
 * Passages in another project's words (D204): a block quote, or the text
 * between `<!-- their words: whose -->` and `<!-- /their words -->` (in MDX,
 * `{/* their words: whose *\/}` and `{/* /their words *\/}`), around a
 * passage, a table or a phrase. Inside one, nothing is resolved against this
 * repository: no glossary term links, a bare id stays text, a path in code
 * font is not checked, and a retired word is not failed. A reference-style
 * link still resolves, since only we write those. The site, `pnpm refs` and
 * `verify` read the markers with this module, so they agree on what is marked.
 */

export type TheirWordsMarker = { readonly kind: 'open'; readonly whose: string } | { readonly kind: 'close' }

const CLOSE = '<!-- /their words -->'

/**
 * The marker a comment is: its source (`<!-- ... -->`, `{/* ... *\/}`) or an
 * MDX expression's value (`/* ... *\/`). Undefined for any other comment. An
 * opening marker without a name is still one, so the pairing can say so.
 */
export const theirWordsMarker = (comment: string): TheirWordsMarker | undefined => {
  const body = /^\s*(?:<!--([\s\S]*?)-->|\{?\s*\/\*([\s\S]*?)\*\/\s*\}?)\s*$/.exec(comment)
  const text = (body?.[1] ?? body?.[2])?.trim()
  if (text === undefined) return undefined
  if (text === '/their words') return { kind: 'close' }
  const open = /^their words(?:\s*:\s*(.*))?$/.exec(text)
  return open === null ? undefined : { kind: 'open', whose: open[1]?.trim() ?? '' }
}

export type TheirWords = {
  /** Reads a comment in document order; returns the problem when it breaks the pairing. */
  readonly read: (comment: string) => string | undefined
  /** Whether the text read next is inside a mark. */
  readonly inside: () => boolean
  /** The problem when a mark is still open at the end of the document. */
  readonly end: () => string | undefined
}

/** The pairing of their-words markers over one document: one mark at a time, each closed. */
export const theirWords = (): TheirWords => {
  let open = false
  return {
    read: (comment) => {
      const marker = theirWordsMarker(comment)
      if (marker === undefined) return undefined
      if (marker.kind === 'close') {
        if (!open) return `${CLOSE} closes no open mark (D204)`
        open = false
        return undefined
      }
      if (open) return `a "their words" mark opened inside another; close the first with ${CLOSE} (D204)`
      open = true
      if (marker.whose === '') return 'a "their words" mark names whose words they are: <!-- their words: vivief --> (D204)'
      return undefined
    },
    inside: () => open,
    end: () => (open ? `a "their words" mark is not closed; end it with ${CLOSE} (D204)` : undefined),
  }
}

/** A line of a block quote, also inside a list item. Every block quote is another's words (D204). */
export const isQuotedLine = (line: string): boolean => /^\s*>/.test(line)

/**
 * The comments in a line of Markdown or MDX source, in order, with where each
 * starts and ends, outside inline code. For readers that work on the source
 * text (`pnpm refs`, `verify`).
 */
export const commentsIn = (text: string): ReadonlyArray<{ readonly start: number; readonly end: number; readonly comment: string }> => {
  const found: Array<{ readonly start: number; readonly end: number; readonly comment: string }> = []
  for (let index = 0; index < text.length; ) {
    if (text[index] === '`') {
      const ticks = /^`+/.exec(text.slice(index))?.[0] ?? '`'
      const close = text.indexOf(ticks, index + ticks.length)
      index = close === -1 ? index + ticks.length : close + ticks.length
      continue
    }
    const closing = text.startsWith('<!--', index) ? '-->' : text.startsWith('{/*', index) ? '*/}' : undefined
    if (closing === undefined) {
      index += 1
      continue
    }
    const at = text.indexOf(closing, index + 3)
    const end = at === -1 ? text.length : at + closing.length
    found.push({ start: index, end, comment: text.slice(index, end) })
    index = end
  }
  return found
}
