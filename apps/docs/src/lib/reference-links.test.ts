// References resolved when a page renders (D87, D89, D90), through the same
// Sätteri pipeline the site uses, in a fixture repository: ids become named
// links with preview data, paths become links, headings and code stay as
// written, and an unknown id or a stale path fails.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { markdownToHtml } from 'satteri'
import { decisionAnchors, glossaryAnchors, referenceLinks } from './reference-links.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-reference-links-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const files: Record<string, string> = {
  'pnpm-workspace.yaml': '',
  'tools/qualification/src/gates.ts':
    "  {\n    gate: 'P04',\n    name: 'Log store conformance',\n    claim: 'The log store contract holds',\n  },\n  {\n    gate: 'P05',\n    name: 'Changesets and projections',\n    claim: 'Changesets commit atomically',\n  },",
  'docs/evidence/2026-09-20-p04.md': '# P04\n',
  'docs/adr/0005-sqlite-drivers.md': '# ADR-0005: SQLite drivers\n\nSummary: Official drivers.\n\nStatus: Qualified\n',
  'docs/plan/bootstrap/02-decision-log.md': '| # | Name | Decision | Why |\n|---|---|---|---|\n| D37 | Log store tables | One datom table. | Speed. |\n',
  'libs/datom/src/index.ts': 'export {}\n',
  'GLOSSARY.md':
    '# Glossary\n\n**Note** the order.\n\n**Pattern**:\nA proven way to build one part of an app, with a guide.\n_Avoid_: guide template\n\n**Guide**:\nEverything about one pattern.\n',
}
for (const [file, content] of Object.entries(files)) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), content)
}

const render = (markdown: string, file = 'docs/adr/0099-page.md'): string => {
  const result = markdownToHtml(markdown, {
    mdastPlugins: [referenceLinks(root)],
    hastPlugins: [decisionAnchors(), glossaryAnchors()],
    fileURL: pathToFileURL(join(root, file)),
  })
  // The plugins are synchronous, so the render is too.
  if (result instanceof Promise) throw new Error('The reference plugins rendered asynchronously.')
  return result.html
}

describe('references resolved when rendered', () => {
  it('turns ids in prose into named links that carry their preview', () => {
    const html = render('Qualifying gate: P04. Related: D37, ADR 0005.')
    expect(html).toContain(
      '<a href="/reference/claims/#p04-log-store-conformance" class="ref-link" data-ref-kind="Gate" data-ref-label="P04 Log store conformance" data-ref-summary="Claim: The log store contract holds." data-ref-meta="Newest evidence 2026-09-20">P04 Log store conformance</a>',
    )
    expect(html).toContain('>D37 Log store tables</a>')
    expect(html).toContain('href="/reference/adr/0005-sqlite-drivers/"')
    expect(html).toContain('>ADR-0005 SQLite drivers</a>')
  })

  it('names a link whose label is only an id, and fails when the id is unknown', () => {
    expect(render('See [ADR 0005](0005-sqlite-drivers.md).')).toContain('>ADR-0005 SQLite drivers</a>')
    expect(() => render('See [D4](x.md).')).toThrow(/link "D4" names an unknown id/)
  })

  it('links both ends of a range by id alone, and an id that is the whole text', () => {
    const html = render('P04-P05 passed.\n\nP04')
    expect(html).toContain('>P04</a>-<a')
    expect(html).toContain('>P05</a> passed.')
    expect(html).toContain('<p><a href="/reference/claims/#p04-log-store-conformance"')
  })

  it('leaves headings, code and other links as written', () => {
    const html = render('## P04 notes\n\n`P04` and [the gate P04](https://example.com)\n\n```\nP04\n```\n')
    expect(html).toContain('<h2>P04 notes</h2>')
    expect(html).toContain('<code>P04</code>')
    expect(html).toContain('<a href="https://example.com">the gate P04</a>')
    expect(html).not.toContain('ref-link')
    expect(render('[`libs/datom/src/index.ts`](https://example.com)')).toContain(
      '<a href="https://example.com"><code>libs/datom/src/index.ts</code></a>',
    )
  })

  it('links a repository path in inline code', () => {
    expect(render('Lives in `libs/datom/src/index.ts`.')).toContain(
      '<a href="https://github.com/pietgk/viviefs/blob/main/libs/datom/src/index.ts"><code>libs/datom/src/index.ts</code></a>',
    )
  })

  it('fails on an unknown id and on a stale path', () => {
    expect(() => render('As D4 said.')).toThrow(/"D4" is not a known gate, ADR, decision or issue/)
    expect(() => render('In `libs/gone/x.ts`.')).toThrow(/libs\/gone\/x\.ts` names a repository path that does not exist/)
  })

  it('keeps a stale path in an evidence note as written', () => {
    expect(render('Was in `libs/gone/x.ts`.', 'docs/evidence/2026-09-20-p04.md')).toContain('<code>libs/gone/x.ts</code>')
  })

  it('links the first use of a glossary term on a page, with its plain sentence (D94)', () => {
    const html = render('A pattern has a guide. Every pattern has one guide.')
    expect(html).toContain(
      '<a href="/reference/glossary/#pattern" class="ref-link" data-ref-kind="Glossary" data-ref-label="Pattern" data-ref-summary="A proven way to build one part of an app, with a guide." data-ref-meta="">pattern</a>',
    )
    expect(html.match(/glossary\/#pattern/g)).toHaveLength(1)
    expect(html.match(/glossary\/#guide/g)).toHaveLength(1)
  })

  it('links terms inside glossary entries, not the entry itself and not its Avoid list', () => {
    const html = render(files['GLOSSARY.md'] ?? '', 'GLOSSARY.md')
    expect(html).toContain('<p id="pattern"><strong>Pattern</strong>:')
    expect(html).toContain('<p><strong>Note</strong> the order.</p>')
    expect(html).toContain('with a <a href="/reference/glossary/#guide"')
    expect(html).toContain('<em>Avoid</em>: guide template')
    expect(html).toContain('Everything about one <a href="/reference/glossary/#pattern"')
  })

  it('anchors each decision row of the decision log, without linking its id', () => {
    const html = render(files['docs/plan/bootstrap/02-decision-log.md'] ?? '', 'docs/plan/bootstrap/02-decision-log.md')
    expect(html).toContain('<tr id="d37">')
    expect(html).toContain('<td>D37</td>')
  })
})
