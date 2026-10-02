/**
 * References resolved when the site renders (D87, D90). In every Markdown and
 * MDX page:
 *
 * - a gate, ADR or decision id in prose becomes a link that reads as its id
 *   and name, carrying its summary for the preview card;
 * - a link whose label is only an id keeps its target and gets the name;
 * - an inline-code repository path becomes a link to its site page or to
 *   GitHub.
 *
 * Headings, code and text already inside a link are left alone. An unknown
 * id fails the build, and so does a missing path under a checked root,
 * except in evidence notes and research records, which are kept as written.
 */
import { fileURLToPath } from 'node:url'
import { relative } from 'node:path'
import type { HastPluginEntry, MdastPluginEntry } from 'satteri'
import {
  codePath,
  DECISION_LOG,
  decisionAnchor,
  findReferences,
  GLOSSARY,
  glossaryAnchor,
  glossaryTerms,
  onlyReference,
  referenceIndex,
  termFinder,
  type FoundTerm,
  type GlossaryTerm,
  type Reference,
} from './references.ts'

/** Where a glossary term links: its entry on the glossary page. */
export const GLOSSARY_PAGE = '/reference/glossary/'

/** Records kept as they were written: a path they name may have moved since. */
const KEPT_AS_WRITTEN = /^docs\/(?:evidence|research)\//

type Phrasing = { readonly type: string; readonly value?: string; readonly children?: ReadonlyArray<Phrasing> }

type Tree = { readonly parent: (node: never) => { readonly type: string } | undefined; readonly indexOf: (node: never) => number | undefined }

/** A node's ancestors, nearest first, with each one's index in its own parent. */
const ancestorsOf = (node: unknown, tree: Tree): ReadonlyArray<{ readonly type: string; readonly index: number | undefined }> => {
  const found: Array<{ readonly type: string; readonly index: number | undefined }> = []
  for (let parent = tree.parent(node as never); parent !== undefined; parent = tree.parent(parent as never)) {
    found.push({ type: parent.type, index: tree.indexOf(parent as never) })
  }
  return found
}

/** The data attributes the preview card reads. */
export const previewProperties = (reference: Reference) => ({
  className: ['ref-link'],
  'data-ref-kind': reference.kind,
  'data-ref-label': reference.label,
  'data-ref-summary': reference.summary,
  'data-ref-meta': reference.meta,
})

/** A glossary term as a reference: its entry, its plain first sentence (D94). */
export const termReference = (term: GlossaryTerm): Reference => ({
  id: term.term,
  kind: 'Glossary',
  label: term.term,
  href: `${GLOSSARY_PAGE}#${term.anchor}`,
  summary: term.summary,
  meta: '',
})

/** A link node for a reference; in a range it reads as the id alone. */
export const referenceLink = (reference: Reference, label: string) => ({
  type: 'link' as const,
  url: reference.href,
  title: null,
  children: [{ type: 'text' as const, value: label }],
  data: { hProperties: previewProperties(reference) },
})

type Part = { type: 'text'; value: string } | ReturnType<typeof referenceLink>

/** What links glossary terms on one page: the terms, and which are linked already. */
export type TermLinking = {
  readonly find: (text: string) => ReadonlyArray<FoundTerm>
  /** Terms linked on this page (or entry), so only the first use links. */
  readonly linked: Set<string>
  /** A term never linked here: the glossary entry being defined. */
  readonly own?: string | undefined
}

/** Plain text with the first use of each glossary term linked (D94). */
const linkTerms = (text: string, terms: TermLinking | undefined): Part[] => {
  if (terms === undefined) return [{ type: 'text', value: text }]
  const parts: Part[] = []
  let at = 0
  for (const { start, end, term } of terms.find(text)) {
    if (start < at || terms.linked.has(term.term) || term.term === terms.own) continue
    terms.linked.add(term.term)
    if (start > at) parts.push({ type: 'text', value: text.slice(at, start) })
    parts.push(referenceLink(termReference(term), text.slice(start, end)))
    at = end
  }
  if (at < text.length) parts.push({ type: 'text', value: text.slice(at) })
  return parts
}

/**
 * Splits a text into text, reference links and glossary links; throws on an
 * unknown id. Returns null when nothing in the text links.
 */
export const linkReferences = (
  text: string,
  index: ReadonlyMap<string, Reference>,
  where: string,
  terms?: TermLinking,
): ReadonlyArray<Part> | null => {
  const parts: Part[] = []
  let at = 0
  for (const { start, end, id, inRange } of findReferences(text)) {
    const reference = index.get(id)
    if (reference === undefined) {
      throw new Error(`${where}: "${id}" is not a known gate, ADR, decision or issue (D87, D92).`)
    }
    if (start > at) parts.push(...linkTerms(text.slice(at, start), terms))
    parts.push(referenceLink(reference, inRange ? id : reference.label))
    at = end
  }
  if (at < text.length) parts.push(...linkTerms(text.slice(at), terms))
  return parts.some((part) => part.type === 'link') ? parts : null
}

