// Names the stack owns (D180): a living document that names a `project.json`
// `metadata` key, a `pnpm` script, a `verify` step or a `viviefs/` name the
// stack does not have fails, in prose and in a diagram label, so a rename
// fails wherever a document still uses the old name. The diagram is How a
// pattern is delivered's, as it read before the human's review of I89.
import { describe, expect, it } from '@effect/vitest'
import { DECISION_LOG } from '@viviefs/references'
import { GLOSSARY_FILE } from './glossary-report.ts'
import { isCheckedForNamedIdentifiers, namedIdentifierProblems, type StackNames } from './named-identifiers.ts'

const names: StackNames = {
  metadataKeys: new Set(['guides', 'rationale']),
  scripts: new Set(['verify', 'refs', 'docs:prod']),
  verifySelectors: new Set(['static', 'unit', 'guides', 'retired-words', 'all', 'baseline']),
  viviefsNames: new Set(['viviefs/deferred/exit', 'viviefs/changeset/commit', 'viviefs/datom/HlcClock']),
}

const FILE = 'apps/docs/src/content/docs/delivered.mdx'

const problems = (content: string) => namedIdentifierProblems(FILE, content, names)

const page = (link: string) =>
  [
    '## The map',
    '',
    '```mermaid',
    'flowchart TB',
    '  GUIDE -. "samples embed" .-> EX',
    `  EX -. "${link}" .-> GUIDE`,
    '```',
    '',
  ].join('\n')

describe('names the stack owns', () => {
  it('fails a metadata key no project.json has, in a diagram label and in prose', () => {
    expect(problems(page('metadata.guide'))).toEqual([
      `${FILE}:6: no project.json has the metadata key \`guide\` (metadata.guide); write a name the stack has (D180)`,
    ])
    expect(problems(page('metadata.guides'))).toEqual([])
    expect(problems('The exemplar names its guide in `metadata.guide`.\n')).toEqual([
      `${FILE}:1: no project.json has the metadata key \`guide\` (metadata.guide); write a name the stack has (D180)`,
    ])
  })

  it('fails a pnpm command that is neither a root script nor pnpm\'s own, and a verify selector it does not have', () => {
    const known = [
      'Run `pnpm verify`, `pnpm verify baseline` or `pnpm verify static unit`, and browse with `pnpm docs:prod`.',
      'Read `pnpm exec tsc --version` and `pnpm why -r zod`; `pnpm exercise <pattern> <NN.MM>` is a placeholder.',
      "`verify`'s `guides` step, the `verify` steps and `verify all` exist.",
      '',
    ].join('\n')
    expect(problems(known)).toEqual([`${FILE}:2: \`pnpm exercise\` is neither a root package.json script nor a pnpm command; write a name the stack has (D180)`])
    expect(problems('Then `pnpm docs:serve`, `pnpm verify retire-words` and the `guide` step.\n')).toEqual([
      `${FILE}:1: \`pnpm docs:serve\` is neither a root package.json script nor a pnpm command; write a name the stack has (D180)`,
      `${FILE}:1: \`retire-words\` is not a verify stage or step (pnpm verify retire-words); write a name the stack has (D180)`,
      `${FILE}:1: \`guide\` is not a verify stage or step (\`guide\` step); write a name the stack has (D180)`,
    ])
  })

  it('fails a viviefs/ name the code does not define, and keeps a namespace, a wildcard and a package name', () => {
    expect(
      problems('`viviefs/deferred/exit`, `viviefs/changeset/*`, `viviefs/`, `viviefs/...` and `@viviefs/datom` exist.\n'),
    ).toEqual([])
    expect(problems('`viviefs/deferred/done` and `viviefs/lease/*`.\n')).toEqual([
      `${FILE}:1: \`viviefs/deferred/done\` is not a name the code defines; write a name the stack has (D180)`,
      `${FILE}:1: \`viviefs/lease/*\` is not a name the code defines; write a name the stack has (D180)`,
    ])
  })

  it('leaves fenced code, a block quote and another project\'s words alone', () => {
    const text = [
      '```sh',
      'pnpm verify retire-words',
      '```',
      '',
      '> vivief writes `metadata.owner`.',
      '',
      '<!-- their words: vivief -->',
      '',
      '```mermaid',
      'flowchart TB',
      '  A -- "metadata.owner" --> B',
      '```',
      '',
      '<!-- /their words -->',
      '',
    ].join('\n')
    expect(problems(text)).toEqual([])
  })

  it('reads living documents, the glossary and the site pages, not the decision log, a resolved issue or a dated record', () => {
    const open = 'Status: ready-for-agent\n'
    expect(isCheckedForNamedIdentifiers('apps/docs/src/content/docs/delivered.mdx', '')).toBe(true)
    expect(isCheckedForNamedIdentifiers(GLOSSARY_FILE, '')).toBe(true)
    expect(isCheckedForNamedIdentifiers('docs/adr/0099-x.md', '')).toBe(true)
    expect(isCheckedForNamedIdentifiers('docs/issues/0098-x.md', open)).toBe(true)
    expect(isCheckedForNamedIdentifiers('docs/issues/0089-x.md', 'Status: resolved\n')).toBe(false)
    expect(isCheckedForNamedIdentifiers(DECISION_LOG, '')).toBe(false)
    expect(isCheckedForNamedIdentifiers('docs/evidence/2026-09-22-p09.md', '')).toBe(false)
  })
})
