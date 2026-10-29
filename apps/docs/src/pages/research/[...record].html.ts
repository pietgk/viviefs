/**
 * Research records written as HTML pages (D68) are served as they are, with
 * their repository file links pointed at the site or GitHub. A rest param
 * covers a file nested under `docs/research`, such as a living area's map.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { APIRoute, GetStaticPaths } from 'astro'
import { researchHtmlFiles } from '../../lib/repo-pages.ts'
import { rewriteHtmlLinks } from '../../lib/repo-links.ts'
import { RAW_HTML_DIRECTORY, findRepositoryRoot } from '../../lib/repo.ts'

export const getStaticPaths: GetStaticPaths = () =>
  researchHtmlFiles(findRepositoryRoot()).map((path) => ({
    params: {
      record: path.slice(`${RAW_HTML_DIRECTORY}/`.length).replace(/\.html$/, ''),
    },
  }))

export const GET: APIRoute = ({ params }) => {
  const value = params['record']
  const record = Array.isArray(value) ? value.join('/') : value
  if (typeof record !== 'string' || record.includes('..')) {
    return new Response('Not found', { status: 404 })
  }
  const root = findRepositoryRoot()
  const file = join(root, RAW_HTML_DIRECTORY, `${record}.html`)
  return new Response(rewriteHtmlLinks(root, file, readFileSync(file, 'utf8')), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