/** Whether a text node follows an `_Avoid_` marker in its paragraph. */
const afterAvoid = (node: unknown, tree: Tree): boolean => {
  const parent = tree.parent(node as never) as Phrasing | undefined
  const index = tree.indexOf(node as never)
  if (parent?.children === undefined || index === undefined) return false
  return parent.children.slice(0, index).some((child) => child.type === 'emphasis' && textOf(child) === 'Avoid')
}

/** The term a glossary entry paragraph defines (`**Term**:`), or null for other text. */
const entryTermOf = (paragraph: Phrasing): string | null => {
  const [first, second] = paragraph.children ?? []
  return paragraph.type === 'paragraph' && first?.type === 'strong' && second?.value?.startsWith(':') === true ? textOf(first) : null
}

const textOf = (node: Phrasing): string =>
  node.value ?? (node.children ?? []).map((child) => textOf(child)).join('')

export const referenceLinks = (repositoryRoot: string): MdastPluginEntry => {
  return ({ fileURL }) => {
    if (!fileURL) return null
    const sourceFile = fileURLToPath(fileURL)
    const repositoryPath = relative(repositoryRoot, sourceFile).split('\\').join('/')
    const index = referenceIndex(repositoryRoot)
    const isDecisionLog = repositoryPath === DECISION_LOG
    const isGlossary = repositoryPath === GLOSSARY
    const find = termFinder(glossaryTerms(repositoryRoot))
    // One set per page; on the glossary page, one per entry (D94).
    const pageTerms: TermLinking = { find, linked: new Set() }
    const entryTerms = new Map<string, TermLinking>()
    return {
      name: 'viviefs-reference-links',
      text(node, context) {
        for (const { type, index } of ancestorsOf(node, context)) {
          if (['heading', 'link', 'linkReference', 'definition'].includes(type)) return
          // The id column of the decision log is the anchor, not a reference.
          if (isDecisionLog && type === 'tableCell' && index === 0) return
          // A glossary entry's own term, in bold, is what is being defined.
          if (isGlossary && type === 'strong') return
        }
        // A glossary entry's Avoid list names words that are not the term.
        if (isGlossary && afterAvoid(node, context)) return
        let terms = pageTerms
        if (isGlossary) {
          let paragraph: { readonly type: string } | undefined = context.parent(node)
          while (paragraph !== undefined && paragraph.type !== 'paragraph') paragraph = context.parent(paragraph as never)
          const entry = paragraph === undefined ? null : entryTermOf(paragraph as Phrasing)
          if (entry !== null) {
            terms = entryTerms.get(entry) ?? { find, linked: new Set(), own: entry }
            entryTerms.set(entry, terms)
          }
        }
        const parts = linkReferences(node.value, index, repositoryPath, terms)
        if (parts !== null) context.replaceNode(node, [...parts])
      },
      link(node, context) {
        const id = onlyReference(textOf(node))
        if (id === null) return
        const reference = index.get(id)
        if (reference === undefined) {
          throw new Error(`${repositoryPath}: link "${textOf(node)}" names an unknown id (D87).`)
        }
        // The reference's own page: the link's target may still be a relative
        // file path that repo-links rewrites in the same pass.
        context.replaceNode(node, referenceLink(reference, reference.label))
      },
      inlineCode(node, context) {
        if (ancestorsOf(node, context).some(({ type }) => ['heading', 'link', 'linkReference'].includes(type))) return
        const path = codePath(repositoryRoot, node.value)
        if (path._tag === 'NotAPath') return
        if (path._tag === 'Missing') {
          if (KEPT_AS_WRITTEN.test(repositoryPath)) return
          throw new Error(`${repositoryPath}: \`${path.path}\` names a repository path that does not exist (D87).`)
        }
        context.replaceNode(node, {
          type: 'link',
          url: path.href,
          title: null,
          children: [{ type: 'inlineCode', value: node.value }],
        })
      },
    }
  }
}

/** Gives each glossary entry its anchor (`#guide-template`, D94). */
export const glossaryAnchors = (): HastPluginEntry => ({ fileURL }) => {
  if (!fileURL || !fileURLToPath(fileURL).endsWith(`/${GLOSSARY}`)) return null
  return {
    name: 'viviefs-glossary-anchors',
    element: {
      filter: ['p'],
      visit(node, context) {
        const [first, second] = node.children
        if (first?.type !== 'element' || first.tagName !== 'strong') return
        if (second?.type !== 'text' || !second.value.startsWith(':')) return
        context.setProperty(node, 'id', glossaryAnchor(context.textContent(first)))
      },
    },
  }
}

/** Gives each decision row of the decision log its anchor (`#d37`, D89). */
export const decisionAnchors = (): HastPluginEntry => () => ({
  name: 'viviefs-decision-anchors',
  element: {
    filter: ['tr'],
    visit(node, context) {
      const first = node.children.find((child) => child.type === 'element')
      // Typographic quotes turn D33' into D33\u2019 before this pass.
      const text = first === undefined ? '' : context.textContent(first).trim().replace(/[\u2019\u2032]/g, "'")
      if (/^D\d+'*$/.test(text)) context.setProperty(node, 'id', decisionAnchor(text))
    },
  },
})
