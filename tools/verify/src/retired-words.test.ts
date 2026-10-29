// A word retired in code font (D175, D180'): read from the glossary's
// `_Avoid_` lines, and failed in a living document wherever it is not in
// another project's words (D204).
import { describe, expect, it } from '@effect/vitest'
import { DECISION_LOG } from '@viviefs/references'
import { GLOSSARY_FILE } from './glossary-report.ts'
import { isCheckedForRetiredWords, retiredCodeWords, retiredWordUses } from './retired-words.ts'

const glossary = [
  '**Sync node**:',
  'One installation of an app that keeps an organization\'s data.',
  '_Not_: Node.js, the web\'s DOM `Node`.',
  '_Avoid_: `node` (our word until [D199][D199]), peer',
  '',
  '**Workflow runner**:',
  'What runs the workflows of one engine.',
  '_Avoid_: worker (our word until [D186 Workflow engine and workflow runner][D186]), runner (alone)',
  '',
  '**Sync**:',
  'Copying changesets between sync nodes.',
  '',
  '**Sync cursor**:',
  'How far a sync node has read.',
  '_Avoid_: `cursor` (alone, our word until [D193][D193])',
  '',
].join('\n')

const words = retiredCodeWords(glossary)

describe('retired words in code font', () => {
  it('reads the code-font words an Avoid line retires, with the decision and the word to write', () => {
    expect(words).toEqual([
      { word: 'node', decision: 'D199', term: 'Sync node' },
      { word: 'cursor', decision: 'D193', term: 'Sync cursor' },
    ])
  })

  it('fails one in code font in prose, a table or a diagram-free list', () => {
    expect(retiredWordUses('docs/adr/0099-x.md', 'Each `node` keeps the log.\n\n| a | `cursor` |\n', words)).toEqual([
      'docs/adr/0099-x.md:1: `node` is retired by D199; write Sync node, or mark the passage as their words (D204)',
      'docs/adr/0099-x.md:3: `cursor` is retired by D193; write Sync cursor, or mark the passage as their words (D204)',
    ])
  })

  it('leaves plain words, longer code and fenced code alone', () => {
    const text = 'Bare node and cursor are plain English.\n\n`node:fs` and `nodes` and `node --test`.\n\n```sh\nnode\n```\n'
    expect(retiredWordUses('docs/plan/x.md', text, words)).toEqual([])
  })

  it('leaves one in a block quote or a their-words passage alone', () => {
    const text = [
      '> Each `node` keeps the log.',
      '',
      '<!-- their words: vivief -->',
      '',
      'A `node` in vivief.',
      '',
      '<!-- /their words -->',
      '',
      'vivief says <!-- their words: vivief -->`node`<!-- /their words --> here.',
      '',
      '{/* their words: vivief */}',
      '',
      'A `cursor` in a guide.',
      '',
      '{/* /their words */}',
    ].join('\n')
    expect(retiredWordUses('docs/plan/x.md', text, words)).toEqual([])
  })

  it('leaves one in a comment alone, since a comment is not prose', () => {
    expect(retiredWordUses('docs/plan/x.md', 'Text <!-- a `node` note --> here.\n', words)).toEqual([])
  })

  it('reads a marker or a code span across a line break, and names the line the span starts on', () => {
    const wrapped = '<!-- their words: vivief\n-->\n\nA `node`.\n\n<!-- /their words -->\n'
    expect(retiredWordUses('docs/plan/x.md', wrapped, words)).toEqual([])
    expect(retiredWordUses('docs/plan/x.md', 'Intro.\n\nA `\nnode\n` here.\n', words)).toEqual([
      'docs/plan/x.md:3: `node` is retired by D199; write Sync node, or mark the passage as their words (D204)',
    ])
    expect(retiredWordUses('docs/plan/x.md', '> A quote\nwith a `node` lazily.\n', words)).toEqual([])
  })

  it('checks living documents, not the glossary, the decision log or a resolved issue', () => {
    expect(isCheckedForRetiredWords('docs/adr/0099-x.md', '')).toBe(true)
    expect(isCheckedForRetiredWords('apps/docs/src/content/docs/guides/x/index.mdx', '')).toBe(true)
    expect(isCheckedForRetiredWords(GLOSSARY_FILE, '')).toBe(false)
    expect(isCheckedForRetiredWords(DECISION_LOG, '')).toBe(false)
    expect(isCheckedForRetiredWords('docs/issues/0099-x.md', 'Status: resolved\n')).toBe(false)
    expect(isCheckedForRetiredWords('docs/research/2026-10-29-x.md', '')).toBe(false)
  })
})
