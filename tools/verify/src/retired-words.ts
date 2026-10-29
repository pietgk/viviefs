/**
 * Retired words in code font (D175, D180'): a word the glossary retired in
 * code font, such as `node` (D199), fails `verify` wherever a living document
 * writes it in code font outside another project's words (D204). Code font
 * was how our old sense was written, so a match is drift. A retired word in
 * plain text is an everyday word, wrong in one sense only, and stays with a
 * reader (D96, D180). The words come from the `_Avoid_` lines, so a later
 * retirement in code font is checked without a change here.
 */

import { DECISION_LOG, inlineItems, proseLines, quotedLines, theirWords } from '@viviefs/references'
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

/**
 * Each line where a retired word is written in code font outside another
 * project's words. The document is read whole, so a comment or a code span
 * may cross a line break; fenced code is left out except a diagram's labels
 * (D180), and a comment is not prose.
 */
export const retiredWordUses = (path: string, content: string, words: ReadonlyArray<RetiredWord>): ReadonlyArray<string> => {
  const byWord = new Map(words.map((word) => [word.word, word]))
  // Fenced code is blank and a diagram line holds its labels, so offsets still give the source line.
  const lines = proseLines(content)
  const quoted = quotedLines(lines)
  const text = lines.join('\n')
  const lineAt = (offset: number) => text.slice(0, offset).split('\n').length
  const marks = theirWords()
  const problems: string[] = []
  for (const item of inlineItems(text)) {
    if (item.kind === 'comment') {
      marks.read(item.text)
      continue
    }
    const retired = byWord.get(item.text)
    const line = lineAt(item.start)
    if (retired === undefined || quoted[line - 1] === true || marks.inside()) continue
    problems.push(
      `${path}:${line}: \`${retired.word}\` is retired by ${retired.decision}; write ${retired.term}, or mark the passage as their words (D204)`,
    )
  }
  return problems
}
