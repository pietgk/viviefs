import { expect, it } from '@effect/vitest'
import { GLOSSARY_FILE, glossaryReport, glossaryTerms, isLivingDocument, reportedNote } from './glossary-report.ts'

const glossary = [
  '# ViViEfs',
  '',
  '**Read model**:',
  'A table built from the facts.',
  '',
  '**Activity**:',
  'One step that touches the outside world.',
  '',
  '**Token verifier**:',
  "The server's check of an access token.",
  '_Avoid_: authenticator',
].join('\n')

it('reads the terms the glossary defines', () => {
  expect(glossaryTerms(glossary)).toEqual(['Read model', 'Activity', 'Token verifier'])
})

it('counts the terms and finds those no living document uses, plurals and any case included (D178)', () => {
  const report = glossaryReport(glossary, ['Every read model is disposable.', 'Two ACTIVITIES ran.'])
  expect(report).toEqual({ terms: 3, unused: ['Token verifier'] })
  expect(glossaryReport(glossary, ['read models, activities and the token verifier']).unused).toEqual([])
  // Whole words only: "reactivity" is not "activity".
  expect(glossaryReport(glossary, ['Reactivity keys; read model; token verifier']).unused).toEqual(['Activity'])
})

it('reads living documents only: not research records, evidence notes, resolved issues or the glossary', () => {
  expect(isLivingDocument('docs/adr/0999-example.md', '')).toBe(true)
  expect(isLivingDocument('docs/plan/example/map.md', '')).toBe(true)
  expect(isLivingDocument('apps/docs/src/content/docs/guides/example/index.mdx', '')).toBe(true)
  expect(isLivingDocument('docs/issues/0999-open.md', 'Status: ready-for-human\n')).toBe(true)
  expect(isLivingDocument('docs/issues/0998-done.md', 'Status: resolved\n')).toBe(false)
  expect(isLivingDocument('docs/research/2026-01-01-example.md', '')).toBe(false)
  expect(isLivingDocument('docs/evidence/2026-01-01-p99.md', '')).toBe(false)
  expect(isLivingDocument(GLOSSARY_FILE, '')).toBe(false)
  expect(isLivingDocument('libs/example/src/index.ts', '')).toBe(false)
  expect(isLivingDocument('libs/example/README.md', '')).toBe(false)
})

it('turns a report into the note on the verify row, and reads a note back from a step', () => {
  expect(reportedNote('Glossary: 3 terms.\nnote: 3 terms; 1 unused: Token verifier\n')).toBe('3 terms; 1 unused: Token verifier')
  expect(reportedNote('all fine\n')).toBeUndefined()
})
