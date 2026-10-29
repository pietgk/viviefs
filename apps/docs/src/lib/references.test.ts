// The reference index (D87-D90): gates, ADRs and decisions resolve to a name,
// a summary and a page; ids are found in prose, ranges included; code spans
// are repository paths or not. Everything resolves in a fixture repository,
// so no test here depends on a real document.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import {
  adrReference,
  buildReferenceIndex,
  codePath,
  decisionAnchor,
  findReferences,
  firstSentence,
  gateReference,
  glossaryAnchor,
  newestEvidence,
  onlyReference,
  parseDecisions,
  parseGlossary,
  plainText,
  termFinder,
  termForms,
} from './references.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-references-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const files: Record<string, string> = {
  'tools/qualification/src/gates.ts': `export const gateProbes = [
  {
    gate: 'P04',
    name: 'Log store conformance',
    claim:
      'The log store contract holds on every store',
    path: 'p04.ts',
    summary:
      'Log store contract on SQLite and Postgres.',
  },
  {
    gate: 'P13',
    name: 'Links and routing',
    claim: 'One URL opens the same screen',
    summary: "One URL opens the same screen; it's the same everywhere.",
  },
]`,
  'docs/evidence/2026-09-20-p04.md': '# P04\n',
  'docs/evidence/2026-09-28-p04.md': '# P04 again\n',
  'docs/evidence/p04-design-review.md': '# Review\n',
  'docs/adr/0011-log-store-pattern.md':
    '# ADR-0011: Log store pattern, read models, compaction and analytics\n\nSummary: One `LogStore` contract, many stores.\n\nStatus: Qualified\n\nQualifying gate: P04, P05\n',
  'docs/plan/bootstrap/02-decision-log.md':
    "# Decision log\n\n| # | Name | Decision | Why |\n|---|---|---|---|\n| D37 | Log store tables | SQLite locally: one **append-only** datom table. Snapshots later. | Speed. |\n| D33' | Hybrid logical clock for tx | `tx` is an HLC `(pt, c)`; status `draft` \\| `accepted`. | Order. |\n",
  'docs/issues/0001-node-forge-advisory.md':
    '# I1: node-forge advisory fails `audit`\n\nStatus: ready-for-human\n\nCategory: bug\n\n## What\n\nThe audit step fails. No fix exists.\n\n## Comments\n',
  'docs/issues/template.md': '# I<n>: Title\n',
  'docs/adr/0012-no-status.md': '# ADR-0012: Without a status\n\nSummary: Written before statuses.\n',
  'libs/datom/src/index.ts': 'export {}\n',
}
for (const [file, content] of Object.entries(files)) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), content)
}

