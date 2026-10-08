/**
 * The reference catalog (D86', D87-D92): every gate, ADR, decision and issue,
 * with the name a reference reads as and the repository path it links to.
 * The docs site turns a path into a site or GitHub URL; `pnpm refs fix` turns
 * it into a relative link. One read serves both.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** The gate table in code: the one home of gate names and claims. */
export const GATE_TABLE = 'tools/qualification/src/gates.ts'
/** The plan's gate table: where a gate reference in markdown lands (`#p05`). */
export const GATE_TABLE_DOC = 'docs/plan/bootstrap/06-qualification-gates.md'
export const DECISION_LOG = 'docs/plan/bootstrap/02-decision-log.md'
export const GLOSSARY = 'GLOSSARY.md'

/** The statuses an issue may have (D92): the triage roles, and resolved. */
export const ISSUE_STATUSES = ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix', 'resolved']

export type ReferenceKind = 'Gate' | 'ADR' | 'Decision' | 'Issue'

export type GateClaim = { readonly id: string; readonly name: string; readonly claim: string }

export type Reference = {
  readonly id: string
  readonly kind: ReferenceKind
  /** What the first mention reads: the id and the name. */
  readonly label: string
  readonly summary: string
  /** A short extra line for the site's preview: an ADR's status, a gate's evidence date. */
  readonly meta: string
  /** Repository path the markdown link points at. */
  readonly path: string
  /** Anchor without `#`, or empty when the link is the whole file. */
  readonly anchor: string
}

export type Decision = { readonly id: string; readonly name: string; readonly decision: string }

export type DecisionSection = {
  /** The section heading without a trailing `(YYYY-MM-DD)`. */
  readonly heading: string
  readonly from: string
  readonly to: string
  /** Anchor without `#`: `d107-d117`, `d58p` for a primed id. */
  readonly anchor: string
}

export type Catalog = {
  readonly references: ReadonlyMap<string, Reference>
  readonly sections: ReadonlyArray<DecisionSection>
}

/** Markdown to the plain text a preview shows. */
export const plainText = (markdown: string): string =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\\\|/g, '|')
    .replace(/\s+/g, ' ')
    .trim()

/** The first sentence of a text, for a one-line preview. */
export const firstSentence = (text: string): string => {
  const match = /^.*?[.!?](?=\s|$)/.exec(text)
  return (match?.[0] ?? text).trim()
}

