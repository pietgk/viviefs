// Repository Markdown is rendered in place (D61): its heading is the title,
// and an ADR's status is its sidebar badge.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { parseRepositoryPage, sidebarItems, statusBadge } from './repo-pages.ts'

describe('parseRepositoryPage', () => {
  it('takes the title from the heading and the status from its line', () => {
    const page = parseRepositoryPage(
      'docs/adr/0099-example.md',
      '# ADR-0011: Log store pattern\n\nStatus: Qualified\n\nBody.\n',
    )
    expect(page).toEqual({
      title: 'ADR-0011: Log store pattern',
      body: '\nStatus: Qualified\n\nBody.\n',
      status: 'Qualified',
    })
  })

  it('drops code marks from the title', () => {
    expect(parseRepositoryPage('docs/adr/0099-example.md', '# ADR-0099: Clock for `tx`\n').title).toBe(
      'ADR-0099: Clock for tx',
    )
  })

  it('fails on a file without a heading', () => {
    expect(() => parseRepositoryPage('docs/evidence/x.md', 'No heading.\n')).toThrow(
      'docs/evidence/x.md does not start with a "# " heading.',
    )
  })
})

describe('statusBadge', () => {
  it('shows the first word of the status', () => {
    expect(statusBadge('Qualified (P07 native resume). P17 unverified')).toEqual({
      text: 'Qualified',
      variant: 'note',
    })
    expect(statusBadge('Proposed, unverified')).toEqual({ text: 'Proposed', variant: 'default' })
    expect(statusBadge('Accepted 2026-10-01')).toEqual({ text: 'Accepted', variant: 'success' })
  })
})

describe('sidebarItems', () => {
  const root = mkdtempSync(join(tmpdir(), 'viviefs-sidebar-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))
  const write = (path: string, content: string) => {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  write('docs/adr/README.md', '# Decisions\n')
  write('docs/adr/0002-second.md', '# ADR-0002: Second\n\nStatus: Proposed, unverified\n')
  write('docs/adr/0001-first.md', '# ADR-0001: First\n\nStatus: Qualified\n')
  write('docs/adr/template.md', '# ADR-NNNN: Title\n\nStatus: Proposed, unverified\n')
  write('docs/research/README.md', '# Research records\n')
  write('docs/research/2026-01-01-note.html', '<title>A note</title>')

  it('lists the index first, then pages in file order, with ADR badges', () => {
    expect(sidebarItems(root, 'docs/adr')).toEqual([
      { label: 'Index', slug: 'reference/adr' },
      { label: '0001: First', slug: 'reference/adr/0001-first', badge: { text: 'Qualified', variant: 'note' } },
      { label: '0002: Second', slug: 'reference/adr/0002-second', badge: { text: 'Proposed', variant: 'default' } },
      { label: 'NNNN: Title', slug: 'reference/adr/template' },
    ])
  })

  it('links HTML research records by their title', () => {
    expect(sidebarItems(root, 'docs/research')).toEqual([
      { label: 'Index', slug: 'research' },
      { label: 'A note', link: '/research/2026-01-01-note.html' },
    ])
  })
})
