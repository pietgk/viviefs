/**
 * Site references (D87-D94): names and paths come from `@viviefs/references`
 * (D86'); this module adds the site URL, the glossary and repository-path
 * links. Sources keep short ids; the site resolves them when it renders
 * (`reference-links.ts`). An id the catalog does not have fails the build.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildCatalog,
  DECISION_LOG,
  decisionAnchor,
  findReferences,
  firstSentence,
  GATE_TABLE,
  GLOSSARY,
  ISSUE_STATUSES,
  newestEvidence,
  onlyReference,
  parseDecisions,
  plainText,
  resolveKey,
  type Catalog,
  type Reference as CatalogReference,
} from '@viviefs/references'
import { claimHref } from './claims.ts'
import { GITHUB_REPOSITORY, siteUrlFor, withBase } from './repo.ts'

export {
  DECISION_LOG,
  decisionAnchor,
  findReferences,
  firstSentence,
  GATE_TABLE,
  GLOSSARY,
  ISSUE_STATUSES,
  newestEvidence,
  onlyReference,
  parseDecisions,
  plainText,
}

export type ReferenceKind = 'Gate' | 'ADR' | 'Decision' | 'Issue' | 'Glossary' | 'Page'

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

const siteHref = (reference: CatalogReference): string => {
  if (reference.kind === 'Gate') return claimHref({ id: reference.id, name: reference.label.slice(reference.id.length + 1) })
  const page = siteUrlFor(reference.path)
  const href = page === null ? `${GITHUB_REPOSITORY}/blob/main/${reference.path}` : withBase(page)
  return reference.anchor === '' ? href : `${href}#${reference.anchor}`
}

const toSite = (reference: CatalogReference): Reference => ({
  id: reference.id,
  kind: reference.kind,
  label: reference.label,
  href: siteHref(reference),
  summary: reference.summary,
  meta: reference.meta,
})

/** The index of every reference, with the URL the site links to. */
export const buildReferenceIndex = (root: string): ReadonlyMap<string, Reference> => {
  const index = new Map<string, Reference>()
  for (const reference of buildCatalog(root).references.values()) index.set(reference.id, toSite(reference))
  return index
}

const read = (root: string, path: string) => {
  const absolute = join(root, path)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : ''
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

type Built = {
  readonly version: string
  readonly catalog: Catalog
  readonly index: ReadonlyMap<string, Reference>
  readonly terms: ReadonlyArray<GlossaryTerm>
}

const built = new Map<string, Built>()

const current = (root: string): Built => {
  const version = sourcesVersion(root)
  const cached = built.get(root)
  if (cached?.version === version) return cached
  const catalog = buildCatalog(root)
  const index = new Map<string, Reference>()
  for (const reference of catalog.references.values()) index.set(reference.id, toSite(reference))
  const fresh = { version, catalog, index, terms: parseGlossary(read(root, GLOSSARY)) }
  built.set(root, fresh)
  return fresh
}

/** The index of a repository, rebuilt only when one of its sources changed. */
export const referenceIndex = (root: string): ReadonlyMap<string, Reference> => current(root).index

/** The catalog, including decision sections, rebuilt with the index. */
export const referenceCatalog = (root: string): Catalog => current(root).catalog

/**
 * A key (an id, or a section range) as the site links it, or undefined when
 * it is not one. Takes the catalog, so a page reads it once, not once per link.
 */
export const lookupReference = (catalog: Catalog, key: string): Reference | undefined => {
  const reference = resolveKey(catalog, key)
  return reference === undefined ? undefined : toSite(reference)
}

/** The glossary's terms, rebuilt only when one of the sources changed. */
export const glossaryTerms = (root: string): ReadonlyArray<GlossaryTerm> => current(root).terms

/**
 * Whether a path is a file or a directory with a file somewhere under it. Git
 * cannot hold an empty directory, so one that exists only in a working tree
 * is missing from every fresh clone and from GitHub.
 */
const holdsAFile = (absolute: string): boolean => {
  if (!statSync(absolute).isDirectory()) return true
  // Stops at the first file: reading a whole tree such as `apps/docs`, with its
  // `node_modules`, took minutes over every page (I27). Git holds a symbolic
  // link like a file.
  const directories = [absolute]
  for (let directory = directories.pop(); directory !== undefined; directory = directories.pop()) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) return true
      directories.push(join(directory, entry.name))
    }
  }
  return false
}