/** The anchor of a decision's row: `D37` -> `d37`, `D33'` -> `d33p`. */
export const decisionAnchor = (id: string): string => id.toLowerCase().replace(/'/g, 'p')

const unquote = (literal: string): string => literal.slice(1, -1).replace(/\\'/g, "'")

/** Each gate's id, name and claim, from the gate table's source. */
export const parseGateClaims = (source: string): ReadonlyArray<GateClaim> =>
  source.split(/\n\s*\{\n/).flatMap((block) => {
    const id = /gate: '(P\d\d)'/.exec(block)?.[1]
    const name = /name: ('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    const claim = /claim:\s*('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    return id && name && claim ? [{ id, name: unquote(name), claim: unquote(claim) }] : []
  })

/** The newest dated evidence note of a gate (`YYYY-MM-DD-p04.md`), or null. */
export const newestEvidence = (root: string, gate: string): string | null => {
  const directory = join(root, 'docs/evidence')
  if (!existsSync(directory)) return null
  const suffix = `-${gate.toLowerCase()}.md`
  const notes = readdirSync(directory)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-/.test(name) && name.endsWith(suffix))
    .sort()
  const newest = notes.at(-1)
  return newest === undefined ? null : `docs/evidence/${newest}`
}

const ID_CELL = /^(?:<a id="[^"]*"><\/a>)?(D\d+'*)$/

/** Every decision row of the decision log: `| D37 | Name | Decision | Why |`. An anchor before the id still counts. */
export const parseDecisions = (source: string): ReadonlyArray<Decision> =>
  source.split('\n').flatMap((line) => {
    if (!line.startsWith('|')) return []
    const cells = line.split(/(?<!\\)\|/).map((cell) => cell.trim())
    const id = ID_CELL.exec(cells[1] ?? '')?.[1]
    const name = cells[2]
    const decision = cells[3]
    if (id === undefined || name === undefined || decision === undefined) return []
    return [{ id, name, decision: plainText(decision) }]
  })

const sectionHeading = (title: string): string => title.replace(/ \(\d{4}-\d{2}-\d{2}\)$/, '')

/** One section per `##` heading that holds decision rows. A range is exactly that section when its ends are the first and last row. */
export const parseDecisionSections = (source: string): ReadonlyArray<DecisionSection> => {
  const sections: DecisionSection[] = []
  let heading = ''
  let ids: string[] = []
  const flush = () => {
    const from = ids[0]
    const to = ids.at(-1)
    if (heading !== '' && from !== undefined && to !== undefined) {
      sections.push({ heading, from, to, anchor: `${decisionAnchor(from)}-${decisionAnchor(to)}` })
    }
    ids = []
  }
  for (const line of source.split('\n')) {
    const title = /^## (.+)$/.exec(line)?.[1]
    if (title !== undefined) {
      flush()
      heading = sectionHeading(title.trim())
      continue
    }
    const id = /^\| (?:<a id="[^"]*"><\/a>)?(D\d+'*) \|/.exec(line)?.[1]
    if (id !== undefined) ids.push(id)
  }
  flush()
  return sections
}

const readIfExists = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

const headingOf = (path: string, source: string): string => {
  const title = /^# (.+)\n/.exec(source)?.[1]
  if (title === undefined) throw new Error(`${path} does not start with a "# " heading.`)
  return title.replaceAll('`', '').trim()
}

/** Builds the catalog of every reference the repository can name. */
export const buildCatalog = (root: string): Catalog => {
  const references = new Map<string, Reference>()
  for (const gate of parseGateClaims(readIfExists(join(root, GATE_TABLE)))) {
    const evidence = newestEvidence(root, gate.id)
    const date = evidence === null ? undefined : /(\d{4}-\d{2}-\d{2})/.exec(evidence)?.[1]
    references.set(gate.id, {
      id: gate.id,
      kind: 'Gate',
      label: `${gate.id} ${gate.name}`,
      summary: `Claim: ${plainText(gate.claim)}.`,
      meta: date ? `Newest evidence ${date}` : 'Not run yet',
      path: GATE_TABLE_DOC,
      anchor: gate.id.toLowerCase(),
    })
  }
  for (const file of readdirSync(join(root, 'docs/adr')).filter((name) => /^\d{4}-.+\.md$/.test(name))) {
    const path = `docs/adr/${file}`
    const source = readFileSync(join(root, path), 'utf8')
    const summary = /^Summary: (.+)$/m.exec(source)?.[1]
    if (summary === undefined) throw new Error(`${path} has no "Summary:" line (D88).`)
    const number = file.slice(0, 4)
    references.set(`ADR-${number}`, {
      id: `ADR-${number}`,
      kind: 'ADR',
      label: headingOf(path, source).replace(/^ADR-(\d{4}): /, 'ADR-$1 '),
      summary: plainText(summary),
      meta: /^Status: (.+)$/m.exec(source)?.[1]?.trim() ?? '',
      path,
      anchor: '',
    })
  }
  const issues = existsSync(join(root, 'docs/issues')) ? readdirSync(join(root, 'docs/issues')) : []
  for (const file of issues) {
    if (!/^\d{4}-.+\.md$/.test(file)) continue
    const path = `docs/issues/${file}`
    const source = readFileSync(join(root, path), 'utf8')
    const number = Number(file.slice(0, 4))
    const title = new RegExp(`^# I${number}: (.+)$`).exec(source.split('\n')[0] ?? '')?.[1]
    if (title === undefined) throw new Error(`${path} must start with "# I${number}: <title>" (D92).`)
    const status = /^Status: (.+)$/m.exec(source)?.[1]?.trim() ?? ''
    if (!ISSUE_STATUSES.includes(status)) {
      throw new Error(`${path}: Status "${status}" is not one of ${ISSUE_STATUSES.join(', ')} (D92).`)
    }
    const what = /^## What\n\n([\s\S]*?)(?:\n\n|$)/m.exec(source)?.[1]
    if (what === undefined) throw new Error(`${path} has no "## What" section (D92).`)
    references.set(`I${number}`, {
      id: `I${number}`,
      kind: 'Issue',
      label: `I${number} ${plainText(title)}`,
      summary: firstSentence(plainText(what)),
      meta: status,
      path,
      anchor: '',
    })
  }
  const log = readIfExists(join(root, DECISION_LOG))
  for (const decision of parseDecisions(log)) {
    references.set(decision.id, {
      id: decision.id,
      kind: 'Decision',
      label: `${decision.id} ${decision.name}`,
      summary: firstSentence(decision.decision),
      meta: '',
      path: DECISION_LOG,
      anchor: decisionAnchor(decision.id),
    })
  }
  return { references, sections: parseDecisionSections(log) }
}

/**
 * The reference a key names: an id, or a range that is exactly one decision
 * section (`D107-D117`). Matching ignores case, as a markdown reference label does.
 */
export const resolveKey = (catalog: Catalog, key: string): Reference | undefined => {
  const direct = catalog.references.get(key)
  if (direct) return direct
  const lower = key.toLowerCase()
  for (const reference of catalog.references.values()) {
    if (reference.id.toLowerCase() === lower) return reference
  }
  const section = catalog.sections.find((item) => `${item.from}-${item.to}`.toLowerCase() === lower)
  if (section === undefined) return undefined
  const id = `${section.from}-${section.to}`
  return {
    id,
    kind: 'Decision',
    label: `${id} ${section.heading}`,
    summary: section.heading,
    meta: '',
    path: DECISION_LOG,
    anchor: section.anchor,
  }
}

export type Found = {
  readonly start: number
  readonly end: number
  /** The canonical id. */
  readonly id: string
  /** Part of a range (`P01-P11`): rendered as the id alone, since a name would break the range. */
  readonly inRange: boolean
}

/** A prime as written, or as smartypants curled it: after a code span `D35''` arrives as `D35\u2019\u2018`. */
const PRIME = /['\u2018\u2019\u2032]/g
/** Ends an id: no more of a word follows, or a possessive 's does. */
const END = String.raw`(?:(?![\w'\u2018\u2019\u2032-])|(?=['\u2019]s\b))`
const REFERENCE = new RegExp(
  String.raw`\b(?:(P\d\d)${END}|ADR[- ](\d{4})${END}|(D\d{1,3})((?:['\u2018\u2019\u2032]{1,2})?)${END}|(I\d{1,4})${END})|\b(P\d\d|D\d{1,3})-(P\d\d|D\d{1,3})\b`,
  'g',
)

/** The gate, ADR, decision and issue ids in a text, in order. Ranges like `P01-P11` give both ends. */
export const findReferences = (text: string): ReadonlyArray<Found> => {
  const found: Found[] = []
  for (const match of text.matchAll(REFERENCE)) {
    const start = match.index
    const [whole, gate, adr, decision, primes = '', issue, from, to] = match
    if (from !== undefined && to !== undefined) {
      found.push({ start, end: start + from.length, id: from, inRange: true })
      found.push({ start: start + from.length + 1, end: start + whole.length, id: to, inRange: true })
      continue
    }
    const id = gate ?? issue ?? (adr !== undefined ? `ADR-${adr}` : `${decision ?? ''}${primes.replace(PRIME, "'")}`)
    found.push({ start, end: start + whole.length, id, inRange: false })
  }
  return found
}

export type Token =
  | { readonly kind: 'id'; readonly start: number; readonly end: number; readonly id: string }
  | { readonly kind: 'range'; readonly start: number; readonly end: number; readonly from: string; readonly to: string }

/** Ids and ranges, a range as one token so a section name can replace `D107-D117` whole. */
export const findReferenceTokens = (text: string): ReadonlyArray<Token> => {
  const found = findReferences(text)
  const tokens: Token[] = []
  for (let index = 0; index < found.length; index++) {
    const item = found[index]
    const next = found[index + 1]
    if (item === undefined) continue
    if (item.inRange && next?.inRange === true && next.start === item.end + 1 && text[item.end] === '-') {
      tokens.push({ kind: 'range', start: item.start, end: next.end, from: item.id, to: next.id })
      index += 1
      continue
    }
    tokens.push({ kind: 'id', start: item.start, end: item.end, id: item.id })
  }
  return tokens
}

/** Text that is only an id, like a link labelled `ADR 0005`. */
export const onlyReference = (text: string): string | null => {
  const found = findReferences(text.trim())
  const [first] = found
  return found.length === 1 && first && !first.inRange && first.start === 0 && first.end === text.trim().length ? first.id : null
}
