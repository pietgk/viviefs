// The guides check (D62, D63, D66, D67, D81-D87). A fixture repository holds
// a template and one guide that follows it; every rule has a case that breaks
// it and must be reported, next to the guide that passes.
import { describe, expect, it } from '@effect/vitest'
import { GATE_TABLE, GATE_TABLE_DOC, guideProblems, headingsMatch, observedOf, type GuidesRepository } from './guides.ts'

const T = 'apps/docs/src/guide-template'
const G = 'apps/docs/src/content/docs/guides/log-store'

const fixture: Record<string, string> = {
  [`${T}/index.mdx`]:
    '---\nslug: reference/guide-template\ntitle: Guide template\npattern: x\nadrs: []\ngates: []\nexemplar: []\nexercises: exercises/x\nstatus: draft\n---\n\n## What it is\n\n## Status\n',
  [`${T}/concepts.mdx`]: '---\nslug: s\ntitle: Concepts\n---\n\n## [One heading per concept]\n',
  [`${T}/lessons/01-lesson.mdx`]:
    '---\nslug: s\ntitle: A lesson\nlesson: 1\nevidence: []\nsource:\n  title: t\n  href: https://example.com\n---\n\n## Recall first\n\n## Your turn\n',
  [`${G}/index.mdx`]:
    "---\ntitle: Log store\npattern: log-store\nadrs: ['0011']\ngates: [P04, P05]\nexemplar: [libs/datom]\nexercises: exercises/log-store\nstatus: draft\n---\n\n## What it is\n\nProven by P04.\n\n## Status\n",
  [`${G}/concepts.mdx`]: '---\ntitle: Concepts\n---\n\n## Datom\n\n## HLC\n\n```ts\n## not a heading\n```\n',
  [`${G}/lessons/01-fact.mdx`]:
    '---\ntitle: A fact\nlesson: 1\nevidence: [docs/evidence/2026-09-20-p04.md]\nsource:\n  title: t\n  href: https://example.com\n---\n\n## Recall first\n\n## Your turn\n',
  'docs/adr/0011-store.md':
    '# ADR-0011: Log store pattern\n\nStatus: Qualified\n\nQualifying gate: P04, P05\n\n## Outcome\n\n### Observed\n\nP04 passed.\n',
  'docs/adr/0001-record.md': '# ADR-0001: Record\n\nStatus: Proposed, unverified\n\nQualifying gate: none (process)\n',
  'docs/evidence/2026-09-20-p04.md': '# P04\n',
  'libs/datom/project.json': JSON.stringify({ name: 'datom', metadata: { guides: ['log-store'] } }),
  'libs/datom/package.json': JSON.stringify({ exports: { '.': { import: './src/index.ts' } } }),
  'libs/datom/README.md': 'Guide: [Log store](../../apps/docs/src/content/docs/guides/log-store/index.mdx)\n',
  'libs/datom/src/index.ts': '/**\n * Guide: apps/docs/src/content/docs/guides/log-store/index.mdx\n */\n',
  [GATE_TABLE]: "  {\n    gate: 'P04',\n    name: 'Log store conformance',\n    claim:\n      'The log store\\'s contract holds',\n",
  [GATE_TABLE_DOC]: "| **P04** Log store conformance | The log store's contract holds | Append |\n",
  'exercises/log-store/project.json': JSON.stringify({ tags: ['kind:tool'] }),
  'exercises/log-store/01.01-append/problem/send.ts': '',
  'exercises/log-store/01.01-append/solution/send.ts': '',
  'exercises/log-store/01.01-append/exercise.test.ts': '',
}

const repository = (changes: Record<string, string | undefined> = {}): GuidesRepository => {
  const files = { ...fixture, ...changes }
  const paths = Object.keys(files).filter((path) => files[path] !== undefined)
  return {
    paths,
    read: (path) => files[path],
    gates: ['P04', 'P05', 'P13'],
    patterns: ['log-store', 'changesets'],
  }
}

const problemsWith = (changes: Record<string, string | undefined>) => guideProblems(repository(changes)).join('\n')

const edit = (path: string, from: string, to: string) => {
  const source = fixture[path] ?? ''
  if (!source.includes(from)) throw new Error(`fixture ${path} has no "${from}"`)
  return { [path]: source.replace(from, to) }
}

