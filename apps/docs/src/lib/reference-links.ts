/**
 * References resolved when the site renders (D87, D90). In every Markdown and
 * MDX page:
 *
 * - a gate, ADR or decision id in prose becomes a link that reads as its id
 *   and name, carrying its summary for the preview card;
 * - a reference-style link keeps that preview; a label that starts with the
 *   id but is not the catalog name fails the build (D86');
 * - a link whose label is only an id keeps its target and gets the name;
 * - an inline-code repository path becomes a link to its site page or to
 *   GitHub.
 *
 * Headings, code and text already inside a link are left alone. An unknown
 * id fails the build, and so does a missing path under a checked root,
 * except in evidence notes and research records, which are kept as written.
 *
 * A block quote, or a passage between `<!-- their words: whose -->` and
 * `<!-- /their words -->`, is in another project's words (D204): no glossary
 * term, bare id or path in it is resolved, and a link keeps its target. A
 * reference-style link still resolves. A mark without a name, one inside
 * another, a stray close and a mark left open fail the build.
 */
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findReferenceTokens, theirWords, type Catalog } from '@viviefs/references'
import type { HastPluginEntry, MdastPluginEntry } from 'satteri'
import {
  codePath,
  DECISION_LOG,
  decisionAnchor,
  findReferences,
  GLOSSARY,
  GLOSSARY_LABELS,
  glossaryAnchor,
  glossaryTerms,
  lookupReference,
  referenceCatalog,
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

/** Smartypants curls `'` before this plugin sees the label. The catalog keeps the source character. */
const plainQuotes = (text: string): string => text.replace(/[\u2018\u2019\u2032]/g, "'")

/**
 * A link whose label is a reference: a bare id, or the id and its name.
 * An unknown id fails like a bare id in prose. A name that is not the
 * catalog's name is stale (D86'). A typographic apostrophe is the same name.
 * Anything else is left as written.
 */

const linkedReference = (label: string, catalog: Catalog, where: string, owned: boolean): Reference | undefined => {
  const trimmed = label.trim()
  const token = findReferenceTokens(trimmed)[0]
  if (token === undefined || token.start !== 0) return undefined
  const key = token.kind === 'id' ? token.id : `${token.from}-${token.to}`
  const reference = lookupReference(catalog, key)
  const rest = trimmed.slice(token.end)
  if (reference === undefined) {
    if (rest === '') throw new Error(`${where}: link "${trimmed}" names an unknown id (D87).`)
    return undefined
  }
  const suffix = reference.label.slice(reference.id.length)
  const named = rest === '' || plainQuotes(rest) === plainQuotes(suffix)
  // A reference-style link is one we wrote, so a drifted name is a stale label.
  // A URL link that merely starts with an id, such as "P10 design review", is not.
  if (!named) {
    if (!owned) return undefined
    throw new Error(`${where}: link "${trimmed}" has a stale name for ${reference.id}; run \`pnpm refs fix\` (D86').`)
  }
  return reference
}

/** Whether a text node follows a `_Not_` or `_Avoid_` label in its paragraph (D174). */
const afterOtherSense = (node: unknown, tree: Tree): boolean => {
  const parent = tree.parent(node as never) as Phrasing | undefined
  const index = tree.indexOf(node as never)
  if (parent?.children === undefined || index === undefined) return false
  return parent.children.slice(0, index).some((child) => child.type === 'emphasis' && ['Not', 'Avoid'].includes(textOf(child)))
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
    const catalog = referenceCatalog(repositoryRoot)
    const isDecisionLog = repositoryPath === DECISION_LOG
    const isGlossary = repositoryPath === GLOSSARY
    const find = termFinder(glossaryTerms(repositoryRoot))
    // One set per page; on the glossary page, one per entry (D94).
    const pageTerms: TermLinking = { find, linked: new Set() }
    const entryTerms = new Map<string, TermLinking>()
    // Visitors run in document order, so the marks read so far say whether a node is inside one.
    const marks = theirWords()
    const readMarker = (comment: string) => {
      const problem = marks.read(comment)
      if (problem !== undefined) throw new Error(`${repositoryPath}: ${problem}`)
    }
    const inTheirWords = (node: unknown, tree: Tree): boolean =>
      marks.inside() || ancestorsOf(node, tree).some(({ type }) => type === 'blockquote')
    return {
      name: 'viviefs-reference-links',
      html(node) {
        readMarker(node.value)
      },
      mdxFlowExpression(node) {
        readMarker(node.value)
      },
      mdxTextExpression(node) {
        readMarker(node.value)
      },
      after() {
        const problem = marks.end()
        if (problem !== undefined) throw new Error(`${repositoryPath}: ${problem}`)
      },
      text(node, context) {
        if (inTheirWords(node, context)) return
        for (const { type, index } of ancestorsOf(node, context)) {
          if (['heading', 'link', 'linkReference', 'definition'].includes(type)) return
          // The id column of the decision log is the anchor, not a reference.
          if (isDecisionLog && type === 'tableCell' && index === 0) return
          // A glossary entry's own term, in bold, is what is being defined.
          if (isGlossary && type === 'strong') return
        }
        // A glossary entry's Not and Avoid lines name other senses and other words.
        if (isGlossary && afterOtherSense(node, context)) return
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
        if (inTheirWords(node, context)) return
        const reference = linkedReference(textOf(node), catalog, repositoryPath, false)
        if (reference === undefined) return
        context.replaceNode(node, referenceLink(reference, reference.label))
      },
      linkReference(node, context) {
        const reference = linkedReference(textOf(node), catalog, repositoryPath, true)
        if (reference === undefined) return
        context.replaceNode(node, referenceLink(reference, reference.label))
      },
      inlineCode(node, context) {
        if (inTheirWords(node, context)) return
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

/**
 * Gives each glossary entry its anchor (`#guide-template`, D94), and puts its
 * hover line, its precise part and each `_Like_`, `_Not_` and `_Avoid_` line
 * on lines of their own (D94', D174).
 */
export const glossaryAnchors = (): HastPluginEntry => ({ fileURL }) => {
  if (!fileURL || !fileURLToPath(fileURL).endsWith(`/${GLOSSARY}`)) return null
  const lineBreak = () => ({ type: 'element' as const, tagName: 'br', properties: {}, children: [] })
  return {
    name: 'viviefs-glossary-anchors',
    element: {
      filter: ['p'],
      visit(node, context) {
        const [first, second] = node.children
        if (first?.type !== 'element' || first.tagName !== 'strong') return
        if (second?.type !== 'text' || !second.value.startsWith(':')) return
        context.setProperty(node, 'id', glossaryAnchor(context.textContent(first)))
        const children = node.children.slice(1)
        for (const [index, child] of children.entries()) {
          const before = children[index - 1]
          const startsLine = before?.type === 'text' && before.value.endsWith('\n')
          if (startsLine && child.type === 'element' && child.tagName === 'em' && GLOSSARY_LABELS.some((label) => label === context.textContent(child))) {
            context.insertBefore(child, lineBreak())
          }
        }
        // The hover line is the entry's first line: it ends at the line break after the one that follows `:`.
        const from = (child: (typeof children)[number]) => (child === second ? second.value.indexOf('\n') + 1 : 0)
        const ending = children.find((child) => child.type === 'text' && child.value.indexOf('\n', from(child)) >= 0)
        if (ending?.type !== 'text') return
        const at = ending.value.indexOf('\n', from(ending))
        const rest = ending.value.slice(at + 1)
        const next = children[children.indexOf(ending) + 1]
        const labelNext = next?.type === 'element' && next.tagName === 'em' && GLOSSARY_LABELS.some((label) => label === context.textContent(next))
        // A label on the next line already starts a line of its own.
        if (rest === '' && labelNext) return
        context.replaceNode(ending, [{ type: 'text', value: ending.value.slice(0, at) }, lineBreak(), { type: 'text', value: `\n${rest}` }])
      },
    },
  }
}

/** Gives each decision row of the decision log its anchor (`#d37`, D89). A source `<a id>` is dropped so the row keeps one id. */
export const decisionAnchors = (): HastPluginEntry => () => ({
  name: 'viviefs-decision-anchors',
  element: {
    filter: ['tr'],
    visit(node, context) {
      const first = node.children.find((child) => child.type === 'element')
      // Typographic quotes turn D33' into D33\u2019 before this pass.
      const text = first === undefined ? '' : context.textContent(first).trim().replace(/[\u2019\u2032]/g, "'")
      if (!/^D\d+'*$/.test(text) || first?.type !== 'element') return
      const id = decisionAnchor(text)
      context.setProperty(node, 'id', id)
      // Sätteri keeps an empty `<a id>` as two raw nodes. The row carries the id.
      for (let index = first.children.length - 1; index >= 0; index--) {
        const child = first.children[index]
        const previous = first.children[index - 1]
        const value = child?.type === 'raw' && 'value' in child && typeof child.value === 'string' ? child.value : undefined
        const before =
          previous?.type === 'raw' && 'value' in previous && typeof previous.value === 'string' ? previous.value : undefined
        if (value === `<a id="${id}"></a>`) context.removeChildAt(first, index)
        else if (value === '</a>' && before === `<a id="${id}">`) {
          context.removeChildAt(first, index)
          context.removeChildAt(first, index - 1)
          index -= 1
        }
      }
    },
  },
})
