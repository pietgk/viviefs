/**
 * The glossary's size, reported and never failing (D178): how many terms it
 * defines, and which no living document outside it uses. What a newcomer
 * must hold is Start here, the foundation concepts; the rest is reference, so
 * growth is watched at each map's acceptance, not capped.
 */

import { inReferenceScope } from '@viviefs/references'

/** The glossary, at the repository root. */
export const GLOSSARY_FILE = 'GLOSSARY.md'

/** The terms the glossary defines, each `**Term**:` on a line of its own. */
export const glossaryTerms = (glossary: string): ReadonlyArray<string> =>
  [...glossary.matchAll(/^\*\*([^*]+)\*\*:$/gm)].map(([, term = '']) => term)

/**
 * Whether a repository file is a living document a word change rewrites
 * (D173): the documents `pnpm refs` keeps (D86'), less resolved issues, whose
 * Answers are kept as written, and the glossary itself.
 */
export const isLivingDocument = (path: string, content: string): boolean => {
  if (path === GLOSSARY_FILE || !inReferenceScope(path)) return false
  return !/^docs\/issues\/\d{4}-/.test(path) || !/^Status: (?:resolved|closed|wontfix)/m.test(content)
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A term as prose may write it: any case, and its plural. */
const termPattern = (term: string): RegExp => {
  const words = term.split(' ').map(escapeRegExp)
  const last = words.pop() ?? ''
  const plural = /[^aeiou]y$/i.test(last) ? `(?:${last}|${last.slice(0, -1)}ies)` : `${last}(?:e?s)?`
  return new RegExp(`(?<![\\w-])${[...words, plural].join('\\s+')}(?![\\w-])`, 'i')
}

export type GlossaryReport = { readonly terms: number; readonly unused: ReadonlyArray<string> }

/** The number of terms, and those no document in `documents` names. */
export const glossaryReport = (glossary: string, documents: ReadonlyArray<string>): GlossaryReport => {
  const terms = glossaryTerms(glossary)
  const unused = terms.filter((term) => {
    const pattern = termPattern(term)
    return !documents.some((document) => pattern.test(document))
  })
  return { terms: terms.length, unused }
}

/** The note a verify row shows for a step that passed: the step's `note:` line, if it printed one. */
export const reportedNote = (output: string): string | undefined =>
  [...output.matchAll(/^note: (.+)$/gm)].at(-1)?.[1]?.trim()