const ignoredEntries = new Map<string, ReadonlySet<string> | null>()

/**
 * The ignored files and directories of a working tree (directories end in
 * `/`), listed by Git once per process: asking per path spawned Git
 * hundreds of times on every start of the site (I27). Null outside a Git
 * repository.
 */
const ignoredIn = (root: string): ReadonlySet<string> | null => {
  if (ignoredEntries.has(root)) return ignoredEntries.get(root) ?? null
  let entries: ReadonlySet<string> | null
  try {
    const listed = execFileSync('git', ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    })
    entries = new Set(listed.split('\0').filter((entry) => entry !== ''))
  } catch {
    entries = null
  }
  ignoredEntries.set(root, entries)
  return entries
}

const ignoredMissing = new Map<string, boolean>()

/**
 * Whether Git ignores a path, as for a build output (`apps/docs/dist`) or a
 * local artifact (`.artifacts/`). It exists only where it was made, so it is
 * neither linked nor reported missing. A path that exists is ignored when it
 * or a directory above it is listed. One not made yet, such as `dist` before
 * the first build, is asked of Git as a file and as a directory, since a
 * pattern such as `dist/` matches only a directory. Outside a Git repository
 * nothing is ignored.
 */
const isIgnored = (root: string, path: string): boolean => {
  const entries = ignoredIn(root)
  if (entries === null) return false
  if (existsSync(join(root, path))) {
    const parts = path.split('/')
    return parts.some((_, index) => {
      const prefix = parts.slice(0, index + 1).join('/')
      return entries.has(prefix) || entries.has(`${prefix}/`)
    })
  }
  const key = `${root}\0${path}`
  const known = ignoredMissing.get(key)
  if (known !== undefined) return known
  let ignored: boolean
  try {
    // Exits 0 when either form is ignored.
    execFileSync('git', ['check-ignore', path, `${path}/`], { cwd: root, stdio: 'ignore' })
    ignored = true
  } catch {
    ignored = false
  }
  ignoredMissing.set(key, ignored)
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
  const absolute = join(root, bare)
  if (!existsSync(absolute) || !holdsAFile(absolute)) {
    // Most such spans are code (`Effect.fn`, `@effect/vitest`), so Git is
    // asked only about a path that would otherwise fail.
    return CHECKED_ROOTS.test(path) && !isIgnored(root, bare) ? { _tag: 'Missing', path } : { _tag: 'NotAPath' }
  }
  if (isIgnored(root, bare)) return { _tag: 'NotAPath' }
  const site = siteUrlFor(bare)
  if (site) return { _tag: 'Link', href: withBase(site) }
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

/**
 * A glossary entry's anchor: `Guide template` -> `guide-template`. A name
 * keeps its capitals, so `Effect` (the library, `#Effect`) and effect (the
 * word, `#effect`) each have their own.
 */
export const glossaryAnchor = (term: string): string =>
  (PROPER_NOUNS.includes(term) ? term : term.toLowerCase())
    .replace(/[^A-Za-z0-9 -]/g, '')
    .trim()
    .replace(/ +/g, '-')

/** The lines an entry may end with, each at most once and in this order (D174). */
export const GLOSSARY_LABELS = ['Like', 'Not', 'Avoid'] as const

/** The longest hover line, in characters of plain text (D94'). */
export const HOVER_LINE_LENGTH = 120

/**
 * Every glossary entry, `**Term**:` then its lines up to a blank line: the
 * hover line, the precise part, then `_Like_`, `_Not_` and `_Avoid_` lines
 * (D94', D174). The hover line is the first line, one plain sentence the
 * preview card shows whole; an entry that breaks a rule fails the build.
 */
export const parseGlossary = (source: string): ReadonlyArray<GlossaryTerm> => {
  const terms = [...source.matchAll(/^\*\*([^*]+)\*\*:\n((?:.+\n?)*)/gm)].map(([, term = '', body = '']) => {
    const fail = (problem: string): never => {
      throw new Error(`${GLOSSARY}: "${term}": ${problem}`)
    }
    const [hover = '', ...rest] = body.split('\n').filter((line) => line.trim() !== '')
    if (hover.trim() === '') throw new Error(`${GLOSSARY}: "${term}" has no definition (D94).`)
    const summary = hoverLine(hover, fail)
    let last = -1
    let like = ''
    for (const line of rest) {
      const label = /^_([A-Za-z]+)_:/.exec(line)?.[1]
      if (label === undefined) {
        if (GLOSSARY_LABELS[last] === 'Like') like += ` ${line}`
        continue
      }
      const at = GLOSSARY_LABELS.indexOf(label as (typeof GLOSSARY_LABELS)[number])
      if (at < 0) fail(`_${label}_ is not a label; an entry has _Like_, _Not_ and _Avoid_ (D174).`)
      if (at <= last) fail('_Like_, _Not_ and _Avoid_ come once each, in that order (D174).')
      last = at
      if (label === 'Like') like = line
    }
    if (like !== '' && !/\bexcept\b/.test(like)) fail('a _Like_ line says what differs, with "except" (D162).')
    return { term, anchor: glossaryAnchor(term), summary }
  })
  const seen = new Map<string, string>()
  for (const { term, anchor } of terms) {
    const other = seen.get(anchor)
    if (other !== undefined) throw new Error(`${GLOSSARY}: "${other}" and "${term}" share the anchor #${anchor}.`)
    seen.set(anchor, term)
  }
  return terms
}

/** An entry's hover line as plain text, or the rule of D94' it breaks. */
const hoverLine = (line: string, fail: (problem: string) => never): string => {
  if (line.includes('`')) fail("the hover line has code font; write it in plain words (D94').")
  if (/\]\[|\]\(/.test(line)) fail("the hover line has a reference; put it in the precise part (D94').")
  const text = plainText(line)
  if (!/[.!?]$/.test(text)) fail(`the first line is the hover line, one whole sentence ending in a full stop (D94'): "${text}"`)
  if (/[.!?]\s/.test(text)) fail(`the hover line has more than one sentence (D94'): "${text}"`)
  if (text.length > HOVER_LINE_LENGTH) {
    fail(`the hover line has ${text.length} characters; at most ${HOVER_LINE_LENGTH} (D94'): "${text}"`)
  }
  return text
}

/**
 * Terms that are also everyday words in these docs link only when written
 * as the glossary writes them, capitalised, and not where any word would be
 * capitalised, at the start of a sentence or a cell (D94): "the CLI command"
 * is not a Command, "a side effect" is not Effect, "the server accepted" is
 * not Accepted, "an HTTP origin" is not Origin, "a k-plex concept" is not
 * Concept (D181), "a model's tool" is not Tool (D194). Acronyms are matched
 * as written too.
 */
export const EVERYDAY_TERMS = [
  'Accepted',
  'Area',
  'Command',
  'Concept',
  'Delivered',
  'Effect',
  'Execution',
  'Feature',
  'Finding',
  'Frame',
  'Human',
  'Issue',
  'Layer',
  'Origin',
  'Our way',
  'Park',
  'Practice',
  'Promotion',
  'Qualified',
  'Qualify',
  'Reason',
  'Reject',
  'Service',
  'Snapshot',
  'System',
  'Tool',
  'Verify',
]

/**
 * Names, matched only as written, with no plural: "Effects" in
 * "Vision - View - Effects" is not Effect, and "effect" is the word, not the library.
 */
const PROPER_NOUNS = ['Effect', 'ViViEfs', 'IntentComposer', 'XDevl']

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
  // A form as written wins over the same letters in another case: `Effect` and `effect` are two terms.
  const asWritten = new Map(forms.map(({ form, term }) => [form, term]))
  const anyCase = new Map(forms.filter(({ term }) => !isExact(term.term)).map(({ form, term }) => [form.toLowerCase(), term]))
  // A compound may wrap across a source line, so its words are apart by any whitespace.
  const pattern = new RegExp(
    `(?<![\\w-])(?:${forms.map(({ form }) => form.split(' ').map(escapeRegExp).join('\\s+')).join('|')})(?![\\w-])`,
    'gi',
  )
  return (text: string): ReadonlyArray<FoundTerm> =>
    [...text.matchAll(pattern)].flatMap((match) => {
      const written = match[0].replace(/\s+/g, ' ')
      const term = asWritten.get(written) ?? anyCase.get(written.toLowerCase())
      if (term === undefined) return []
      // At the start of a sentence any word is capitalised, so it says nothing.
      if (EVERYDAY_TERMS.includes(term.term) && /(?:^|[.!?:]\s*)$/.test(text.slice(0, match.index).trimEnd())) return []
      return [{ start: match.index, end: match.index + match[0].length, term }]
    })
}