describe('the reference index', () => {
  it('reads every decision row, escaped pipes included', () => {
    expect(parseDecisions(files['docs/plan/bootstrap/02-decision-log.md'] ?? '')).toEqual([
      { id: 'D37', name: 'Log store tables', decision: 'SQLite locally: one append-only datom table. Snapshots later.' },
      { id: "D33'", name: 'Hybrid logical clock for tx', decision: 'tx is an HLC (pt, c); status draft | accepted.' },
    ])
  })

  it('resolves gates, ADRs and decisions to a name, a summary and a page', () => {
    const index = buildReferenceIndex(root)
    expect(index.get('P04')).toEqual({
      id: 'P04',
      kind: 'Gate',
      label: 'P04 Log store conformance',
      href: '/reference/claims/#p04-log-store-conformance',
      summary: 'Claim: The log store contract holds on every store.',
      meta: 'Newest evidence 2026-09-28',
    })
    expect(index.get('P13')).toMatchObject({ href: '/reference/claims/#p13-links-and-routing', meta: 'Not run yet' })
    expect(index.get('ADR-0011')).toEqual({
      id: 'ADR-0011',
      kind: 'ADR',
      label: 'ADR-0011 Log store pattern, read models, compaction and analytics',
      href: '/reference/adr/0011-log-store-pattern/',
      summary: 'One LogStore contract, many stores.',
      meta: 'Qualified',
    })
    expect(index.get('D37')).toMatchObject({
      label: 'D37 Log store tables',
      href: '/reference/decisions/#d37',
      summary: 'SQLite locally: one append-only datom table.',
    })
    expect(index.get("D33'")?.href).toBe('/reference/decisions/#d33p')
    expect(index.get('I1')).toEqual({
      id: 'I1',
      kind: 'Issue',
      label: 'I1 node-forge advisory fails audit',
      href: '/reference/issues/0001-node-forge-advisory/',
      summary: 'The audit step fails.',
      meta: 'ready-for-human',
    })
    expect(gateReference(root, 'P04').label).toBe('P04 Log store conformance')
    expect(adrReference(root, '0011').meta).toBe('Qualified')
    expect(() => gateReference(root, 'P99')).toThrow(/P99 is not in/)
    expect(() => adrReference(root, '11')).toThrow(/not four digits/)
    expect(() => adrReference(root, '0099')).toThrow(/No ADR 0099/)
    expect(index.get('ADR-0012')?.meta).toBe('')
  })

  it('fails on an issue whose title, status or What section is out of shape (D92)', () => {
    const indexWith = (source: string) => {
      const dir = mkdtempSync(join(tmpdir(), 'viviefs-docs-issues-'))
      for (const sub of ['docs/adr', 'docs/evidence', 'docs/issues']) mkdirSync(join(dir, sub), { recursive: true })
      writeFileSync(join(dir, 'docs/issues/0002-x.md'), source)
      try {
        buildReferenceIndex(dir)
        return 'built'
      } catch (error) {
        return (error as Error).message
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
    expect(indexWith('# I3: Wrong number\n')).toMatch(/must start with "# I2: <title>"/)
    expect(indexWith('# I2: X\n\nStatus: done\n')).toMatch(/Status "done" is not one of/)
    expect(indexWith('# I2: X\n\nStatus: resolved\n')).toMatch(/has no "## What" section/)
    expect(indexWith('# I2: X\n\nStatus: resolved\n\n## What\n\nDone.\n')).toBe('built')
  })

  it('fails on an ADR without a Summary line (D88)', () => {
    const bare = mkdtempSync(join(tmpdir(), 'viviefs-docs-references-bare-'))
    mkdirSync(join(bare, 'docs/adr'), { recursive: true })
    mkdirSync(join(bare, 'docs/evidence'), { recursive: true })
    writeFileSync(join(bare, 'docs/adr/0001-x.md'), '# ADR-0001: X\n\nStatus: Qualified\n')
    expect(() => buildReferenceIndex(bare)).toThrow(/0001-x\.md has no "Summary:" line/)
    rmSync(bare, { recursive: true, force: true })
  })

  it('links a gate to its newest dated evidence note', () => {
    expect(newestEvidence(root, 'P04')).toBe('docs/evidence/2026-09-28-p04.md')
    expect(newestEvidence(root, 'P13')).toBeNull()
  })

  it('gives each decision an anchor, primes spelled out', () => {
    expect(decisionAnchor('D37')).toBe('d37')
    expect(decisionAnchor("D35''")).toBe('d35pp')
  })

  it('shortens Markdown to one plain line', () => {
    expect(plainText('One **bold** `code` [link](x.md) a\\|b')).toBe('One bold code link a|b')
    expect(firstSentence('First one. Second one.')).toBe('First one.')
    expect(firstSentence('No full stop')).toBe('No full stop')
  })
})

describe('finding references in prose', () => {
  const ids = (text: string) => findReferences(text).map(({ id, inRange }) => (inRange ? `${id}~` : id))

  it('finds gates, ADRs in both spellings and decisions with primes', () => {
    expect(ids("P04 ran, ADR-0011 and ADR 0005 agree, D37 and D33' and D35’’ decided")).toEqual([
      'P04',
      'ADR-0011',
      'ADR-0005',
      'D37',
      "D33'",
      "D35''",
    ])
  })

  it('reads a double prime that smartypants curled into two different quotes', () => {
    // After a code span, `D35''` reaches the linker as `D35’‘`.
    expect(ids('the changeset id; D31, D35’‘; ADR-0006 Design')).toEqual(['D31', "D35''", 'ADR-0006'])
  })

  it('finds issue ids, not words that start with I', () => {
    expect(ids('I1 blocks audit; see I12. In 2026, I2C and iOS are not issues.')).toEqual(['I1', 'I12'])
  })

  it("ends an id at a possessive 's", () => {
    expect(ids("D58's table, P04\u2019s probe, ADR-0011's design, D33''s clock")).toEqual(['D58', 'P04', 'ADR-0011', "D33'"])
  })

  it('gives both ends of a range, marked so they read as ids', () => {
    expect(ids('P01-P11 passed; D59-D74 recorded')).toEqual(['P01~', 'P11~', 'D59~', 'D74~'])
  })

  it('leaves words that only look like ids alone', () => {
    expect(ids('a 3D view, ID2, P2P, MP4, D3js, 0xD4, PD12')).toEqual([])
  })

  it('knows a label that is only an id', () => {
    expect(onlyReference('ADR 0005')).toBe('ADR-0005')
    expect(onlyReference(' P04 ')).toBe('P04')
    expect(onlyReference('see P04')).toBeNull()
    expect(onlyReference('P01-P11')).toBeNull()
  })
})

describe('code spans as repository paths', () => {
  it('links an existing file or directory, to its site page when it has one', () => {
    expect(codePath(root, 'libs/datom/src/index.ts')).toEqual({
      _tag: 'Link',
      href: 'https://github.com/pietgk/viviefs/blob/main/libs/datom/src/index.ts',
    })
    expect(codePath(root, 'libs/datom/')).toEqual({ _tag: 'Link', href: 'https://github.com/pietgk/viviefs/tree/main/libs/datom' })
    expect(codePath(root, 'docs/plan/bootstrap/02-decision-log.md')).toEqual({ _tag: 'Link', href: '/reference/decisions/' })
  })

  it('reports a missing path under a checked root', () => {
    expect(codePath(root, 'libs/gone/src/x.ts')).toEqual({ _tag: 'Missing', path: 'libs/gone/src/x.ts' })
  })

  it('reports a directory without files as missing, since Git cannot hold it', () => {
    mkdirSync(join(root, 'apps/docs/src/empty/nested'), { recursive: true })
    expect(codePath(root, 'apps/docs/src/empty/')).toEqual({ _tag: 'Missing', path: 'apps/docs/src/empty/' })
  })

  it('leaves a path Git ignores alone, since it is not in the repository', () => {
    // A build output or a local artifact exists only where it was made: in a
    // fresh clone it is missing, and on GitHub it is never there.
    const repository = mkdtempSync(join(tmpdir(), 'viviefs-docs-ignored-'))
    try {
      execFileSync('git', ['init', '--quiet'], { cwd: repository })
      for (const [path, content] of Object.entries({
        '.gitignore': 'dist/\n.artifacts/\n',
        'apps/docs/dist/index.html': '<html></html>',
        '.artifacts/verify/evidence-mobile/ios/main.jsbundle': '',
        'apps/docs/src/index.ts': '',
      })) {
        mkdirSync(dirname(join(repository, path)), { recursive: true })
        writeFileSync(join(repository, path), content)
      }
      expect(codePath(repository, 'apps/docs/dist')).toEqual({ _tag: 'NotAPath' })
      expect(codePath(repository, '.artifacts/verify/evidence-mobile')).toEqual({ _tag: 'NotAPath' })
      // Before the first build: `dist/` matches only a directory, and Git
      // cannot tell that a path that does not exist would be one.
      expect(codePath(repository, 'apps/web/dist')).toEqual({ _tag: 'NotAPath' })
      // Asked again, the kept answer.
      expect(codePath(repository, 'apps/web/dist')).toEqual({ _tag: 'NotAPath' })
      // A missing path Git does not ignore is still missing.
      expect(codePath(repository, 'apps/docs/src/gone.ts')).toEqual({ _tag: 'Missing', path: 'apps/docs/src/gone.ts' })
      // A directory whose files are all further down holds a file.
      expect(codePath(repository, 'apps/')).toEqual({ _tag: 'Link', href: 'https://github.com/pietgk/viviefs/tree/main/apps' })
      expect(codePath(repository, 'apps/docs/src/index.ts')).toEqual({
        _tag: 'Link',
        href: 'https://github.com/pietgk/viviefs/blob/main/apps/docs/src/index.ts',
      })
    } finally {
      rmSync(repository, { recursive: true, force: true })
    }
  })

  it('leaves code that is not a path alone', () => {
    for (const value of ['LogStore', 'guides/<pattern>/', 'exercises/x/NN.MM-name/', 'docs/issues/NNNN-slug.md', 'src/lib/guides.ts', 'a b/c', 'apps/**/*.ts', '../x', 'notes.md'])
      expect(codePath(root, value), value).toEqual({ _tag: 'NotAPath' })
  })
})

describe('glossary terms in prose (D94)', () => {
  const terms = parseGlossary(
    [
      '**Pattern**:',
      'A proven way to build one part of an app.',
      'More.',
      '_Avoid_: framework',
      '',
      '**Guide template**:',
      'The one shape every guide follows.',
      '',
      '**Guide**:',
      'Everything a person needs about one pattern.',
      '',
      '**Entity**:',
      'The thing a fact is about.',
      '',
      '**Command**:',
      'A request to change the data.',
      '',
      '**Effect**:',
      'The TypeScript library this stack is written with.',
      '',
      '**Vision - View - Effects**:',
      'The loop this project runs at every level.',
      '',
      '**effect**:',
      'Something that happens and makes a difference.',
      '',
      '**Effect handler**:',
      'A step that decides which effects follow.',
      '',
      '**HLC**:',
      'The clock that orders every fact.',
      '',
      '**Concept**:',
      'A named idea people and agents use to think about the stack.',
      '',
      '**Foundation concept**:',
      'One of the twelve ideas the whole stack is built on.',
    ].join('\n'),
  )
  const found = (text: string) => termFinder(terms)(text).map(({ start, end }) => text.slice(start, end))

  it('reads each entry with its anchor and its hover line', () => {
    expect(terms[0]).toEqual({ term: 'Pattern', anchor: 'pattern', summary: 'A proven way to build one part of an app.' })
    expect(terms[1]?.anchor).toBe('guide-template')
    expect(() => parseGlossary('**Empty**:\n')).toThrow(/"Empty" has no definition/)
  })

  it("takes the whole first line as the hover line, however the precise part wraps (D94')", () => {
    const [workflow] = parseGlossary('**Workflow**:\nA process that survives a restart.\nVersioned by name; its body\nre-runs on resume.\n')
    expect(workflow?.summary).toBe('A process that survives a restart.')
    // A first line that ends mid-sentence was cut off in the preview; now it fails.
    expect(() =>
      parseGlossary('**Workflow**:\nA multi-step process that survives the app being closed or the phone\nrestarting.\n'),
    ).toThrow(/"Workflow": the first line is the hover line, one whole sentence ending in a full stop/)
  })

  it("holds the hover line to one short sentence without code or references (D94')", () => {
    const entry = (line: string) => () => parseGlossary(`**Term**:\n${line}\n`)
    expect(entry(`A ${'very '.repeat(24)}long line.`)).toThrow(/"Term": the hover line has 132 characters; at most 120/)
    expect(entry('A `Layer` that supplies it.')).toThrow(/"Term": the hover line has code font/)
    expect(entry('One fact ([D37 Log store tables][D37]).')).toThrow(/"Term": the hover line has a reference/)
    expect(entry('One fact. Kept forever.')).toThrow(/"Term": the hover line has more than one sentence/)
  })

  it('reads Like, Not and Avoid lines once each and in that order, and a Like line says except (D174)', () => {
    const [handler] = parseGlossary(
      [
        '**Effect handler**:',
        'A step that decides which effects follow.',
        'A command is one.',
        "_Like_: Elm's `update`, except that what it returns",
        'counts only once accepted.',
        '_Not_: an effect handler of algebraic effects.',
        '_Avoid_: handler (alone)',
      ].join('\n'),
    )
    expect(handler?.summary).toBe('A step that decides which effects follow.')
    const entry = (...lines: ReadonlyArray<string>) => () => parseGlossary(['**Term**:', 'One fact.', ...lines].join('\n'))
    expect(entry('_Like_: an EAV row.')).toThrow(/"Term": a _Like_ line says what differs, with "except" \(D162\)/)
    expect(entry('_Avoid_: row', '_Not_: a row.')).toThrow(/"Term": _Like_, _Not_ and _Avoid_ come once each, in that order/)
    expect(entry('_Not_: a row.', '_Not_: a record.')).toThrow(/once each, in that order/)
    expect(entry('_See_: Datom')).toThrow(/"Term": _See_ is not a label; an entry has _Like_, _Not_ and _Avoid_/)
  })

  it('gives a name its capitals in its anchor, so a word and a name never share one', () => {
    expect(terms.filter(({ term }) => term.toLowerCase() === 'effect').map(({ anchor }) => anchor)).toEqual(['Effect', 'effect'])
    expect(glossaryAnchor('Effect handler')).toBe('effect-handler')
    expect(() => parseGlossary('**Read model**:\nA table.\n\n**Read Model**:\nAnother.')).toThrow(
      /"Read model" and "Read Model" share the anchor #read-model/,
    )
  })

  it('finds terms and plurals in any case, the longest term first, whole words only', () => {
    expect(found('Patterns and a guide template; two guides, entities, the hlc and HLC; guide-template is code')).toEqual([
      'Patterns',
      'guide template',
      'guides',
      'entities',
      'HLC',
    ])
  })

  it('finds a compound term across a line break, never its first word alone', () => {
    // "a sync\nnode" in a wrapped source line is one Sync node, not Sync and a stray word.
    const withSync = parseGlossary('**Sync**:\nHow changes are exchanged.\n\n**Sync node**:\nOne installation that keeps the data.\n')
    const spans = (text: string) => termFinder(withSync)(text).map(({ start, end, term }) => [text.slice(start, end), term.term])
    expect(spans('not a sync\nnode: it keeps no replica; first sync')).toEqual([
      ['sync\nnode', 'Sync node'],
      ['sync', 'Sync'],
    ])
    expect(found('the guide\n  template and a guide')).toEqual(['guide\n  template', 'guide'])
  })

  it('links an everyday word only as the glossary writes it, mid-sentence', () => {
    expect(found('the CLI command runs; it sends a Command. Command at the start is not one')).toEqual(['Command'])
    expect(found('Vision - View - Effects, built with Effect')).toEqual(['Vision - View - Effects', 'Effect'])
    expect(termForms('Effect')).toEqual(['Effect'])
    expect(termForms('Activity')).toEqual(['Activity', 'Activities'])
  })

  it('links concept only as the glossary writes it, and foundation concept in any case', () => {
    expect(found('a k-plex concept and two concepts. Concept at the start; a Concept mid-sentence')).toEqual(['Concept'])
    expect(found('the twelve foundation concepts; a Foundation concept')).toEqual(['foundation concepts', 'Foundation concept'])
  })

  it('tells a name from the word with the same letters by case', () => {
    expect(found('a side effect, built with Effect; effects follow from an effect handler')).toEqual(['effect', 'Effect', 'effects', 'effect handler'])
    const byTerm = (text: string) => termFinder(terms)(text).map(({ term }) => term.term)
    expect(byTerm('a side effect, built with Effect')).toEqual(['effect', 'Effect'])
    expect(byTerm('Effects follow. An EFFECT')).toEqual(['effect', 'effect'])
  })
})
