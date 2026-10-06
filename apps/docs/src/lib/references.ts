/**
 * The reference index (D86-D90): every gate, ADR and decision with the name
 * and one-line summary a reference to it renders with, and where it links.
 * Sources keep short ids (`P04`, `ADR-0011`, `D37`); the site resolves them
 * when it renders (`reference-links.ts`). An id the index does not have fails
 * the build. Gate names and summaries have one home,
 * `tools/qualification/src/gates.ts`; ADR summaries are each ADR's `Summary:`
 * line; decision names are the Name column of the decision log.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { claimHref, GATE_TABLE, parseGateClaims } from './claims.ts'
import { GITHUB_REPOSITORY, siteUrlFor } from './repo.ts'
import { parseRepositoryPage } from './repo-pages.ts'

export { GATE_TABLE }
export const GLOSSARY = 'GLOSSARY.md'
export const DECISION_LOG = 'docs/plan/bootstrap/02-decision-log.md'

export type ReferenceKind = 'Gate' | 'ADR' | 'Decision' | 'Issue' | 'Glossary'

/** The statuses an issue may have (D92): the triage roles, and resolved. */
export const ISSUE_STATUSES = ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix', 'resolved']

export type Reference = {
  /** The canonical id: `P04`, `ADR-0011`, `D37`, `D33'`, `I1`. */
  readonly id: string
  readonly kind: ReferenceKind
  /** What the link reads: the id and the name. */
  readonly label: string
  readonly href: string
  /** One line, shown in the preview. */
  readonly summary: string
  /** A short extra line for the preview: an ADR's status, a gate's evidence date. */
  readonly meta: string
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

/** The newest dated evidence note of a gate (`YYYY-MM-DD-p04.md`), or null. */
export const newestEvidence = (root: string, gate: string): string | null => {
  const suffix = `-${gate.toLowerCase()}.md`
  const notes = readdirSync(join(root, 'docs/evidence'))
    .filter((name) => /^\d{4}-\d{2}-\d{2}-/.test(name) && name.endsWith(suffix))
    .sort()
  const newest = notes.at(-1)
  return newest === undefined ? null : `docs/evidence/${newest}`
}

/** The anchor of a decision's row: `D37` -> `d37`, `D33'` -> `d33p`. */
export const decisionAnchor = (id: string): string => id.toLowerCase().replace(/'/g, 'p')

export type Decision = { readonly id: string; readonly name: string; readonly decision: string }

/** Every decision row of the decision log: `| D37 | Name | Decision | Why |`. */
export const parseDecisions = (source: string): ReadonlyArray<Decision> =>
  source.split('\n').flatMap((line) => {
    const match = /^\| (D\d+'*) \| ([^|]+) \| ((?:[^|\\]|\\.)+) \|/.exec(line)
    if (!match) return []
    const [, id = '', name = '', decision = ''] = match
    return [{ id, name: name.trim(), decision: plainText(decision) }]
  })

const readIfExists = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

/** Builds the index of every reference the site can resolve. */
export const buildReferenceIndex = (root: string): ReadonlyMap<string, Reference> => {
  const index = new Map<string, Reference>()
  // A gate reference shows the claim it proves and links to it (D93).
  for (const gate of parseGateClaims(readIfExists(join(root, GATE_TABLE)))) {
    const evidence = newestEvidence(root, gate.id)
    const date = evidence === null ? null : /(\d{4}-\d{2}-\d{2})/.exec(evidence)?.[1]
    index.set(gate.id, {
      id: gate.id,
      kind: 'Gate',
      label: `${gate.id} ${gate.name}`,
      href: claimHref(gate),
      summary: `Claim: ${plainText(gate.claim)}.`,
      meta: date ? `Newest evidence ${date}` : 'Not run yet',
    })
  }
  for (const file of readdirSync(join(root, 'docs/adr')).filter((name) => /^\d{4}-.+\.md$/.test(name))) {
    const path = `docs/adr/${file}`
    const source = readFileSync(join(root, path), 'utf8')
    const page = parseRepositoryPage(path, source)
    const number = file.slice(0, 4)
    const summary = /^Summary: (.+)$/m.exec(source)?.[1]
    if (summary === undefined) throw new Error(`${path} has no "Summary:" line (D88).`)
    index.set(`ADR-${number}`, {
      id: `ADR-${number}`,
      kind: 'ADR',
      label: page.title.replace(/^ADR-(\d{4}): /, 'ADR-$1 '),
      href: siteUrlFor(path) ?? `${GITHUB_REPOSITORY}/blob/main/${path}`,
      summary: plainText(summary),
      meta: page.status ?? '',
    })
  }
  for (const file of existsSync(join(root, 'docs/issues')) ? readdirSync(join(root, 'docs/issues')) : []) {
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
    index.set(`I${number}`, {
      id: `I${number}`,
      kind: 'Issue',
      label: `I${number} ${plainText(title)}`,
      href: siteUrlFor(path) ?? `${GITHUB_REPOSITORY}/blob/main/${path}`,
      summary: firstSentence(plainText(what)),
      meta: status,
    })
  }
  const decisionsPage = siteUrlFor(DECISION_LOG) ?? `${GITHUB_REPOSITORY}/blob/main/${DECISION_LOG}`
  for (const decision of parseDecisions(readIfExists(join(root, DECISION_LOG)))) {
    index.set(decision.id, {
      id: decision.id,
      kind: 'Decision',
      label: `${decision.id} ${decision.name}`,
      href: `${decisionsPage}#${decisionAnchor(decision.id)}`,
      summary: firstSentence(decision.decision),
      meta: '',
    })
  }
  return index
}

/** When the index's sources last changed, so `docs:serve` sees an edited name. */
const sourcesVersion = (root: string): string =>
  [
    GATE_TABLE,
    GLOSSARY,
    DECISION_LOG,
    'docs/adr',
    'docs/evidence',
    'docs/issues',
    ...readdirSync(join(root, 'docs/adr')).map((name) => `docs/adr/${name}`),
    ...(existsSync(join(root, 'docs/issues')) ? readdirSync(join(root, 'docs/issues')).map((name) => `docs/issues/${name}`) : []),
  ]
    .map((path) => (existsSync(join(root, path)) ? statSync(join(root, path)).mtimeMs : 0))
    .join()

type Built = { readonly version: string; readonly index: ReadonlyMap<string, Reference>; readonly terms: ReadonlyArray<GlossaryTerm> }

const built = new Map<string, Built>()

const current = (root: string): Built => {
  const version = sourcesVersion(root)
  const cached = built.get(root)
  if (cached?.version === version) return cached
  const fresh = { version, index: buildReferenceIndex(root), terms: parseGlossary(readIfExists(join(root, GLOSSARY))) }
  built.set(root, fresh)
  return fresh
}

/** The index of a repository, rebuilt only when one of its sources changed. */
export const referenceIndex = (root: string): ReadonlyMap<string, Reference> => current(root).index

/** The glossary's terms, rebuilt only when one of the sources changed. */
export const glossaryTerms = (root: string): ReadonlyArray<GlossaryTerm> => current(root).terms

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

/** Text that is only an id, like a link labelled `ADR 0005`. */
export const onlyReference = (text: string): string | null => {
  const found = findReferences(text.trim())
  const [first] = found
  return found.length === 1 && first && !first.inRange && first.start === 0 && first.end === text.trim().length ? first.id : null
}

/**
 * Whether a path is a file or a directory with a file somewhere under it. Git
 * cannot hold an empty directory, so one that exists only in a working tree
 * is missing from every fresh clone and from GitHub.
 */
const holdsAFile = (absolute: string): boolean =>
  !statSync(absolute).isDirectory() ||
  readdirSync(absolute, { recursive: true, withFileTypes: true }).some((entry) => entry.isFile())

const ignoredPaths = new Map<string, boolean>()

/**
 * Whether Git ignores a path, as for a build output (`apps/docs/dist`) or a
 * local artifact (`.artifacts/`). It exists only where it was made, so it is
 * neither linked nor reported missing. Outside a Git repository nothing is
 * ignored.
 */
const isIgnored = (root: string, path: string): boolean => {
  const key = `${root}\0${path}`
  const known = ignoredPaths.get(key)
  if (known !== undefined) return known
  let ignored: boolean
  try {
    execFileSync('git', ['check-ignore', '--quiet', path], { cwd: root, stdio: 'ignore' })
    ignored = true
  } catch {
    ignored = false
  }
  ignoredPaths.set(key, ignored)
  return ignored
}

/** Roots under which a code span is a repository path that must exist. */
const CHECKED_ROOTS = /^(?:apps|libs|features|tools|docs|exercises)\//

export type CodePath =
  | { readonly _tag: 'Link'; readonly href: string }
  | { readonly _tag: 'NotAPath' }
  | { readonly _tag: 'Missing'; readonly path: string }

/**
 * What an inline code span is: a repository path to link (the site page when
 * the site renders it, else GitHub), not a path, or a path under a checked
 * root that does not exist. Placeholders (`<pattern>`, `NN.MM`, globs) and
 * paths Git ignores are not paths.
 */
export const codePath = (root: string, value: string): CodePath => {
  const path = value.trim()
  if (!/^[\w.@/-]+$/.test(path) || /\b(?:N{2,}|M{2,})\b/.test(path) || path.startsWith('/') || path.includes('..')) {
    return { _tag: 'NotAPath' }
  }
  const isRootFile = !path.includes('/') && /\.\w+$/.test(path)
  if (!path.includes('/') && !isRootFile) return { _tag: 'NotAPath' }
  const bare = path.replace(/\/$/, '')
  if (isIgnored(root, bare)) return { _tag: 'NotAPath' }
  const absolute = join(root, bare)
  if (!existsSync(absolute) || !holdsAFile(absolute)) {
    return CHECKED_ROOTS.test(path) ? { _tag: 'Missing', path } : { _tag: 'NotAPath' }
  }
  const site = siteUrlFor(bare)
  if (site) return { _tag: 'Link', href: site }
  const kind = statSync(absolute).isDirectory() ? 'tree' : 'blob'
  return { _tag: 'Link', href: `${GITHUB_REPOSITORY}/${kind}/main/${bare}` }
}

/** One gate's reference, for components that list gates (the guide status block). */
export const gateReference = (root: string, id: string): Reference => {
  const reference = referenceIndex(root).get(id)
  if (reference?.kind !== 'Gate') throw new Error(`Gate ${id} is not in ${GATE_TABLE}.`)
  return reference
}

/** One ADR's reference, from its four-digit id. */
export const adrReference = (root: string, id: string): Reference => {
  if (!/^\d{4}$/.test(id)) throw new Error(`ADR id "${id}" is not four digits.`)
  const reference = referenceIndex(root).get(`ADR-${id}`)
  if (reference === undefined) throw new Error(`No ADR ${id} in docs/adr.`)
  return reference
}

export type GlossaryTerm = {
  readonly term: string
  /** The entry's anchor on the glossary page. */
  readonly anchor: string
  /** The plain first sentence (D94). */
  readonly summary: string
}

/** A glossary entry's anchor: `Guide template` -> `guide-template`. */
export const glossaryAnchor = (term: string): string =>
  term
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/ +/g, '-')

/** Every glossary entry, `**Term**:` then its definition up to the blank line or `_Avoid_`. */
export const parseGlossary = (source: string): ReadonlyArray<GlossaryTerm> =>
  [...source.matchAll(/^\*\*([^*]+)\*\*:\n([\s\S]*?)(?=\n_Avoid_|\n\n|$)/gm)].map(([, term = '', definition = '']) => {
    const summary = firstSentence(plainText(definition))
    if (summary === '') throw new Error(`${GLOSSARY}: "${term}" has no definition (D94).`)
    return { term, anchor: glossaryAnchor(term), summary }
  })

/**
 * Terms that are also everyday words in these docs link only when written
 * as the glossary writes them, capitalised, and not where any word would be
 * capitalised, at the start of a sentence or a cell (D94): "the CLI command"
 * is not a Command, "a side effect" is not Effect, "the server accepted" is
 * not Accepted. Acronyms are matched as written too.
 */
export const EVERYDAY_TERMS = [
  'Accepted',
  'Command',
  'Deferred',
  'Delivered',
  'Effect',
  'Execution',
  'Feature',
  'Layer',
  'Qualified',
  'Qualify',
  'Service',
  'Verify',
  'Worker',
]

/** Names that have no plural: "Effects" in "Vision - View - Effects" is not Effect. */
const PROPER_NOUNS = ['Effect', 'ViViEfs', 'IntentComposer']

/** The forms of a term a page may use: as written, and its plural. */
export const termForms = (term: string): ReadonlyArray<string> => {
  if (PROPER_NOUNS.includes(term)) return [term]
  const words = term.split(' ')
  const last = words.at(-1) ?? term
  const plurals = /[^aeiou]y$/.test(last) ? [`${last.slice(0, -1)}ies`] : /(?:s|x|ch|sh)$/.test(last) ? [`${last}es`] : [`${last}s`]
  return [term, ...plurals.map((plural) => [...words.slice(0, -1), plural].join(' '))]
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isExact = (term: string) => EVERYDAY_TERMS.includes(term) || /^[A-Z]{2,}$/.test(term) || PROPER_NOUNS.includes(term)

export type FoundTerm = { readonly start: number; readonly end: number; readonly term: GlossaryTerm }

/** A finder for glossary terms in prose, longest term first, whole words only. */
export const termFinder = (terms: ReadonlyArray<GlossaryTerm>) => {
  const forms = terms
    .flatMap((term) => termForms(term.term).map((form) => ({ form, term })))
    .sort((a, b) => b.form.length - a.form.length)
  const byForm = new Map(forms.map(({ form, term }) => [form.toLowerCase(), term]))
  const pattern = new RegExp(`(?<![\\w-])(?:${forms.map(({ form }) => escapeRegExp(form)).join('|')})(?![\\w-])`, 'gi')
  return (text: string): ReadonlyArray<FoundTerm> =>
    [...text.matchAll(pattern)].flatMap((match) => {
      const term = byForm.get(match[0].toLowerCase())
      if (term === undefined) return []
      if (isExact(term.term) && !termForms(term.term).includes(match[0])) return []
      // At the start of a sentence any word is capitalised, so it says nothing.
      if (EVERYDAY_TERMS.includes(term.term) && /(?:^|[.!?:]\s*)$/.test(text.slice(0, match.index).trimEnd())) return []
      return [{ start: match.index, end: match.index + match[0].length, term }]
    })
}
