/**
 * Where repository files appear on the docs site.
 *
 * The site renders some repository Markdown in place (D61): ADRs, evidence
 * notes, research records and the glossary. Every other repository file is
 * linked on GitHub. This module is the one table of that mapping, shared by
 * the content loader and the link rewriter.
 */
import { existsSync, statSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'

export const GITHUB_REPOSITORY = 'https://github.com/pietgk/viviefs'
const GITHUB_BRANCH = 'main'

/** A repository directory whose Markdown files the site renders as pages. */
export type RenderedDirectory = {
  readonly directory: string
  readonly route: string
}

export const RENDERED_DIRECTORIES: ReadonlyArray<RenderedDirectory> = [
  { directory: 'docs/adr', route: 'reference/adr' },
  { directory: 'docs/evidence', route: 'reference/evidence' },
  { directory: 'docs/research', route: 'research' },
  { directory: 'docs/issues', route: 'reference/issues' },
]

/** A single repository Markdown file the site renders as a page. */
export const RENDERED_FILES: ReadonlyArray<{
  readonly file: string
  readonly route: string
}> = [
  { file: 'GLOSSARY.md', route: 'reference/glossary' },
  // Decisions are reference (D89); the rest of docs/plan stays on GitHub.
  { file: 'docs/plan/bootstrap/02-decision-log.md', route: 'reference/decisions' },
]

/**
 * Research records that are HTML pages (D68) are served byte for byte from
 * this directory, next to the Markdown records.
 */
export const RAW_HTML_DIRECTORY = 'docs/research'

/** Finds the repository root: the nearest directory with `pnpm-workspace.yaml`. */
export const findRepositoryRoot = (start: string = process.cwd()): string => {
  let directory = resolve(start)
  while (!existsSync(join(directory, 'pnpm-workspace.yaml'))) {
    const parent = dirname(directory)
    if (parent === directory) {
      throw new Error(`No pnpm-workspace.yaml above ${start}`)
    }
    directory = parent
  }
  return directory
}

/** The page route for a Markdown file in a rendered directory. */
const markdownRoute = (route: string, fileName: string): string =>
  fileName === 'README.md' ? route : `${route}/${fileName.replace(/\.md$/, '')}`

/** The site URL of a repository path the site renders, or null. */
export const siteUrlFor = (repositoryPath: string): string | null => {
  const file = RENDERED_FILES.find((entry) => entry.file === repositoryPath)
  if (file) return `/${file.route}/`
  const directory = posix.dirname(repositoryPath)
  const fileName = posix.basename(repositoryPath)
  if (directory === RAW_HTML_DIRECTORY && fileName.endsWith('.html')) {
    return `/${RAW_HTML_DIRECTORY.replace(/^docs\//, '')}/${fileName}`
  }
  const rendered = RENDERED_DIRECTORIES.find(
    (entry) => entry.directory === directory,
  )
  if (!rendered || !fileName.endsWith('.md')) return null
  return `/${markdownRoute(rendered.route, fileName)}/`
}

/** The page route (no slashes around it) of a rendered Markdown file. */
export const routeFor = (repositoryPath: string): string | null =>
  siteUrlFor(repositoryPath)?.replace(/^\/|\/$/g, '') ?? null

export type LinkTarget =
  | { readonly _tag: 'Untouched' }
  | { readonly _tag: 'Rewritten'; readonly href: string }
  | { readonly _tag: 'Missing'; readonly repositoryPath: string }
  | { readonly _tag: 'OutsideRepository'; readonly path: string }

const SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Resolves a link written in a repository file.
 *
 * A relative link is a file link: it resolves against the file it is written
 * in, like on GitHub. It becomes a site URL when the site renders the target,
 * and a GitHub URL otherwise. A target that does not exist is `Missing`, so
 * the build can fail. Absolute URLs, site paths (`/...`) and in-page anchors
 * are left alone; the links validator checks site paths.
 */
export const resolveLink = (
  repositoryRoot: string,
  sourceFile: string,
  url: string,
): LinkTarget => {
  if (url === '' || url.startsWith('#') || url.startsWith('/') || SCHEME.test(url)) {
    return { _tag: 'Untouched' }
  }
  const hashAt = url.indexOf('#')
  const pathPart = decodeURI(hashAt === -1 ? url : url.slice(0, hashAt))
  const hash = hashAt === -1 ? '' : url.slice(hashAt)
  const absolute = resolve(dirname(sourceFile), pathPart.split('?')[0] ?? '')
  const repositoryPath = relative(repositoryRoot, absolute).split('\\').join('/')
  if (repositoryPath.startsWith('..')) {
    return { _tag: 'OutsideRepository', path: absolute }
  }
  if (!existsSync(absolute)) return { _tag: 'Missing', repositoryPath }
  const site = siteUrlFor(repositoryPath)
  if (site) return { _tag: 'Rewritten', href: `${site}${hash}` }
  const kind = statSync(absolute).isDirectory() ? 'tree' : 'blob'
  const path = repositoryPath === '' ? '' : `/${repositoryPath}`
  return {
    _tag: 'Rewritten',
    href: `${GITHUB_REPOSITORY}/${kind}/${GITHUB_BRANCH}${path}${hash}`,
  }
}
