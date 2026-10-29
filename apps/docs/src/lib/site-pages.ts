/**
 * Every page the site serves, by its URL, with what its preview card shows
 * (D90'): the kind Page, the page's title and its first sentence. A content
 * page's frontmatter `description`, an ADR's `Summary:` line, a repository
 * page's first paragraph, or a research record's first `<p>` is that sentence.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { firstSentence, plainText } from '@viviefs/references'
import { CLAIMS_ROUTE, claimsMarkdown } from './claims.ts'
import { TEMPLATE_ROUTE } from './guides.ts'
import { parseRepositoryPage } from './repo-pages.ts'
import { RAW_HTML_DIRECTORY, RENDERED_DIRECTORIES, RENDERED_FILES, siteUrlFor } from './repo.ts'

export type SitePage = {
  readonly title: string
  /** The page's first sentence, as plain text. */
  readonly summary: string
}

const CONTENT = 'apps/docs/src/content/docs'
const TEMPLATE = 'apps/docs/src/guide-template'

/** Every Markdown and MDX file under a directory, as repository paths. */
const contentFiles = (root: string, directory: string): ReadonlyArray<string> => {
  if (!existsSync(join(root, directory))) return []
  return readdirSync(join(root, directory), { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.mdx?$/.test(name))
    .map((name) => `${directory}/${name.split('\\').join('/')}`)
}

/** `guides/log-store/index.mdx` is `/guides/log-store/`; `index.mdx` is `/`. */
const contentUrl = (base: string, file: string): string => {
  const route = file.replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, '')
  const path = [base, route].filter((part) => part !== '').join('/')
  return path === '' ? '/' : `/${path}/`
}

const frontmatterField = (source: string, field: string): string | undefined => {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? ''
  const value = new RegExp(`^${field}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1]?.trim()
  return value?.replace(/^(['"])(.*)\1$/, '$2')
}

/** Reference-style links read as their labels: `[D107 The Presenter pattern][D107]`. */
const prose = (markdown: string): string => plainText(markdown.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1'))

/**
 * A repository page's first sentence: an ADR's Summary, else the first
 * paragraph of prose, past status lines, headings, tables, lists and code.
 */
export const firstProseSentence = (body: string): string => {
  const summary = /^Summary:\s*(.+)$/m.exec(body)?.[1]
  if (summary !== undefined) return firstSentence(prose(summary))
  const paragraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block !== '' &&
        !/^(?:#|\||<|```|~~~|[-*+] |\d+\. |>)/.test(block) &&
        !block.split('\n').every((line) => /^[A-Z][\w -]*: /.test(line)),
    )
  return paragraph === undefined ? '' : firstSentence(prose(paragraph))
}

const htmlText = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const cache = new Map<string, ReadonlyMap<string, SitePage>>()

/** Every page of the site by URL, read once per repository root. */
export const sitePages = (root: string): ReadonlyMap<string, SitePage> => {
  const cached = cache.get(root)
  if (cached) return cached
  const pages = new Map<string, SitePage>()
  const content = (directory: string, base: string) => {
    for (const file of contentFiles(root, directory)) {
      const source = readFileSync(join(root, file), 'utf8')
      const title = frontmatterField(source, 'title')
      if (title === undefined) continue
      const body = source.replace(/^---\n[\s\S]*?\n---\n/, '')
      const summary = frontmatterField(source, 'description') ?? firstProseSentence(body.replace(/^import .*$/gm, ''))
      pages.set(contentUrl(base, relative(join(root, directory), join(root, file)).split('\\').join('/')), { title, summary })
    }
  }
  content(CONTENT, '')
  content(TEMPLATE, TEMPLATE_ROUTE)
  const repositoryFiles = [
    ...RENDERED_FILES.map(({ file }) => file),
    ...RENDERED_DIRECTORIES.flatMap(({ directory }) =>
      existsSync(join(root, directory)) ? readdirSync(join(root, directory)).filter((name) => name.endsWith('.md')).map((name) => `${directory}/${name}`) : [],
    ),
  ].filter((path) => existsSync(join(root, path)))
  for (const path of repositoryFiles) {
    const url = siteUrlFor(path)
    if (url === null) continue
    const page = parseRepositoryPage(path, readFileSync(join(root, path), 'utf8'))
    pages.set(url, { title: page.title, summary: firstProseSentence(page.body) })
  }
  if (existsSync(join(root, RAW_HTML_DIRECTORY))) {
    for (const name of readdirSync(join(root, RAW_HTML_DIRECTORY)).filter((file) => file.endsWith('.html'))) {
      const path = `${RAW_HTML_DIRECTORY}/${name}`
      const url = siteUrlFor(path)
      const html = readFileSync(join(root, path), 'utf8')
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]
      if (url === null || title === undefined) continue
      const paragraph = /<p\b[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? ''
      pages.set(url, { title: htmlText(title), summary: firstSentence(htmlText(paragraph)) })
    }
  }
  if (existsSync(join(root, 'tools/qualification/src/gates.ts'))) {
    pages.set(`/${CLAIMS_ROUTE}/`, { title: 'Claims', summary: firstProseSentence(claimsMarkdown(root)) })
  }
  cache.set(root, pages)
  return pages
}

/** The page a site link opens, ignoring its section and query; undefined for anything else. */
export const pageAt = (root: string, url: string): SitePage | undefined => {
  if (!url.startsWith('/') || url.startsWith('//')) return undefined
  const path = url.replace(/[?#].*$/, '')
  const pages = sitePages(root)
  return pages.get(path) ?? pages.get(path.endsWith('/') || path.endsWith('.html') ? path : `${path}/`)
}
