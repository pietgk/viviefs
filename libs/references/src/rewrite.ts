/**
 * `pnpm refs fix` (D86'): bare ids become reference-style links, the first
 * mention in each paragraph or table cell carrying the name. Code, headings,
 * frontmatter and existing non-reference links stay as written. Running it
 * twice changes nothing; `verify` fails when a file in scope is not that text.
 */
import { posix } from 'node:path'
import {
  DECISION_LOG,
  decisionAnchor,
  findReferenceTokens,
  GATE_TABLE_DOC,
  resolveKey,
  type Catalog,
  type Token,
} from './catalog.ts'
import { isQuotedLine, theirWords, type TheirWords } from './their-words.ts'

export const REFERENCES_MARKER = '<!-- References: written by pnpm refs fix; do not edit by hand. -->'

/** MDX parses `<!--` as JSX, so a guide uses a JSX comment for the same block. */
export const MDX_REFERENCES_MARKER = '{/* References: written by pnpm refs fix; do not edit by hand. */}'

const REFERENCES_MARKERS = [REFERENCES_MARKER, MDX_REFERENCES_MARKER]

/** Living documents (D86'). Dated records, inventory rows and vendored skills are not. */
export const inReferenceScope = (path: string): boolean => {
  if (path.startsWith('docs/plan/vivief-inventory/rows/')) return false
  if (path === 'GLOSSARY.md' || path === 'AGENTS.md') return true
  if (/^docs\/adr\/.+\.md$/.test(path)) return true
  if (/^docs\/issues\/.+\.md$/.test(path)) return true
  if (/^docs\/plan\/.+\.md$/.test(path)) return true
  if (/^apps\/docs\/src\/content\/docs\/guides\/.+\.mdx$/.test(path)) return true
  if (/^apps\/docs\/src\/guide-template\/.+\.mdx$/.test(path)) return true
  if (/^\.agents\/skills\/scaffold-exercises\/.+\.md$/.test(path)) return true
  return false
}

export type Rewrite = {
  readonly text: string
  readonly problems: ReadonlyArray<string>
}

const ID_KEY = /^(?:P\d\d|ADR-\d{4}|D\d{1,3}'*|I\d{1,4})$/
const RANGE_KEY = /^(P\d\d|D\d{1,3}'*)-(P\d\d|D\d{1,3}'*)$/

const isIdKey = (key: string) => ID_KEY.test(key)
const isRangeKey = (key: string) => RANGE_KEY.test(key)

/** A path relative to the file, or `#anchor` when the link stays on this file. */
export const referenceHref = (fromFile: string, path: string, anchor: string): string => {
  const hash = anchor === '' ? '' : `#${anchor}`
  if (fromFile === path && hash !== '') return hash
  return `${posix.relative(posix.dirname(fromFile), path)}${hash}`
}

const markerAt = (source: string): { readonly at: number; readonly marker: string } | undefined => {
  let found: { readonly at: number; readonly marker: string } | undefined
  for (const marker of REFERENCES_MARKERS) {
    const at = source.lastIndexOf(marker)
    if (at !== -1 && (found === undefined || at > found.at)) found = { at, marker }
  }
  return found
}

const isDefinitionsTail = (source: string, at: number, marker: string): boolean => {
  if (at > 0 && source[at - 1] !== '\n') return false
  const rest = source.slice(at + marker.length)
  return rest.split('\n').every((line) => line.trim() === '' || /^\[[^\]]+\]: \S/.test(line))
}

const DEFINITION = /^\[[^\]]+\]: \S/

/**
 * Drops a generated block that is not at the end, such as one left above a
 * comment appended after it; the fix writes one block at the end again.
 * Fenced code keeps its text.
 */
const stripInnerBlocks = (source: string): string => {
  const lines = source.split('\n')
  const kept: string[] = []
  let fence: string | undefined
  let skipUntil = 0
  for (const [index, line] of lines.entries()) {
    if (index < skipUntil) continue
    const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence === undefined && opener !== undefined) fence = opener
    else if (fence !== undefined && line.trim().startsWith(fence)) fence = undefined
    else if (fence === undefined && (REFERENCES_MARKERS as ReadonlyArray<string>).includes(line.trim())) {
      const rest = lines.slice(index + 1)
      const length = rest.findIndex((next) => next.trim() !== '' && !DEFINITION.test(next))
      if (length > 0 && rest.slice(0, length).some((next) => DEFINITION.test(next))) {
        while (kept.at(-1)?.trim() === '') kept.pop()
        if (kept.length > 0) kept.push('')
        skipUntil = index + 1 + length
        continue
      }
    }
    kept.push(line)
  }
  return kept.join('\n')
}