describe('the guides check', () => {
  it('passes a guide that follows the template', () => {
    expect(guideProblems(repository())).toEqual([])
  })

  it('derives headings from the template; a bracketed heading is one or more', () => {
    expect(headingsMatch(['A', '[Any]', 'B'], ['A', 'x', 'y', 'B'])).toBe(true)
    expect(headingsMatch(['A', '[Any]', 'B'], ['A', 'B'])).toBe(false)
    expect(headingsMatch(['A', 'B'], ['B', 'A'])).toBe(false)
  })

  it('fails a missing page, a page the template lacks, and headings out of shape', () => {
    expect(problemsWith({ [`${G}/concepts.mdx`]: undefined })).toMatch(/no concepts\.mdx, a page of the guide template/)
    expect(problemsWith({ [`${G}/extra.mdx`]: '---\ntitle: Extra\n---\n' })).toMatch(/extra\.mdx: not a page of the guide template/)
    expect(problemsWith(edit(`${G}/index.mdx`, '## Status', '## State'))).toMatch(/index\.mdx: headings are \[What it is, State\]/)
    expect(problemsWith({ [`${G}/lessons/01-fact.mdx`]: undefined })).toMatch(/no lesson/)
  })

  it('changes the rule when the template changes', () => {
    expect(problemsWith(edit(`${T}/concepts.mdx`, '## [One heading per concept]', '## Overview'))).toMatch(
      /concepts\.mdx: headings are \[Datom, HLC\]/,
    )
  })

  it('fails missing frontmatter keys, and a template-only slug in a guide', () => {
    expect(problemsWith(edit(`${G}/index.mdx`, 'status: draft\n', ''))).toMatch(/frontmatter lacks status/)
    expect(problemsWith(edit(`${G}/concepts.mdx`, 'title: Concepts\n', 'title: Concepts\nslug: x\n'))).toMatch(
      /frontmatter has slug/,
    )
  })

  it("fails gates that are not the ADRs' qualifying gates, and unknown ADRs or gates", () => {
    expect(problemsWith(edit(`${G}/index.mdx`, 'gates: [P04, P05]', 'gates: [P04]'))).toMatch(
      /qualifying gates are \[P04, P05\]/,
    )
    expect(problemsWith(edit(`${G}/index.mdx`, "adrs: ['0011']", "adrs: ['0099']"))).toMatch(/ADR 0099 does not exist/)
    expect(problemsWith(edit(`${G}/index.mdx`, 'gates: [P04, P05]', 'gates: [P04, P05, P99]'))).toMatch(
      /gate P99 is not in the gate table/,
    )
  })

  it('fails a pattern that is not the folder or not in the catalogue', () => {
    expect(problemsWith(edit(`${G}/index.mdx`, 'pattern: log-store', 'pattern: logs'))).toMatch(/pattern is logs, its folder is log-store/)
  })

  it('checks exemplar links both ways (D67, D84)', () => {
    expect(problemsWith({ 'libs/datom/project.json': JSON.stringify({ metadata: { guides: [] } }) })).toMatch(
      /exemplar libs\/datom does not list "log-store" in metadata\.guides/,
    )
    expect(problemsWith({ 'libs/datom/README.md': '# datom\n' })).toMatch(/README\.md: no link to guides\/log-store\//)
    expect(problemsWith({ 'libs/datom/src/index.ts': 'export {}\n' })).toMatch(/index\.ts: TSDoc does not name guides\/log-store\//)
    expect(
      problemsWith({ 'libs/datom/project.json': JSON.stringify({ metadata: { guides: ['log-store', 'changesets'] } }) }),
    ).toMatch(/metadata\.guides names "changesets", which has no guide/)
    expect(problemsWith({ 'libs/sync/project.json': JSON.stringify({ metadata: { guides: ['log-store'] } }) })).toMatch(
      /whose exemplar does not list libs\/sync/,
    )
  })

  it('keeps ADR and guide statuses in agreement (D63)', () => {
    const accepted = edit(`${G}/index.mdx`, 'status: draft', 'status: accepted\naccepted: 2026-10-02')
    expect(problemsWith(accepted)).toMatch(/an accepted guide's ADR 0011 is Qualified, not Accepted/)
    expect(problemsWith(edit(`${G}/index.mdx`, 'status: draft', 'status: accepted'))).toMatch(/has an accepted date/)
    const adr = edit('docs/adr/0011-store.md', 'Status: Qualified', 'Status: Accepted')
    expect(problemsWith(adr)).toMatch(/0011-store\.md: Accepted, but no accepted guide names it/)
    expect(problemsWith({ ...adr, ...accepted })).not.toMatch(/0011/)
    const unqualified = {
      ...accepted,
      'docs/adr/0011-store.md': '# ADR-0011: Log store pattern\n\nStatus: Accepted\n\nQualifying gate: P04, P05\n\n### Observed\n',
    }
    expect(problemsWith(unqualified)).toMatch(/only a Qualified ADR/)
    expect(problemsWith(edit('docs/adr/0001-record.md', 'Status: Proposed, unverified', 'Status: Accepted'))).not.toMatch(
      /0001-record\.md: Accepted, but no accepted guide/,
    )
  })

  it('names every ADR on one guide only (D82)', () => {
    const second = Object.fromEntries(
      Object.entries(fixture)
        .filter(([path]) => path.startsWith(`${G}/`))
        .map(([path, source]) => [
          path.replace('/log-store/', '/changesets/'),
          source.replace('pattern: log-store', 'pattern: changesets').replace('exercises: exercises/log-store\n', ''),
        ]),
    )
    expect(problemsWith(second)).toMatch(/ADR 0011 is named by guides changesets, log-store/)
  })

  it('checks lessons: numbering, evidence', () => {
    expect(problemsWith(edit(`${G}/lessons/01-fact.mdx`, 'evidence: [docs/evidence/2026-09-20-p04.md]', 'evidence: []'))).toMatch(
      /cites at least one evidence note/,
    )
    expect(
      problemsWith(edit(`${G}/lessons/01-fact.mdx`, 'evidence: [docs/evidence/2026-09-20-p04.md]', 'evidence: [docs/evidence/none.md]')),
    ).toMatch(/evidence docs\/evidence\/none\.md is not a note/)
    expect(problemsWith(edit(`${G}/lessons/01-fact.mdx`, 'lesson: 1', 'lesson: 2'))).toMatch(/lesson is 2, its file says 1/)
  })

  it('checks the exercise layout and its pairing with lessons (D66, D81)', () => {
    expect(problemsWith({ 'exercises/log-store/01.01-append/exercise.test.ts': undefined })).toMatch(/no exercise\.test\.ts/)
    expect(problemsWith({ 'exercises/log-store/01.01-append/problem/send.ts': undefined })).toMatch(/no problem\//)
    expect(problemsWith({ 'exercises/log-store/1.1-x/exercise.test.ts': '' })).toMatch(/1\.1-x: not an exercise folder/)
    expect(
      problemsWith({
        'exercises/log-store/03.01-later/problem/a.ts': '',
        'exercises/log-store/03.01-later/solution/a.ts': '',
        'exercises/log-store/03.01-later/exercise.test.ts': '',
      }),
    ).toMatch(/sections 1, 3; sections are numbered from 01 without gaps/)
    expect(
      problemsWith({
        'exercises/log-store/02.01-x/problem/a.ts': '',
        'exercises/log-store/02.01-x/solution/a.ts': '',
        'exercises/log-store/02.01-x/exercise.test.ts': '',
      }),
    ).toMatch(/lessons \[1\] and exercise sections \[1, 2\] pair one to one/)
    expect(problemsWith({ 'exercises/log-store/project.json': JSON.stringify({ tags: ['kind:lib'] }) })).toMatch(/tagged kind:tool/)
  })

  it('fails when the plan names a gate differently from the gate table (D86)', () => {
    expect(problemsWith({ [GATE_TABLE_DOC]: '| **P04** Log store |\n' })).toMatch(/does not name P04 "Log store conformance"/)
    expect(problemsWith({ [GATE_TABLE_DOC]: '| **P04** Log store conformance | Something else | x |\n' })).toMatch(
      /P04's fact to establish is not its claim/,
    )
    expect(problemsWith({ [GATE_TABLE]: "  {\n    gate: 'P04',\n    name: 'Log store conformance',\n" })).toMatch(/P04 has no claim/)
  })

  it("reads an ADR's Observed section up to the next heading", () => {
    expect(observedOf('# A\n\n### Expected\n\nx\n\n### Observed\n\nP04 passed.\n\n## Comments\n')).toBe('P04 passed.')
    expect(observedOf('# A\n\n### Observed\n\n## Comments\n')).toBe('')
  })
})
