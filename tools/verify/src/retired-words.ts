/**
 * Retired words in code font (D175, D180'): a word the glossary retired in
 * code font, such as `node` (D199), fails `verify` wherever a living document
 * writes it in code font outside another project's words (D204). Code font
 * was how our old sense was written, so a match is drift. A retired word in
 * plain text is an everyday word, wrong in one sense only, and stays with a
 * reader (D96, D180). The words come from the `_Avoid_` lines, so a later
 * retirement in code font is checked without a change here.
 */

import { commentsIn, DECISION_LOG, isQuotedLine, theirWords } from '@viviefs/references'
import { isLivingDocument } from './glossary-report.ts'

export type RetiredWord = {
  /** The word as code font writes it. */
  readonly word: string
  /** The decision that retired it. */
  readonly decision: string
  /** The entry whose `_Avoid_` line names it: the word to write instead. */
  readonly term: string
}

/** The code-font words the `_Avoid_` lines retire: `` `node` (our word until [D199][D199]) ``. */
export const retiredCodeWords = (glossary: string): ReadonlyArray<RetiredWord> =>
  [...glossary.matchAll(/^\*\*([^*]+)\*\*:\n((?:.+\n?)*)/gm)].flatMap(([, term = '', body = '']) => {
    const avoid = /^_Avoid_:(.*)$/m.exec(body)?.[1] ?? ''
    return [...avoid.matchAll(/`([^`]+)` \((?:alone, )?our word until \[(D\d+'*)/g)].map(([, word = '', decision = '']) => ({
      word,
      decision,
      term,
    }))
  })

/**
 * Whether a file is read for retired words: a living document (D173), less
 * the decision log, whose rows are kept as written.
 */
export const isCheckedForRetiredWords = (path: string, content: string): boolean =>
  path !== DECISION_LOG && isLivingDocument(path, content)

/** Each line where a retired word is written in code font outside another project's words. */
export const retiredWordUses = (path: string, content: string, words: ReadonlyArray<RetiredWord>): ReadonlyArray<string> => {
  const byWord = new Map(words.map((word) => [word.word, word]))
  const marks = theirWords()
  const problems: string[] = []
  let fence: string | undefined
  for (const [index, line] of content.split('\n').entries()) {
    const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence === undefined && opener !== undefined) fence = opener
    else if (fence !== undefined && line.trim().startsWith(fence)) fence = undefined
    if (fence !== undefined || opener !== undefined) continue
    const quoted = isQuotedLine(line)
    // Comments and code spans in the order they stand, so each span is read with the marks before it.
    const spans = [...line.matchAll(/(`+)([^`]+?)\1/g)].map((span) => ({ at: span.index, code: span[2]?.trim() ?? '' }))
    const marked = commentsIn(line).map(({ start, comment }) => ({ at: start, comment }))
    for (const item of [...spans, ...marked].sort((left, right) => left.at - right.at)) {
      if ('comment' in item) {
        marks.read(item.comment)
        continue
      }
      const retired = byWord.get(item.code)
      if (retired === undefined || quoted || marks.inside()) continue
      problems.push(
        `${path}:${index + 1}: \`${retired.word}\` is retired by ${retired.decision}; write ${retired.term}, or mark the passage as their words (D204)`,
      )
    }
  }
  return problems
}
