// Repository links resolve like on GitHub and land where the site renders the
// file (D61). A link to a file that does not exist must fail, next to links
// that resolve. The links resolve in a fixture repository, so no test here
// depends on a real document (the docs-only rule skips this test).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { rewriteHtmlLinks, rewriteLink } from './repo-links.ts'
import { docsBase, RENDERED_FILES, resolveLink, routeFor, siteUrlFor, withBase, withoutBase } from './repo.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

for (const file of [
  'docs/adr/0001-first.md',
  'docs/adr/0002-second.md',
  'docs/evidence/note.md',
  'docs/plan/plan.md',
  'docs/research/2026-01-01-record.html',
  'docs/research/XDevl/insights.md',
  'docs/research/XDevl/concept-map.html',
  'libs/example/src/index.ts',
]) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), '')
}
const adr = join(root, 'docs/adr/0001-first.md')

describe('siteUrlFor', () => {
  it('maps rendered Markdown to its page', () => {
    expect(siteUrlFor('docs/adr/0002-second.md')).toBe('/reference/adr/0002-second/')
    expect(siteUrlFor('docs/evidence/README.md')).toBe('/reference/evidence/')
    for (const { file, route } of RENDERED_FILES) {
      expect(siteUrlFor(file)).toBe(`/${route}/`)
    }
  })

  it('serves HTML research records as they are', () => {
    expect(siteUrlFor('docs/research/2026-01-01-record.html')).toBe(
      '/research/2026-01-01-record.html',
    )
  })

  it('renders a nested research area, including its html', () => {
    expect(siteUrlFor('docs/research/XDevl/README.md')).toBe('/research/XDevl/')
    expect(siteUrlFor('docs/research/XDevl/insights.md')).toBe('/research/XDevl/insights/')
    expect(siteUrlFor('docs/research/XDevl/snapshots/2026-01-02-note.md')).toBe(
      '/research/XDevl/snapshots/2026-01-02-note/',
    )
    expect(siteUrlFor('docs/research/XDevl/concept-map.html')).toBe(
      '/research/XDevl/concept-map.html',
    )
  })

  it('does not render other files', () => {
    expect(siteUrlFor('docs/plan/plan.md')).toBeNull()
    expect(siteUrlFor('docs/adr/extra/note.md')).toBeNull()
    expect(siteUrlFor('docs/adr/note.html')).toBeNull()
    expect(siteUrlFor('docs/research/XDevl/notes.txt')).toBeNull()
    expect(siteUrlFor('docs/research-notes/foo.md')).toBeNull()
    expect(siteUrlFor('libs/example/src/index.ts')).toBeNull()
  })
})

