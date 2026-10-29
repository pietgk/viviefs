/**
 * Every page the site serves, by its URL, with what its preview card shows
 * (D90'): the kind Page, the page's title and its first sentence. A content
 * page's frontmatter `description`, an ADR's `Summary:` line, a repository
 * page's first paragraph, or a research record's first `<p>` is that sentence.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { firstSentence, plainText } from '@viviefs/references'
import { CLAIMS_ROUTE, claimsMarkdown } from './claims.ts'
import { TEMPLATE_ROUTE } from './guides.ts'
import { parseRepositoryPage } from './repo-pages.ts'
import { RAW_HTML_DIRECTORY, RENDERED_DIRECTORIES, RENDERED_FILES, siteUrlFor, withoutBase } from './repo.ts'

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

const GATES = 'tools/qualification/src/gates.ts'

/** Every file the index is read from, so an edit to any of them is seen. */
const sourceFiles = (root: string): ReadonlyArray<string> => [
  ...contentFiles(root, CONTENT),
  ...contentFiles(root, TEMPLATE),
  ...RENDERED_FILES.map(({ file }) => file),
  ...[...RENDERED_DIRECTORIES.map(({ directory }) => directory), RAW_HTML_DIRECTORY].flatMap((directory) =>
    existsSync(join(root, directory)) ? readdirSync(join(root, directory)).map((name) => `${directory}/${name}`) : [],
  ),
  GATES,
]

const read = (root: string, files: ReadonlyArray<string>): ReadonlyMap<string, SitePage> => {
  const pages = new Map<string, SitePage>()
  for (const [directory, base] of [[CONTENT, ''], [TEMPLATE, TEMPLATE_ROUTE]] as const) {
    for (const file of files.filter((path) => path.startsWith(`${directory}/`))) {
      const source = readFileSync(join(root, file), 'utf8')
      const title = frontmatterField(source, 'title')
      if (title === undefined) continue
      const body = source.replace(/^---\n[\s\S]*?\n---\n/, '')
      const summary = frontmatterField(source, 'description') ?? firstProseSentence(body.replace(/^import .*$/gm, ''))
      pages.set(contentUrl(base, file.slice(directory.length + 1)), { title, summary })
    }
  }
  for (const path of files.filter((file) => file.endsWith('.md') && !file.startsWith('apps/'))) {
    const url = siteUrlFor(path)
    if (url === null || !existsSync(join(root, path))) continue
    const page = parseRepositoryPage(path, readFileSync(join(root, path), 'utf8'))
    pages.set(url, { title: page.title, summary: firstProseSentence(page.body) })
  }
  for (const path of files.filter((file) => file.endsWith('.html'))) {
    const url = siteUrlFor(path)
    const html = readFileSync(join(root, path), 'utf8')
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]
    if (url === null || title === undefined) continue
    const paragraph = /<p\b[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? ''
    pages.set(url, { title: htmlText(title), summary: firstSentence(htmlText(paragraph)) })
  }
  if (existsSync(join(root, GATES))) {
    pages.set(`/${CLAIMS_ROUTE}/`, { title: 'Claims', summary: firstProseSentence(claimsMarkdown(root)) })
  }
  return pages
}

const cache = new Map<string, { readonly version: string; readonly pages: ReadonlyMap<string, SitePage> }>()

/**
 * Every page of the site by URL. It is read again when a source file changes,
 * so the development server shows an edited title; the reference plugin asks
 * once per rendered page.
 */
export const sitePages = (root: string): ReadonlyMap<string, SitePage> => {
  const files = sourceFiles(root)
  const version = files.map((path) => (existsSync(join(root, path)) ? statSync(join(root, path)).mtimeMs : 0)).join()
  const cached = cache.get(root)
  if (cached?.version === version) return cached.pages
  const pages = read(root, files)
  cache.set(root, { version, pages })
  return pages
}

/**
 * The page a site link opens, ignoring its section and query; undefined for
 * anything else. On the published site a link carries the base (D61'').
 */
export const pageAt = (pages: ReadonlyMap<string, SitePage>, url: string): SitePage | undefined => {
  if (!url.startsWith('/') || url.startsWith('//')) return undefined
  const path = withoutBase(url.replace(/[?#].*$/, ''))
  return pages.get(path) ?? pages.get(path.endsWith('/') || path.endsWith('.html') ? path : `${path}/`)
}
