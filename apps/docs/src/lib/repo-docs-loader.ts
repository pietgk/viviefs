/**
 * The docs collection: Starlight's own pages, plus repository Markdown
 * rendered in place (D61). No file is copied into the site.
 *
 * A repository file has no frontmatter; its `# ` heading is the page title
 * (`repo-pages.ts`).
 */
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { docsLoader } from '@astrojs/starlight/loaders'
import type { Loader, LoaderContext } from 'astro/loaders'
import { findRepositoryRoot, routeFor } from './repo.ts'
import { parseRepositoryPage, repositoryMarkdownFiles } from './repo-pages.ts'

const loadRepositoryPage = async (
  context: LoaderContext,
  root: string,
  repositoryPath: string,
) => {
  const id = routeFor(repositoryPath)
  if (id === null) throw new Error(`${repositoryPath} has no site route.`)
  const absolute = join(root, repositoryPath)
  const source = readFileSync(absolute, 'utf8')
  const page = parseRepositoryPage(repositoryPath, source)
  const data = await context.parseData({
    id,
    data: {
      title: page.title,
    },
  })
  context.store.set({
    id,
    data,
    body: page.body,
    filePath: relative(process.cwd(), absolute),
    digest: context.generateDigest(source),
    // The frontmatter slug is how starlight-links-validator learns the page
    // and its headings: it knows only pages under src/content/docs by path.
    rendered: await context.renderMarkdown(
      `---\nslug: ${id}\n---\n${page.body}`,
      { fileURL: pathToFileURL(absolute) },
    ),
  })
}

export const repoDocsLoader = (): Loader => {
  const starlight = docsLoader()
  return {
    name: 'viviefs-repo-docs',
    load: async (context) => {
      // Starlight's glob loader removes entries it did not load, so it runs
      // first and the repository pages are added after it.
      await starlight.load(context)
      const root = findRepositoryRoot()
      const files = repositoryMarkdownFiles(root)
      for (const file of files) await loadRepositoryPage(context, root, file)
      context.watcher?.add(files.map((file) => join(root, file)))
      context.watcher?.on('change', async (changed) => {
        const file = relative(root, changed).split('\\').join('/')
        if (files.includes(file)) await loadRepositoryPage(context, root, file)
      })
    },
  }
}
