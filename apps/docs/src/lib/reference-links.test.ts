// References resolved when a page renders (D87, D89, D90), through the same
// Sätteri pipeline the site uses, in a fixture repository: ids become named
// links with preview data, paths become links, headings and code stay as
// written, and an unknown id or a stale path fails.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { markdownToHtml, mdxToJs } from 'satteri'
import { decisionAnchors, glossaryAnchors, referenceLinks } from './reference-links.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-reference-links-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const files: Record<string, string> = {
  'pnpm-workspace.yaml': '',
  'tools/qualification/src/gates.ts':
    "  {\n    gate: 'P04',\n    name: 'Log store conformance',\n    claim: 'The log store contract holds',\n  },\n  {\n    gate: 'P05',\n    name: 'Changesets and projections',\n    claim: 'Changesets commit atomically',\n  },",
  'docs/evidence/2026-09-20-p04.md': '# P04\n',
  'docs/adr/0005-sqlite-drivers.md': '# ADR-0005: SQLite drivers\n\nSummary: Official drivers.\n\nStatus: Qualified\n',
  'docs/plan/bootstrap/02-decision-log.md':
    "# Decision log\n\n| # | Name | Decision | Why |\n|---|---|---|---|\n| D37 | Log store tables | One datom table. | Speed. |\n| D38 | Reader's view | A screen. | Clarity. |\n",
  'libs/datom/src/index.ts': 'export {}\n',
  'docs/adr/README.md': '# Architectural decision records\n\nADRs preserve why consequential choices were made. The plan describes the stack.\n',
  'apps/docs/src/content/docs/guides/index.mdx': '---\ntitle: Guides\ndescription: One guide per pattern, for people and agents.\n---\n\nBody.\n',
  'docs/research/2026-09-29-delivery-model.html':
    '<html><head><title>How a pattern is delivered</title></head><body><h1>Delivery</h1><p>This page shows how <b>everything</b> fits together. More.</p></body></html>',
  'GLOSSARY.md':
    '# Glossary\n\n**Note** the order.\n\n**Pattern**:\nA proven way to build one part of an app, with a guide.\nOne contract, several implementations.\n_Like_: a library, except that every way of keeping it passes one suite.\n_Not_: a design pattern from a guide book.\n_Avoid_: guide template\n\n**Guide**:\nEverything about one pattern.\n\n**Lesson**:\nOne page that teaches one idea.\n_Not_: a page about a pattern.\n',
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

  it('keeps a reference-style link, with its preview, and fails on a stale name', () => {
    const html = render('See [D37 Log store tables][D37].\n\n[D37]: ../plan/bootstrap/02-decision-log.md#d37\n')
    expect(html).toContain(
      '<a href="/reference/decisions/#d37" class="ref-link" data-ref-kind="Decision" data-ref-label="D37 Log store tables" data-ref-summary="One datom table." data-ref-meta="">D37 Log store tables</a>',
    )
    expect(render('See [D37][D37].\n\n[D37]: #d37\n')).toContain('>D37 Log store tables</a>')
    expect(() => render('See [D37 Wrong][D37].\n\n[D37]: #d37\n')).toThrow(/stale name for D37/)
    expect(render("See [D38 Reader\u2019s view][D38].\n\n[D38]: #d38\n")).toContain('>D38 Reader\'s view</a>')
    expect(render('[P04 design review](https://example.com)')).toContain(
      '<a href="https://example.com">P04 design review</a>',
    )
    expect(render('[D4 notes](https://example.com)')).toContain('<a href="https://example.com">D4 notes</a>')
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

  it('reads a diagram label as prose: an unknown id or a stale path fails, and the diagram stays as written (D180)', () => {
    const diagram = (label: string) => `\`\`\`mermaid\nflowchart TB\n  EX -. "${label}" .-> GUIDE\n\`\`\`\n`
    expect(render(diagram('libs/datom (D37)'))).toContain('libs/datom (D37)')
    expect(() => render(diagram("accepted directly (D65')"))).toThrow(/"D65'" in a diagram label is not a known gate, ADR, decision or issue/)
    expect(() => render(diagram('libs/gone/x.ts'))).toThrow(/libs\/gone\/x\.ts" in a diagram label names a repository path that does not exist/)
    expect(render(diagram('libs/gone/x.ts'), 'docs/evidence/2026-09-20-p04.md')).toContain('libs/gone/x.ts')
  })

  it('gives a link to a site page the preview of a page: its title and first sentence (D90\')', () => {
    const page = (label: string, summary: string) =>
      `class="ref-link" data-ref-kind="Page" data-ref-label="${label}" data-ref-summary="${summary}" data-ref-meta="">`
    expect(render('Each status is shown under [ADRs](/reference/adr/).')).toContain(
      `<a href="/reference/adr/" ${page('Architectural decision records', 'ADRs preserve why consequential choices were made.')}ADRs</a>`,
    )
    expect(render('See [the SQLite ADR](/reference/adr/0005-sqlite-drivers/#status).')).toContain(page('ADR-0005: SQLite drivers', 'Official drivers.'))
    expect(render('Read the [guides](/guides/).')).toContain(page('Guides', 'One guide per pattern, for people and agents.'))
    expect(render('The [delivery model](/research/2026-09-29-delivery-model.html).')).toContain(
      page('How a pattern is delivered', 'This page shows how everything fits together.'),
    )
  })

  it('gives a reference-style link to a site page the same preview', () => {
    expect(render('Read the [guides][all guides].\n\n[all guides]: /guides/\n')).toContain(
      '<a href="/guides/" class="ref-link" data-ref-kind="Page" data-ref-label="Guides" data-ref-summary="One guide per pattern, for people and agents." data-ref-meta="">guides</a>',
    )
    expect(render('See [Effect][effect].\n\n[effect]: https://effect.website/\n')).not.toContain('ref-link')
  })

  it('gives a repository path that is a site page the same preview', () => {
    expect(render('Listed in `docs/adr/README.md`.')).toContain(
      '<a href="/reference/adr/" class="ref-link" data-ref-kind="Page" data-ref-label="Architectural decision records"',
    )
    expect(render('In `libs/datom/src/index.ts`.')).not.toContain('ref-link')
  })

  it('leaves a link to another site, to a section of this page or to a file that is not a page plain', () => {
    const html = render('See [Effect](https://effect.website/), [below](#map) and [the index](/llms.txt).')
    expect(html).not.toContain('ref-link')
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

  it("puts the hover line, the precise part and each label line on lines of their own (D94', D174)", () => {
    const html = render(files['GLOSSARY.md'] ?? '', 'GLOSSARY.md')
    expect(html).toContain('with a <a href="/reference/glossary/#guide"')
    expect(html).toMatch(/guide<\/a>\.<br>\s*One contract, several implementations\.\s*<br>\s*<em>Like<\/em>: a library/)
    expect(html).toMatch(/one suite\.\s*<br>\s*<em>Not<\/em>: a design pattern from a guide book\.\s*<br>\s*<em>Avoid<\/em>: guide template/)
  })

  it('links nothing in a Not line, which names another sense of the word', () => {
    const html = render(files['GLOSSARY.md'] ?? '', 'GLOSSARY.md')
    expect(html).toContain('<em>Not</em>: a page about a pattern.')
  })

  it('anchors each decision row of the decision log, without linking its id', () => {
    const html = render(files['docs/plan/bootstrap/02-decision-log.md'] ?? '', 'docs/plan/bootstrap/02-decision-log.md')
    expect(html).toContain('<tr id="d37">')
    expect(html).toContain('<td>D37</td>')
  })

  it('keeps one anchor when the source row already has one', () => {
    const html = render(
      '| Id | Name |\n| --- | --- |\n| <a id="d37"></a>D37 | Log store tables |\n',
      'docs/plan/bootstrap/02-decision-log.md',
    )
    expect(html.match(/id="d37"/g)).toHaveLength(1)
    expect(html).toContain('<tr id="d37">')
    expect(html).toContain('<td>D37</td>')
    expect(html).not.toContain('<a id="d37">')
  })
})

// Words in another project's sense (D204, I26): a block quote, or the text
// between `<!-- their words: whose -->` and `<!-- /their words -->`, links no
// glossary term, no bare id and no repository path. One test per case I26
// observed and I94 added, on a glossary with the words that clashed.
const theirRoot = mkdtempSync(join(tmpdir(), 'viviefs-docs-their-words-'))
afterAll(() => rmSync(theirRoot, { recursive: true, force: true }))

const entry = (term: string, hover: string) => `**${term}**:\n${hover}\n`
const theirFiles: Record<string, string> = {
  ...files,
  'GLOSSARY.md': [
    '# Glossary\n',
    entry('Workflow', 'Durable work on the workflow engine.'),
    entry('Workflow engine', 'What runs workflows.'),
    entry('Builds on', 'A pattern that uses another pattern.'),
    entry('App', 'A program built on ViViEfs.'),
    entry('Attribute', 'The name of a fact about an entity.'),
    entry('Pattern', 'A proven way to build one part of an app.'),
    entry('Gate step', 'One step of a gate.'),
    entry('Effect', 'The TypeScript library ViViEfs is built on.'),
    entry('actor', 'Who a change is accountable to.'),
    entry('Decision', 'A choice recorded in the decision log.'),
  ].join('\n'),
}
for (const [file, content] of Object.entries(theirFiles)) {
  mkdirSync(dirname(join(theirRoot, file)), { recursive: true })
  writeFileSync(join(theirRoot, file), content)
}

const renderTheirs = (markdown: string, file = 'docs/issues/0099-page.md'): string => {
  const result = markdownToHtml(markdown, {
    mdastPlugins: [referenceLinks(theirRoot)],
    fileURL: pathToFileURL(join(theirRoot, file)),
  })
  if (result instanceof Promise) throw new Error('The reference plugins rendered asynchronously.')
  return result.html
}

const marked = (text: string, whose = 'vivief') => `<!-- their words: ${whose} -->\n\n${text}\n\n<!-- /their words -->\n`

describe('words in another project sense (D204)', () => {
  it('links our terms outside a mark, as before', () => {
    expect(renderTheirs('archify draws architecture, workflow, sequence diagrams.')).toContain('href="/reference/glossary/#workflow"')
  })

  it.each([
    ['archify diagram kinds', 'archify draws architecture, workflow, sequence diagrams.'],
    ['a project that uses another', 'The diagram editor Bausteinsicht builds on draw.io.'],
    ['a program', 'Desktop app, web app.'],
    ['keys on OTel spans', 'Spans are joined (names, ids, attributes).'],
    ['one step at a time', 'It plays a pattern or a gate step by step.'],
    ["vivief's effect", "vivief's Vision View Effect."],
    ['the actor model', 'vivief speaks HTTP, actors, state machines.'],
    ['choices', 'constrain them only to good decisions'],
    ["the web's app manifest", 'a JavaScript engine; a database cursor; the web app manifest.'],
  ])('links no term inside a mark: %s', (_, text) => {
    const html = renderTheirs(marked(text))
    expect(html).not.toContain('ref-link')
    expect(renderTheirs(`> ${text}\n`)).not.toContain('ref-link')
  })

  it('leaves another repository id as plain text, where it would fail the build outside', () => {
    expect(() => renderTheirs('Pinot answers in 10ms P95.')).toThrow(/"P95" is not a known gate/)
    expect(renderTheirs(marked('Pinot answers in 10ms P95.', 'Pinot'))).toContain('<p>Pinot answers in 10ms P95.</p>')
    expect(renderTheirs('> Pinot answers in 10ms P95.\n')).toContain('<p>Pinot answers in 10ms P95.</p>')
  })

  it("keeps a link whose label is another repository's id as written", () => {
    const link = '[ADR 0005](https://github.com/pietgk/vivief/blob/main/docs/adr/0005.md)'
    expect(renderTheirs(link)).toContain('>ADR-0005 SQLite drivers</a>')
    expect(renderTheirs(marked(link))).toContain('<a href="https://github.com/pietgk/vivief/blob/main/docs/adr/0005.md">ADR 0005</a>')
  })

  it("keeps another repository's path in code font, where a missing one would fail outside", () => {
    expect(() => renderTheirs('See `docs/contract/foundation.md`.')).toThrow(/names a repository path that does not exist/)
    expect(renderTheirs(marked('See `docs/contract/foundation.md`.'))).toContain('<code>docs/contract/foundation.md</code>')
  })

  it('still resolves a reference-style link in a block quote, as only we write those', () => {
    const html = renderTheirs('> Treat [D37 Log store tables][D37] as accepted, with every pattern.\n\n[D37]: #d37\n')
    expect(html).toContain('>D37 Log store tables</a>')
    expect(html).not.toContain('glossary/#pattern')
  })

  it('marks a table, and a phrase inside one sentence or one cell', () => {
    const table = marked('| Kind | Draws |\n| --- | --- |\n| workflow | steps of a process |')
    expect(renderTheirs(table)).not.toContain('ref-link')
    const phrase = renderTheirs('vivief says <!-- their words: vivief -->an actor<!-- /their words --> where we say a workflow.')
    expect(phrase).not.toContain('glossary/#actor')
    expect(phrase).toContain('glossary/#workflow')
  })

  it('links the first use after a mark, since words inside it are not a use', () => {
    const html = renderTheirs(`${marked('Their workflow.')}\nOur workflow.\n`)
    expect(html.match(/glossary\/#workflow"/g)).toHaveLength(1)
    expect(html).toContain('Our <a href="/reference/glossary/#workflow"')
  })

  it('fails a mark without a name, one opened inside another, a stray close and a mark left open', () => {
    expect(() => renderTheirs('<!-- their words -->\n\nx\n\n<!-- /their words -->\n')).toThrow(/names whose words they are/)
    expect(() => renderTheirs(`<!-- their words: a -->\n\n${marked('x', 'b')}\n<!-- /their words -->\n`)).toThrow(/opened inside another/)
    expect(() => renderTheirs('Our workflow.\n\n<!-- /their words -->\n')).toThrow(/docs\/issues\/0099-page\.md: .*closes no open mark/)
    expect(() => renderTheirs('<!-- their words: vivief -->\n\nTheir workflow.\n')).toThrow(/not closed/)
  })

  it('ignores a marker shown as code', () => {
    const html = renderTheirs('Write `<!-- their words: vivief -->` first.\n\n```md\n<!-- their words: vivief -->\n```\n\nOur workflow.\n')
    expect(html).toContain('glossary/#workflow')
  })

  it('reads the JSX comments a guide writes', async () => {
    const source =
      '{/* their words: archify */}\n\narchify draws a workflow.\n\n{/* /their words */}\n\nvivief says {/* their words: vivief */}an actor{/* /their words */}, we say our pattern.\n'
    const result = await mdxToJs(source, {
      mdastPlugins: [referenceLinks(theirRoot)],
      fileURL: pathToFileURL(join(theirRoot, 'apps/docs/src/content/docs/guides/x/index.mdx')),
    })
    expect(result.code).not.toContain('glossary/#workflow')
    expect(result.code).not.toContain('glossary/#actor')
    expect(result.code).toContain('glossary/#pattern')
  })
})
