// Named references in the markdown itself (D86'). Expected text is written out,
// not derived the way the rewriter derives it.
import { describe, expect, it } from '@effect/vitest'
import { DECISION_LOG, GATE_TABLE_DOC, type Catalog, type Reference } from './catalog.ts'
import { MDX_REFERENCES_MARKER, REFERENCES_MARKER, inReferenceScope, referenceProblems, rewriteDocument } from './rewrite.ts'

const reference = (
  id: string,
  label: string,
  path: string,
  anchor: string,
  kind: Reference['kind'],
): Reference => ({ id, kind, label, summary: label, meta: '', path, anchor })

const catalog: Catalog = {
  references: new Map([
    reference('D107', 'D107 The Presenter pattern', DECISION_LOG, 'd107', 'Decision'),
    reference('D108', 'D108 Query as data', DECISION_LOG, 'd108', 'Decision'),
    reference('D117', 'D117 Withdraw trust', DECISION_LOG, 'd117', 'Decision'),
    reference('P04', 'P04 Log store conformance', GATE_TABLE_DOC, 'p04', 'Gate'),
    reference('P05', 'P05 Changesets and projections', GATE_TABLE_DOC, 'p05', 'Gate'),
    reference('ADR-0033', 'ADR-0033 The Presenter pattern', 'docs/adr/0099-the-presenter-pattern.md', '', 'ADR'),
    reference('I65', 'I65 Named references in markdown', 'docs/issues/9999-named-references.md', '', 'Issue'),
  ].map((item) => [item.id, item])),
  sections: [{ heading: 'Presenters and origin trust', from: 'D107', to: 'D117', anchor: 'd107-d117' }],
}

const FILE = 'docs/adr/0098-origin-trust.md'

const block = (lines: ReadonlyArray<string>): string =>
  `\n<!-- References: written by pnpm refs fix; do not edit by hand. -->\n\n${lines.join('\n')}\n`

const rewritten = (source: string, file = FILE) => rewriteDocument(source, file, catalog)

