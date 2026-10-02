// Guides appear in the sidebar in reading order, one group each (D62). The
// fixture repository keeps the test independent of real guides.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { frontmatterTitle, GUIDES_DIRECTORY, guideGroups } from './guides.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-guides-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const pages: Record<string, string> = {
  'index.mdx': 'Log store',
  'concepts.mdx': 'Concepts',
  'how-to.mdx': 'How-to',
  'testing.mdx': 'Testing',
  'review.mdx': 'Review',
  'try-it.mdx': 'Try it',
  'lessons/02-time.mdx': 'Time without a trusted clock',
  'lessons/01-fact.mdx': 'A datom is one fact',
}
for (const [file, title] of Object.entries(pages)) {
  const path = join(root, GUIDES_DIRECTORY, 'log-store', file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `---\ntitle: ${title}\n---\n`)
}

describe('guide sidebar', () => {
  it('reads the title from the frontmatter, and fails without one', () => {
    expect(frontmatterTitle('a.mdx', "---\ntitle: 'Log store'\nstatus: draft\n---\nbody")).toBe('Log store')
    expect(() => frontmatterTitle('a.mdx', '# Log store')).toThrow(/no frontmatter title/)
  })

  it('lists each guide in reading order, lessons in their own group', () => {
    expect(guideGroups(root)).toEqual([
      {
        label: 'Log store',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'guides/log-store' },
          { label: 'Concepts', slug: 'guides/log-store/concepts' },
          { label: 'How-to', slug: 'guides/log-store/how-to' },
          { label: 'Testing', slug: 'guides/log-store/testing' },
          { label: 'Review', slug: 'guides/log-store/review' },
          {
            label: 'Lessons',
            items: [
              { label: 'A datom is one fact', slug: 'guides/log-store/lessons/01-fact' },
              { label: 'Time without a trusted clock', slug: 'guides/log-store/lessons/02-time' },
            ],
          },
          { label: 'Try it', slug: 'guides/log-store/try-it' },
        ],
      },
    ])
  })
})
