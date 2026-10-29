// The research index (D68): every record is named by its date and listed in
// docs/research/README.md, and every record the index links exists.
import { expect, it } from '@effect/vitest'
import { RESEARCH_INDEX, researchIndexProblems, researchRecords } from './research-index.ts'

const index = [
  '# Research records',
  '',
  'Name a record `YYYY-MM-DD-<topic>` with `.md` or `.html`; see [ADR-0026](../adr/0026-verify-qualify-teach.md).',
  '',
  '| Record | What it is |',
  '| --- | --- |',
  '| [2026-09-27 Token transport](2026-09-27-p11-q5-token-transport.html) | P11 explainer |',
  '| [2026-10-02 K-Plex](2026-10-02-k-plex.html) | Navigator; [primary-source findings](2026-10-02-k-plex.md#sources) |',
  '',
].join('\n')

it('reads the records: every file under docs/research but the index, so a misplaced one is caught', () => {
  expect(
    researchRecords([
      RESEARCH_INDEX,
      'docs/research/2026-10-02-k-plex.html',
      'docs/research/2026-10-02-k-plex.md',
      'docs/research/assets/diagram.svg',
      'docs/adr/0000-not-a-record.md',
    ]),
  ).toEqual(['2026-10-02-k-plex.html', '2026-10-02-k-plex.md', 'assets/diagram.svg'])
})

it('passes when every record is listed, a second link in a row included', () => {
  expect(researchIndexProblems(['2026-09-27-p11-q5-token-transport.html', '2026-10-02-k-plex.html', '2026-10-02-k-plex.md'], index)).toEqual([])
})

it('fails a record the index does not list', () => {
  expect(
    researchIndexProblems(
      ['2026-09-27-p11-q5-token-transport.html', '2026-10-02-k-plex.html', '2026-10-02-k-plex.md', '2026-10-28-map-2s-new-words-review.html'],
      index,
    ),
  ).toEqual([`docs/research/2026-10-28-map-2s-new-words-review.html: not in the index; add its row to ${RESEARCH_INDEX}`])
})

it('fails a record not named by its date, and one in a folder', () => {
  const records = ['2026-09-27-p11-q5-token-transport.html', '2026-10-02-k-plex.html', '2026-10-02-k-plex.md']
  expect(researchIndexProblems([...records, 'notes.md', '2026-10-2-short-date.md', '2026-10-29-review.pdf', 'assets/diagram.svg'], index)).toEqual([
    'docs/research/notes.md: name a record YYYY-MM-DD-<topic>.md or .html',
    `docs/research/notes.md: not in the index; add its row to ${RESEARCH_INDEX}`,
    'docs/research/2026-10-2-short-date.md: name a record YYYY-MM-DD-<topic>.md or .html',
    `docs/research/2026-10-2-short-date.md: not in the index; add its row to ${RESEARCH_INDEX}`,
    'docs/research/2026-10-29-review.pdf: name a record YYYY-MM-DD-<topic>.md or .html',
    `docs/research/2026-10-29-review.pdf: not in the index; add its row to ${RESEARCH_INDEX}`,
    'docs/research/assets/diagram.svg: name a record YYYY-MM-DD-<topic>.md or .html',
    `docs/research/assets/diagram.svg: not in the index; add its row to ${RESEARCH_INDEX}`,
  ])
})

it('fails a link in the index to a record that does not exist', () => {
  expect(researchIndexProblems(['2026-09-27-p11-q5-token-transport.html', '2026-10-02-k-plex.html'], index)).toEqual([
    `${RESEARCH_INDEX}: links 2026-10-02-k-plex.md, which is not a record here`,
  ])
})