describe('pnpm refs fix', () => {
  it('names the first mention in a paragraph and links the rest as bare ids', () => {
    const source = 'See D107. Then D107 again.\n\nD107 opens the next paragraph.\n'
    expect(rewritten(source).text).toBe(
      'See [D107 The Presenter pattern][D107]. Then [D107][D107] again.\n\n[D107 The Presenter pattern][D107] opens the next paragraph.\n' +
        block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107']),
    )
  })

  it('names each list item and each table cell on its own', () => {
    expect(rewritten('- D107 once\n- D107 again\n').text).toBe(
      '- [D107 The Presenter pattern][D107] once\n- [D107 The Presenter pattern][D107] again\n' +
        block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107']),
    )
    expect(rewritten('| D107 then D107 | D107 |\n').text).toBe(
      '| [D107 The Presenter pattern][D107] then [D107][D107] | [D107 The Presenter pattern][D107] |\n' +
        block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107']),
    )
  })

  it('names a range that is one decision section, and names both ends otherwise', () => {
    expect(rewritten('D107-D117 settled it. D107-D108 did not.\n').text).toBe(
      '[D107-D117 Presenters and origin trust][D107-D117] settled it. [D107 The Presenter pattern][D107]-[D108 Query as data][D108] did not.\n' +
        block([
          '[D107]: ../plan/bootstrap/02-decision-log.md#d107',
          '[D107-D117]: ../plan/bootstrap/02-decision-log.md#d107-d117',
          '[D108]: ../plan/bootstrap/02-decision-log.md#d108',
        ]),
    )
    expect(rewritten('P04, then P04-P05.\n').text).toBe(
      '[P04 Log store conformance][P04], then [P04][P04]-[P05 Changesets and projections][P05].\n' +
        block([
          '[P04]: ../plan/bootstrap/06-qualification-gates.md#p04',
          '[P05]: ../plan/bootstrap/06-qualification-gates.md#p05',
        ]),
    )
  })

  it('updates a stale label and leaves the second full label as a bare id', () => {
    const source = '[D107 Old name][D107] and [D107 The Presenter pattern][D107].\n'
    const text = rewritten(source).text
    expect(text).toBe(
      '[D107 The Presenter pattern][D107] and [D107][D107].\n' + block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107']),
    )
    expect(rewritten(text).text).toBe(text)
  })

  it('skips code, headings, frontmatter and existing links', () => {
    const source = [
      '---',
      'gates: [P05]',
      '---',
      '',
      '## D107 notes',
      '',
      '`D107` and',
      '',
      '```',
      'D107',
      '```',
      '',
      'See [notes on D107](https://example.com/D107) and D107.',
      '',
    ].join('\n')
    expect(rewritten(source).text).toBe(
      [
        '---',
        'gates: [P05]',
        '---',
        '',
        '## D107 notes',
        '',
        '`D107` and',
        '',
        '```',
        'D107',
        '```',
        '',
        'See [notes on D107](https://example.com/D107) and [D107 The Presenter pattern][D107].',
        '',
      ].join('\n') + block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107']),
    )
  })

  it('writes paths relative to the file, and a hash when the link stays here', () => {
    expect(rewritten('ADR 0033 and I65.\n', FILE).text).toContain(
      '[ADR-0033]: 0099-the-presenter-pattern.md\n[I65]: ../issues/9999-named-references.md\n',
    )
    expect(rewritten('See D108.\n', DECISION_LOG).text).toContain('[D108]: #d108\n')
    expect(rewritten('See D107.\n', 'FIXTURE.md').text).toContain('[D107]: docs/plan/bootstrap/02-decision-log.md#d107\n')
  })

  it('anchors decision rows and the section, and gate rows, without linking the row id', () => {
    const log = ['## Presenters and origin trust (2026-10-08)', '', '| D107 | The Presenter pattern | A screen asks. | Because D108. |', ''].join('\n')
    expect(rewritten(log, DECISION_LOG).text).toBe(
      [
        '<a id="d107-d117"></a>',
        '## Presenters and origin trust (2026-10-08)',
        '',
        '| <a id="d107"></a>D107 | The Presenter pattern | A screen asks. | Because [D108 Query as data][D108]. |',
        '',
      ].join('\n') + block(['[D108]: #d108']),
    )
    const gates = '| **P05** Changesets and projections | See D107. |\n'
    expect(rewritten(gates, GATE_TABLE_DOC).text).toBe(
      '| <a id="p05"></a>**P05** Changesets and projections | See [D107 The Presenter pattern][D107]. |\n' +
        block(['[D107]: 02-decision-log.md#d107']),
    )
  })

  it('writes a JSX comment in an mdx file, which MDX can parse', () => {
    const once = rewritten('See D107.\n', 'apps/docs/src/guide-template/99-fixture.mdx')
    expect(once.text).toContain(MDX_REFERENCES_MARKER)
    expect(once.text).not.toContain('<!--')
    expect(rewritten(once.text, 'apps/docs/src/guide-template/99-fixture.mdx').text).toBe(once.text)
  })

  it('keeps a prose mention of the definitions marker and still writes one block', () => {
    const source = `The block starts with \`${REFERENCES_MARKER}\`.\n\nSee D107.\n`
    const once = rewritten(source)
    expect(rewritten(once.text).text).toBe(once.text)
    expect(once.text.match(/written by pnpm refs fix/g)).toHaveLength(2)
    const doubled = `${once.text}${once.text.slice(once.text.lastIndexOf(REFERENCES_MARKER))}`
    expect(rewritten(doubled).text).toBe(once.text)
  })

  it('merges a block left above text appended later into the one block at the end', () => {
    const once = rewritten('See D107.\n').text
    const appended = `${once}\nA comment added later names D108.\n`
    const fixed = rewritten(appended).text
    expect(fixed).toBe(
      'See [D107 The Presenter pattern][D107].\n\nA comment added later names [D108 Query as data][D108].\n' +
        block(['[D107]: ../plan/bootstrap/02-decision-log.md#d107', '[D108]: ../plan/bootstrap/02-decision-log.md#d108']),
    )
    expect(referenceProblems(appended, FILE, catalog)).toEqual([`${FILE}: run \`pnpm refs fix\``])
    const atStart = rewritten(`${REFERENCES_MARKER}\n\n[D107]: x.md\n\nSee D107.\n`).text
    expect(atStart).toBe(once)
    const notABlock = `${REFERENCES_MARKER}\nSee D107.\n`
    expect(rewritten(notABlock).text.startsWith(`${REFERENCES_MARKER}\nSee [D107 The Presenter pattern][D107].\n`)).toBe(true)
    const fenced = `\`\`\`md\n${REFERENCES_MARKER}\n\n[D107]: x.md\n\`\`\`\n\nSee D107.\n`
    expect(rewritten(fenced).text.startsWith(`\`\`\`md\n${REFERENCES_MARKER}\n\n[D107]: x.md\n\`\`\`\n`)).toBe(true)
  })

  it('changes nothing the second time, and reports an unknown id without inventing a link', () => {
    const source = 'See D107.\n'
    const once = rewritten(source)
    expect(rewritten(once.text).text).toBe(once.text)
    expect(once.problems).toEqual([])
    const unknown = rewritten('D999 stays.\n')
    expect(unknown.text).toBe('D999 stays.\n')
    expect(unknown.problems).toEqual([`${FILE}: "D999" is not a known gate, ADR, decision or issue`])
  })

  it('fails verify when a fix would change the file, and names the command', () => {
    expect(referenceProblems('See D107.\n', FILE, catalog)).toEqual([`${FILE}: run \`pnpm refs fix\``])
    const fixed = rewritten('See D107.\n').text
    expect(referenceProblems(fixed, FILE, catalog)).toEqual([])
    expect(referenceProblems('D999 stays.\n', FILE, catalog)).toEqual([
      `${FILE}: "D999" is not a known gate, ADR, decision or issue`,
    ])
  })

  it('keeps dated records and inventory rows out of scope', () => {
    expect(inReferenceScope('docs/adr/0099-the-presenter-pattern.md')).toBe(true)
    expect(inReferenceScope('docs/plan/bootstrap/99-not-a-page.md')).toBe(true)
    expect(inReferenceScope('docs/plan/vivief-inventory/rows/0001.md')).toBe(false)
    expect(inReferenceScope('docs/evidence/2099-01-01-p04.md')).toBe(false)
    expect(inReferenceScope('docs/research/2099-01-01-not-a-record.md')).toBe(false)
    expect(inReferenceScope('.agents/skills/scaffold-exercises/SKILL.md')).toBe(true)
    expect(inReferenceScope('.agents/skills/tdd/SKILL.md')).toBe(false)
    expect(inReferenceScope('apps/docs/src/guide-template/index.mdx')).toBe(true)
  })
})
