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
import { GITHUB_REPOSITORY, siteUrlFor } from './repo.ts'

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

export type ReferenceKind = 'Gate' | 'ADR' | 'Decision' | 'Issue' | 'Glossary'

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
  const page = siteUrlFor(reference.path) ?? `${GITHUB_REPOSITORY}/blob/main/${reference.path}`
  return reference.anchor === '' ? page : `${page}#${reference.anchor}`
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

/** A key (an id, or a section range) as the site links it, or undefined when it is not one. */
export const lookupReference = (root: string, key: string): Reference | undefined => {
  const reference = resolveKey(referenceCatalog(root), key)
  return reference === undefined ? undefined : toSite(reference)
}

/** The glossary's terms, rebuilt only when one of the sources changed. */
export const glossaryTerms = (root: string): ReadonlyArray<GlossaryTerm> => current(root).terms

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
 * not Accepted, "an HTTP origin" is not Origin. Acronyms are matched as written too.
 */
export const EVERYDAY_TERMS = [
  'Accepted',
  'Command',
  'Deferred',
  'Delivered',
  'Effect',
  'Execution',
  'Feature',
  'Frame',
  'Layer',
  'Origin',
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