/** Drops a generated definitions block. A mention of the marker in prose stays. */
const stripBlock = (source: string): string => {
  let text = stripInnerBlocks(source)
  for (;;) {
    const found = markerAt(text)
    if (found === undefined || !isDefinitionsTail(text, found.at, found.marker)) return text
    text = `${text.slice(0, found.at).replace(/\s*$/, '')}\n`
  }
}

const splitFrontmatter = (source: string): { readonly frontmatter: string; readonly body: string } => {
  const match = /^---\n[\s\S]*?\n---\n/.exec(source)
  if (match?.[0] === undefined) return { frontmatter: '', body: source }
  return { frontmatter: match[0], body: source.slice(match[0].length) }
}

type Note = (problem: string) => void

type Scope = {
  readonly namedIds: Set<string>
  readonly namedRanges: Set<string>
  readonly used: Set<string>
  readonly note: Note
  readonly catalog: Catalog
  /** The their-words marks read so far in the document (D204). */
  readonly marks: TheirWords
  /** Whether the text is a block quote, another's words (D204). */
  readonly quoted: boolean
}

type Shared = Pick<Scope, 'used' | 'note' | 'catalog' | 'marks'>

const linkFor = (label: string, key: string): string => `[${label}][${key}]`

const mentionId = (scope: Scope, id: string, original: string): string => {
  const reference = scope.catalog.references.get(id)
  if (reference === undefined) {
    scope.note(`"${id}" is not a known gate, ADR, decision or issue`)
    return original
  }
  const named = scope.namedIds.has(id)
  scope.namedIds.add(id)
  scope.used.add(id)
  return linkFor(named ? id : reference.label, id)
}

const mentionRange = (scope: Scope, from: string, to: string): string => {
  const section = scope.catalog.sections.find((item) => item.from === from && item.to === to)
  if (section !== undefined) {
    const key = `${from}-${to}`
    const named = scope.namedRanges.has(key)
    scope.namedRanges.add(key)
    scope.used.add(key)
    return linkFor(named ? key : `${key} ${section.heading}`, key)
  }
  return `${mentionId(scope, from, from)}-${mentionId(scope, to, to)}`
}