describe('resolveLink', () => {
  it('keeps the anchor on a rendered page', () => {
    expect(resolveLink(root, adr, '0002-second.md#design')).toEqual({
      _tag: 'Rewritten',
      href: '/reference/adr/0002-second/#design',
    })
  })

  it('links a nested research page on the site', () => {
    expect(resolveLink(root, adr, '../research/XDevl/insights.md')).toEqual({
      _tag: 'Rewritten',
      href: '/research/XDevl/insights/',
    })
    expect(resolveLink(root, adr, '../research/XDevl/concept-map.html')).toEqual({
      _tag: 'Rewritten',
      href: '/research/XDevl/concept-map.html',
    })
  })

  it('links a file the site does not render on GitHub', () => {
    expect(resolveLink(root, adr, '../plan/plan.md')).toEqual({
      _tag: 'Rewritten',
      href: 'https://github.com/pietgk/viviefs/blob/main/docs/plan/plan.md',
    })
    expect(resolveLink(root, adr, '../../libs/example')).toEqual({
      _tag: 'Rewritten',
      href: 'https://github.com/pietgk/viviefs/tree/main/libs/example',
    })
  })

  it('leaves URLs, site paths and anchors alone', () => {
    for (const url of ['https://effect.website', '/guides/', '#design', 'mailto:a@b.c']) {
      expect(resolveLink(root, adr, url)).toEqual({ _tag: 'Untouched' })
    }
  })

  it('reports a file that does not exist', () => {
    expect(resolveLink(root, adr, '0099-missing.md')).toEqual({
      _tag: 'Missing',
      repositoryPath: 'docs/adr/0099-missing.md',
    })
  })

  it('reports a link that leaves the repository', () => {
    expect(resolveLink(root, adr, '../../../outside.md')._tag).toBe('OutsideRepository')
  })

  it('prefixes a site path once when GitHub Pages sets the base', () => {
    expect(withBase('/guides/', '/viviefs')).toBe('/viviefs/guides/')
    expect(withBase('/viviefs/guides/', '/viviefs')).toBe('/viviefs/guides/')
    expect(withBase('https://github.com/pietgk/viviefs/blob/main/README.md', '/viviefs')).toBe(
      'https://github.com/pietgk/viviefs/blob/main/README.md',
    )
    expect(withBase('#design', '/viviefs')).toBe('#design')
    expect(withBase('//example.com/a', '/viviefs')).toBe('//example.com/a')
    const previous = process.env['DOCS_BASE']
    process.env['DOCS_BASE'] = '/viviefs'
    try {
      expect(siteUrlFor('docs/adr/0002-second.md')).toBe('/reference/adr/0002-second/')
      expect(routeFor('docs/adr/0002-second.md')).toBe('reference/adr/0002-second')
      expect(resolveLink(root, adr, '0002-second.md#design')).toEqual({
        _tag: 'Rewritten',
        href: '/viviefs/reference/adr/0002-second/#design',
      })
      expect(resolveLink(root, adr, '/guides/')).toEqual({ _tag: 'Rewritten', href: '/viviefs/guides/' })
      expect(resolveLink(root, adr, 'https://effect.website')).toEqual({ _tag: 'Untouched' })
      expect(resolveLink(root, adr, '#design')).toEqual({ _tag: 'Untouched' })
      expect(resolveLink(root, adr, '../plan/plan.md')).toEqual({
        _tag: 'Rewritten',
        href: 'https://github.com/pietgk/viviefs/blob/main/docs/plan/plan.md',
      })
    } finally {
      if (previous === undefined) delete process.env['DOCS_BASE']
      else process.env['DOCS_BASE'] = previous
    }
  })

  it('rejects a base that is not a site path, and strips one trailing slash', () => {
    expect(withBase('/viviefs', '/viviefs')).toBe('/viviefs')
    expect(withoutBase('/viviefs/guides/', '/viviefs')).toBe('/guides/')
    expect(withoutBase('/viviefs', '/viviefs')).toBe('/')
    expect(withoutBase('/viviefsx/guides/', '/viviefs')).toBe('/viviefsx/guides/')
    expect(withoutBase('/guides/', '/')).toBe('/guides/')
    expect(withBase('/guides/', '/')).toBe('/guides/')
    const previous = process.env['DOCS_BASE']
    process.env['DOCS_BASE'] = 'viviefs'
    try {
      expect(() => docsBase()).toThrow('DOCS_BASE must start with /')
    } finally {
      process.env['DOCS_BASE'] = '/viviefs/'
      try {
        expect(docsBase()).toBe('/viviefs')
      } finally {
        if (previous === undefined) delete process.env['DOCS_BASE']
        else process.env['DOCS_BASE'] = previous
      }
    }
  })
})

describe('rewriteLink', () => {
  it('fails the build on a missing file', () => {
    expect(() => rewriteLink(root, adr, '0099-missing.md')).toThrow(
      'points at docs/adr/0099-missing.md, which does not exist',
    )
  })

  it('rewrites the href attributes of an HTML record', () => {
    const record = join(root, 'docs/research/2026-01-01-record.html')
    const html = '<a href="../evidence/note.md">x</a> <a href="https://x.y">y</a>'
    expect(rewriteHtmlLinks(root, record, html)).toBe(
      '<a href="/reference/evidence/note/">x</a> <a href="https://x.y">y</a>',
    )
  })
})
