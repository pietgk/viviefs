/**
 * Repository Markdown rendered in place (D61): each file's title, ADR status,
 * and its place in the sidebar. Repository files have no frontmatter; the
 * `# ` heading is the title, unless the site gives the file another, and an
 * ADR's `Status:` line is its badge.
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
  const site = RENDERED_FILES.find((entry) => entry.file === path)?.title
  // Page titles are plain text; code marks in a heading would show as backticks.
  return { title: site ?? title.replaceAll('`', '').trim(), body, status }
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

const childDirectories = (root: string, directory: string) =>
  readdirSync(join(root, directory), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

/** A rendered directory whose nested Markdown is also a page (`docs/research`). */
const listsNested = (directory: string) =>
  RENDERED_DIRECTORIES.some(
    (entry) =>
      entry.nested === true &&
      (directory === entry.directory || directory.startsWith(`${entry.directory}/`)),
  )

const markdownUnder = (root: string, directory: string, nested: boolean): string[] => {
  const here = filesIn(root, directory, '.md')
  if (!nested) return here
  return [
    ...here,
    ...childDirectories(root, directory).flatMap((name) => markdownUnder(root, `${directory}/${name}`, true)),
  ]
}

/** Every repository Markdown file the site renders, as repository paths. */
export const repositoryMarkdownFiles = (root: string): string[] => [
  ...RENDERED_FILES.map((entry) => entry.file),
  ...RENDERED_DIRECTORIES.flatMap(({ directory, nested }) => markdownUnder(root, directory, nested === true)),
]

/** Research HTML, including a file nested under `docs/research`. Paths are repository paths. */
export const researchHtmlFiles = (root: string): string[] => {
  const walk = (directory: string): string[] => [
    ...filesIn(root, directory, '.html'),
    ...childDirectories(root, directory).flatMap((name) => walk(`${directory}/${name}`)),
  ]
  return walk(RAW_HTML_DIRECTORY)
}

export type SidebarItem =
  | { readonly label: string; readonly slug: string; readonly badge?: Badge }
  | { readonly label: string; readonly link: string }
  | { readonly label: string; readonly collapsed: true; readonly items: readonly SidebarItem[] }

const htmlTitle = (path: string, html: string): string => {
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]?.trim()
  if (!title) throw new Error(`${path} has no <title>.`)
  return title
}

/** A numbered ADR or issue: the pages with a status badge. */
const NUMBERED_RECORD = /^docs\/(?:adr|issues)\/\d{4}-[^/]+\.md$/

/**
 * The sidebar entries of a rendered directory: its README as "Index", then
 * every other page in file order, then HTML records. A nested research
 * directory becomes a collapsed group, so a living area sits beside the
 * dated records. Starlight's `autogenerate` groups content by path under
 * `src/content/docs`, which these files are not.
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
  if (!listsNested(directory)) return pages
  const groups = childDirectories(root, directory).map(
    (name): SidebarItem => ({
      label: name,
      collapsed: true,
      items: sidebarItems(root, `${directory}/${name}`),
    }),
  )
  const records = filesIn(root, directory, '.html').map((path): SidebarItem => {
    const link = siteUrlFor(path)
    if (link === null) throw new Error(`${path} has no site URL.`)
    // Starlight's sidebar formatter removes a trailing `.html`, which misses
    // the file. An encoded dot stays a file URL after Starlight adds the base.
    return {
      label: htmlTitle(path, readFileSync(join(root, path), 'utf8')),
      link: link.replace(/\.html$/, '%2Ehtml'),
    }
  })
  const first = markdown[0]
  const readmeFirst = first !== undefined && first.endsWith('/README.md')
  const head = readmeFirst ? pages.slice(0, 1) : []
  const tail = readmeFirst ? pages.slice(1) : pages
  return [...head, ...groups, ...tail, ...records]
}