const readBracket = (text: string, start: number): { readonly inner: string; readonly end: number } | undefined => {
  if (text[start] !== '[') return undefined
  let depth = 1
  for (let index = start + 1; index < text.length; index++) {
    const char = text[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (char === '[') depth += 1
    if (char === ']') {
      depth -= 1
      if (depth === 0) return { inner: text.slice(start + 1, index), end: index + 1 }
    }
  }
  return undefined
}

const skipDestination = (text: string, start: number): number | undefined => {
  if (text[start] !== '(') return undefined
  if (text[start + 1] === '<') {
    const close = text.indexOf('>', start + 2)
    return close !== -1 && text[close + 1] === ')' ? close + 2 : undefined
  }
  let depth = 1
  for (let index = start + 1; index < text.length; index++) {
    const char = text[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (char === '(') depth += 1
    if (char === ')') {
      depth -= 1
      if (depth === 0) return index + 1
    }
  }
  return undefined
}

type Read =
  | { readonly kind: 'skip'; readonly end: number }
  | { readonly kind: 'ref'; readonly end: number; readonly key: string }

/** An inline link or image to leave, or a reference link this tool owns. */
const readLink = (text: string, start: number): Read | undefined => {
  const image = text.startsWith('![', start)
  const at = image ? start + 1 : start
  if (text[at] !== '[') return undefined
  const label = readBracket(text, at)
  if (label === undefined) return undefined
  if (text[label.end] === '(') {
    const end = skipDestination(text, label.end)
    return end === undefined ? undefined : { kind: 'skip', end }
  }
  if (text[label.end] === '[') {
    const ref = readBracket(text, label.end)
    if (ref === undefined) return undefined
    if (!image && (isIdKey(ref.inner) || isRangeKey(ref.inner))) return { kind: 'ref', end: ref.end, key: ref.inner }
    return { kind: 'skip', end: ref.end }
  }
  if (text[label.end] === ':') {
    const lineEnd = text.indexOf('\n', start)
    return { kind: 'skip', end: lineEnd === -1 ? text.length : lineEnd }
  }
  if (!image && (isIdKey(label.inner) || isRangeKey(label.inner))) return { kind: 'ref', end: label.end, key: label.inner }
  return { kind: 'skip', end: label.end }
}

const tokenAt = (text: string, index: number): Token | undefined => {
  const char = text[index]
  if (char !== 'P' && char !== 'A' && char !== 'D' && char !== 'I') return undefined
  if (index > 0 && /[\w']/.test(text[index - 1] ?? '')) return undefined
  const token = findReferenceTokens(text.slice(index))[0]
  return token?.start === 0 ? token : undefined
}

const rewriteInline = (text: string, scope: Scope): string => {
  let out = ''
  for (let index = 0; index < text.length; ) {
    const closing = text.startsWith('<!--', index) ? '-->' : text.startsWith('{/*', index) ? '*/}' : undefined
    if (closing !== undefined) {
      const end = text.indexOf(closing, index + 3)
      const to = end === -1 ? text.length : end + closing.length
      const problem = scope.marks.read(text.slice(index, to))
      if (problem !== undefined) scope.note(problem)
      out += text.slice(index, to)
      index = to
      continue
    }
    if (text[index] === '`') {
      const ticks = /^`+/.exec(text.slice(index))?.[0] ?? '`'
      const close = text.indexOf(ticks, index + ticks.length)
      const to = close === -1 ? index + ticks.length : close + ticks.length
      out += text.slice(index, to)
      index = to
      continue
    }
    if (text[index] === '<' && /[A-Za-z/!]/.test(text[index + 1] ?? '')) {
      const end = text.indexOf('>', index + 1)
      const to = end === -1 ? index + 1 : end + 1
      out += text.slice(index, to)
      index = to
      continue
    }
    const link = text[index] === '[' || text.startsWith('![', index) ? readLink(text, index) : undefined
    if (link?.kind === 'skip') {
      out += text.slice(index, link.end)
      index = link.end
      continue
    }
    if (link?.kind === 'ref') {
      const range = RANGE_KEY.exec(link.key)
      out +=
        range?.[1] !== undefined && range[2] !== undefined
          ? mentionRange(scope, range[1], range[2])
          : mentionId(scope, link.key, text.slice(index, link.end))
      index = link.end
      continue
    }
    const token = tokenAt(text, index)
    // In another project's words an id is theirs, kept as written (D204).
    if (token !== undefined && (scope.quoted || scope.marks.inside())) {
      out += text.slice(index, index + token.end)
      index += token.end
      continue
    }
    if (token?.kind === 'range') {
      out += mentionRange(scope, token.from, token.to)
      index += token.end
      continue
    }
    if (token?.kind === 'id') {
      out += mentionId(scope, token.id, text.slice(index, index + token.end))
      index += token.end
      continue
    }
    out += text[index]
    index += 1
  }
  return out
}

const freshScope = (shared: Shared, quoted = false): Scope => ({
  namedIds: new Set(),
  namedRanges: new Set(),
  quoted,
  ...shared,
})

const splitRow = (row: string): string[] => {
  const parts: string[] = []
  let current = ''
  for (let index = 0; index < row.length; index++) {
    if (row[index] === '\\' && row[index + 1] === '|') {
      current += '\\|'
      index += 1
      continue
    }
    if (row[index] === '|') {
      parts.push(current)
      current = ''
      continue
    }
    current += row[index]
  }
  parts.push(current)
  return parts
}

const placeDecisionAnchor = (cell: string, rewrite: (cell: string) => string): string => {
  const id = /^\s*(?:<a id="[^"]*"><\/a>)?(D\d+'*)\s*$/.exec(cell)?.[1]
  return id === undefined ? rewrite(cell) : ` <a id="${decisionAnchor(id)}"></a>${id} `
}

const placeGateAnchor = (cell: string, rewrite: (cell: string) => string): string => {
  const match = /^(\s*)(?:<a id="[^"]*"><\/a>)?(\*\*(P\d\d)\*\*[\s\S]*)$/.exec(cell)
  const lead = match?.[1]
  const rest = match?.[2]
  const id = match?.[3]
  return lead === undefined || rest === undefined || id === undefined
    ? rewrite(cell)
    : `${lead}<a id="${id.toLowerCase()}"></a>${rest}`
}

const rewriteRow = (row: string, file: string, shared: Shared): string => {
  const parts = splitRow(row)
  return parts
    .map((part, index) => {
      if (index === 0 || index === parts.length - 1) return part
      const rewrite = (cell: string) => rewriteInline(cell, freshScope(shared))
      if (index === 1 && file === DECISION_LOG) return placeDecisionAnchor(part, rewrite)
      if (index === 1 && file === GATE_TABLE_DOC) return placeGateAnchor(part, rewrite)
      return rewrite(part)
    })
    .join('|')
}

const sectionAnchor = (line: string, file: string, catalog: Catalog): string | undefined => {
  if (file !== DECISION_LOG) return undefined
  const title = /^## (.+)$/.exec(line)?.[1]
  if (title === undefined) return undefined
  const heading = title.replace(/ \(\d{4}-\d{2}-\d{2}\)$/, '')
  const section = catalog.sections.find((item) => item.heading === heading)
  return section === undefined ? undefined : `<a id="${section.anchor}"></a>`
}

const rewriteProse = (
  lines: ReadonlyArray<string>,
  file: string,
  shared: Shared,
): string[] => {
  const out: string[] = []
  let buffer: string[] = []
  let quoted = false
  const flush = () => {
    if (buffer.length === 0) return
    out.push(rewriteInline(buffer.join('\n'), freshScope(shared, quoted)))
    buffer = []
  }
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (/^<a id="[^"]+"><\/a>$/.test(line) && /^## /.test(lines[index + 1] ?? '')) continue
    if (/^#{1,6} /.test(line)) {
      flush()
      const anchor = sectionAnchor(line, file, shared.catalog)
      if (anchor !== undefined && out.at(-1) !== anchor) out.push(anchor)
      out.push(line)
      continue
    }
    if (/^\s*(?:[-*+]|\d+\.) /.test(line) || isQuotedLine(line) !== quoted) flush()
    quoted = isQuotedLine(line)
    buffer.push(line)
  }
  flush()
  return out
}

const rewriteBody = (body: string, file: string, shared: Shared): string => {
  const endsWithNewline = body.endsWith('\n')
  const lines = body.split('\n')
  if (endsWithNewline) lines.pop()
  const blocks: string[] = []
  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? ''
    const fence = /^( {0,3})(`{3,}|~{3,})/.exec(line)
    if (fence?.[2] !== undefined) {
      const mark = fence[2][0] ?? '`'
      const width = fence[2].length
      let next = index + 1
      const close = new RegExp(`^ {0,3}${mark}{${width},}\\s*$`)
      while (next < lines.length && !close.test(lines[next] ?? '')) next += 1
      if (next < lines.length) next += 1
      blocks.push(lines.slice(index, next).join('\n'))
      index = next
      continue
    }
    if (/^\s*\|/.test(line)) {
      let next = index + 1
      while (next < lines.length && /^\s*\|/.test(lines[next] ?? '')) next += 1
      blocks.push(
        lines
          .slice(index, next)
          .map((row) => rewriteRow(row, file, shared))
          .join('\n'),
      )
      index = next
      continue
    }
    if (line.trim() === '') {
      blocks.push(line)
      index += 1
      continue
    }
    let next = index + 1
    while (
      next < lines.length &&
      (lines[next] ?? '').trim() !== '' &&
      !/^( {0,3})(`{3,}|~{3,})/.test(lines[next] ?? '') &&
      !/^\s*\|/.test(lines[next] ?? '')
    ) {
      next += 1
    }
    blocks.push(rewriteProse(lines.slice(index, next), file, shared).join('\n'))
    index = next
  }
  const joined = blocks.join('\n')
  if (endsWithNewline || joined === '') return joined.endsWith('\n') ? joined : `${joined}\n`
  return joined
}

const definitionsBlock = (file: string, used: ReadonlySet<string>, catalog: Catalog): string => {
  if (used.size === 0) return ''
  const lines = [...used].sort((left, right) => left.localeCompare(right)).flatMap((key) => {
    const reference = resolveKey(catalog, key)
    return reference === undefined ? [] : [`[${key}]: ${referenceHref(file, reference.path, reference.anchor)}`]
  })
  const marker = file.endsWith('.mdx') ? MDX_REFERENCES_MARKER : REFERENCES_MARKER
  return `\n${marker}\n\n${lines.join('\n')}\n`
}

/** The canonical text of one file. Problems are ids the catalog does not know. */
export const rewriteDocument = (source: string, file: string, catalog: Catalog): Rewrite => {
  const problems: string[] = []
  const seen = new Set<string>()
  const note: Note = (problem) => {
    if (seen.has(problem)) return
    seen.add(problem)
    problems.push(`${file}: ${problem}`)
  }
  const used = new Set<string>()
  const marks = theirWords()
  const stripped = stripBlock(source)
  const { frontmatter, body } = splitFrontmatter(stripped)
  const rewritten = `${frontmatter}${rewriteBody(body, file, { used, note, catalog, marks })}`
  const unclosed = marks.end()
  if (unclosed !== undefined) note(unclosed)
  const block = definitionsBlock(file, used, catalog)
  const text = block === '' ? rewritten : `${rewritten.endsWith('\n') ? rewritten : `${rewritten}\n`}${block}`
  return { text, problems }
}

/** What `verify` reports. A file that `pnpm refs fix` would change is a failure, and so is an unknown id. */
export const referenceProblems = (source: string, file: string, catalog: Catalog): ReadonlyArray<string> => {
  const result = rewriteDocument(source, file, catalog)
  return result.text === source ? result.problems : [...result.problems, `${file}: run \`pnpm refs fix\``]
}
