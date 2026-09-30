/**
 * Research records written as HTML pages (D68) are served as they are, with
 * their repository file links pointed at the site or GitHub.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { APIRoute, GetStaticPaths } from 'astro'
import { rewriteHtmlLinks } from '../../lib/repo-links.ts'
import { RAW_HTML_DIRECTORY, findRepositoryRoot } from '../../lib/repo.ts'

export const getStaticPaths: GetStaticPaths = () =>
  readdirSync(join(findRepositoryRoot(), RAW_HTML_DIRECTORY))
    .filter((name) => name.endsWith('.html'))
    .map((name) => ({ params: { record: name.replace(/\.html$/, '') } }))

export const GET: APIRoute = ({ params }) => {
  const root = findRepositoryRoot()
  const file = join(root, RAW_HTML_DIRECTORY, `${params['record']}.html`)
  return new Response(rewriteHtmlLinks(root, file, readFileSync(file, 'utf8')), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
