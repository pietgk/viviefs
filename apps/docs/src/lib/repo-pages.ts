/**
 * Repository Markdown rendered in place (D61): each file's title, ADR status,
 * and its place in the sidebar. Repository files have no frontmatter; the
 * `# ` heading is the title and an ADR's `Status:` line is its badge.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  RAW_HTML_DIRECTORY,
  RENDERED_DIRECTORIES,
  RENDERED_FILES,
  routeFor,
  siteUrlFor,
} from './repo.ts'

export type RepositoryPage = {
  readonly title: string
  readonly body: string
  readonly status: string | null
}

/** Splits a repository Markdown file into its title, body and ADR status. */
export const parseRepositoryPage = (
  path: string,
  source: string,
): RepositoryPage => {
  const [heading, title] = /^# (.+)\n/.exec(source) ?? []
  if (heading === undefined || title === undefined) {
    throw new Error(`${path} does not start with a "# " heading.`)
  }
  const body = source.slice(heading.length)
  const status = /^Status: (.+)$/m.exec(body)?.[1] ?? null
  // Page titles are plain text; code marks in a heading would show as backticks.
  return { title: title.replaceAll('`', '').trim(), body, status }
}

export type Badge = {
  readonly text: string
  readonly variant: 'success' | 'note' | 'caution' | 'default'
}

/**
 * The sidebar badge of an ADR or an issue: the first word of its status
 * (`Qualified`), or the whole triage role of an issue (`ready-for-human`).
 */
export const statusBadge = (status: string): Badge => {
  const word = /^[A-Za-z-]+/.exec(status)?.[0] ?? status
  const variant =
    word === 'Accepted' || word === 'resolved'
      ? 'success'
      : word === 'Qualified' || word.startsWith('ready-for-')
        ? 'note'
        : word.startsWith('needs-')
          ? 'caution'
          : 'default'
  return { text: word, variant }
}

const filesIn = (root: string, directory: string, extension: string) =>
  readdirSync(join(root, directory))
    .filter((name) => name.endsWith(extension))
    .sort()
    .map((name) => `${directory}/${name}`)

/** Every repository Markdown file the site renders, as repository paths. */
export const repositoryMarkdownFiles = (root: string): string[] => [
  ...RENDERED_FILES.map((entry) => entry.file),
  ...RENDERED_DIRECTORIES.flatMap(({ directory }) =>
    filesIn(root, directory, '.md'),
  ),
]

export type SidebarItem =
  | { readonly label: string; readonly slug: string; readonly badge?: Badge }
  | { readonly label: string; readonly link: string }

const htmlTitle = (path: string, html: string): string => {
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]?.trim()
  if (!title) throw new Error(`${path} has no <title>.`)
  return title
}

/** A numbered ADR or issue: the pages with a status badge. */
const NUMBERED_RECORD = /^docs\/(?:adr|issues)\/\d{4}-[^/]+\.md$/

/**
 * The sidebar entries of a rendered directory: its README as "Index", then
 * every other page in file order, then HTML records. Starlight's
 * `autogenerate` groups content by path under `src/content/docs`, which
 * these files are not.
 */
export const sidebarItems = (
  root: string,
  directory: string,
): SidebarItem[] => {
  const markdown = filesIn(root, directory, '.md').sort(
    (a, b) => Number(!a.endsWith('/README.md')) - Number(!b.endsWith('/README.md')),
  )
  const pages = markdown.map((path): SidebarItem => {
    const page = parseRepositoryPage(path, readFileSync(join(root, path), 'utf8'))
    const slug = routeFor(path)
    if (slug === null) throw new Error(`${path} has no site route.`)
    const label = path.endsWith('/README.md')
      ? 'Index'
      : path.endsWith('/template.md')
        ? 'Template'
        : page.title.replace(/^ADR-/, '')
    return NUMBERED_RECORD.test(path) && page.status !== null
      ? { label, slug, badge: statusBadge(page.status) }
      : { label, slug }
  })
  if (directory !== RAW_HTML_DIRECTORY) return pages
  const records = filesIn(root, directory, '.html').map((path): SidebarItem => {
    const link = siteUrlFor(path)
    if (link === null) throw new Error(`${path} has no site URL.`)
    return { label: htmlTitle(path, readFileSync(join(root, path), 'utf8')), link }
  })
  return [...pages, ...records]
}
