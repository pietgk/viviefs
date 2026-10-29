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

const QUOTE_START = /^\s*(?:(?:[-*+]|\d+[.)])\s+)*>/
const NEW_BLOCK = /^\s*(?:[-*+]\s|\d+[.)]\s|#{1,6}\s|`{3,}|~{3,}|\||<!--|\{\/\*)/

/**
 * Which lines of a run of source lines are in a block quote, also one that
 * starts a list item (`- > ...`). A quote goes on through lazy continuation
 * lines, as Markdown reads them, until a blank line or a line that starts a
 * new block. Every block quote is another's words (D204).
 */
export const quotedLines = (lines: ReadonlyArray<string>): ReadonlyArray<boolean> => {
  let quoted = false
  return lines.map((line) => {
    if (line.trim() === '') quoted = false
    else if (QUOTE_START.test(line)) quoted = true
    else if (NEW_BLOCK.test(line)) quoted = false
    return quoted
  })
}

export type InlineItem = {
  readonly kind: 'comment' | 'code'
  readonly start: number
  readonly end: number
  /** A comment's source, or a code span's content as it renders: line breaks as spaces, trimmed. */
  readonly text: string
}

/**
 * The comments and code spans in Markdown or MDX source text, in order, with
 * where each starts and ends. Either may cross a line break; a code span ends
 * at a blank line, and a code span inside a comment is part of the comment.
 * For readers that work on the source text (`pnpm refs`, `verify`); fenced
 * code is theirs to leave out.
 */
export const inlineItems = (text: string): ReadonlyArray<InlineItem> => {
  const found: InlineItem[] = []
  for (let index = 0; index < text.length; ) {
    if (text[index] === '`') {
      const ticks = /^`+/.exec(text.slice(index))?.[0] ?? '`'
      const close = text.indexOf(ticks, index + ticks.length)
      const inner = close === -1 ? '' : text.slice(index + ticks.length, close)
      if (close === -1 || /\n[ \t]*\n/.test(inner)) {
        index += ticks.length
        continue
      }
      const end = close + ticks.length
      found.push({ kind: 'code', start: index, end, text: inner.replace(/\n/g, ' ').trim() })
      index = end
      continue
    }
    const closing = text.startsWith('<!--', index) ? '-->' : text.startsWith('{/*', index) ? '*/}' : undefined
    if (closing === undefined) {
      index += 1
      continue
    }
    const at = text.indexOf(closing, index + 3)
    const end = at === -1 ? text.length : at + closing.length
    found.push({ kind: 'comment', start: index, end, text: text.slice(index, end) })
    index = end
  }
  return found
}
