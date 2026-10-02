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
import { glob, type Loader, type LoaderContext } from 'astro/loaders'
import { CLAIMS_ROUTE, claimsMarkdown, GATE_TABLE, GATE_TABLE_DOC } from './claims.ts'
import { TEMPLATE_DIRECTORY, TEMPLATE_ROUTE } from './guides.ts'
import { findRepositoryRoot, routeFor } from './repo.ts'
import { parseRepositoryPage, repositoryMarkdownFiles } from './repo-pages.ts'

type DataStore = LoaderContext['store']

/**
 * A view of the store in which a glob loader sees only its own entries. A
 * glob loader deletes every entry it did not load; two of them sharing one
 * collection would delete each other's pages.
 */
const scopedStore = (store: DataStore, owns: (id: string) => boolean): DataStore =>
  new Proxy(store, {
    get(target, property) {
      if (property === 'keys') return () => target.keys().filter(owns)
      const value: unknown = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

const isTemplatePage = (id: string) => id === TEMPLATE_ROUTE || id.startsWith(`${TEMPLATE_ROUTE}/`)

/**
 * The guide template, published from where it lives (D62) as MDX pages
 * under Reference, so it renders like the guides it shapes.
 */
const templateLoader = (root: string): Loader =>
  glob({
    base: join(root, TEMPLATE_DIRECTORY),
    pattern: '**/*.mdx',
    generateId: ({ entry }) => {
      const page = entry.replace(/\.mdx$/, '')
      return page === 'index' ? TEMPLATE_ROUTE : `${TEMPLATE_ROUTE}/${page}`
    },
  })

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

/**
 * Reference > Claims (D93), generated from the gate tables, the ADRs and the
 * evidence notes. It renders as if written in the plan's gate table, whose
 * relative links its pass conditions carry.
 */
const loadClaimsPage = async (context: LoaderContext, root: string) => {
  const body = claimsMarkdown(root)
  const data = await context.parseData({ id: CLAIMS_ROUTE, data: { title: 'Claims' } })
  context.store.set({
    id: CLAIMS_ROUTE,
    data,
    body,
    filePath: relative(process.cwd(), join(root, GATE_TABLE)),
    digest: context.generateDigest(body),
    rendered: await context.renderMarkdown(`---\nslug: ${CLAIMS_ROUTE}\n---\n${body}`, {
      fileURL: pathToFileURL(join(root, GATE_TABLE_DOC)),
    }),
  })
}

export const repoDocsLoader = (): Loader => {
  const starlight = docsLoader()
  return {
    name: 'viviefs-repo-docs',
    load: async (context) => {
      // Starlight's glob loader removes entries it did not load, so it sees
      // only its own; the template's loader sees only the template, and the
      // repository pages are added after both.
      const root = findRepositoryRoot()
      await starlight.load({ ...context, store: scopedStore(context.store, (id) => !isTemplatePage(id)) })
      await templateLoader(root).load({ ...context, store: scopedStore(context.store, isTemplatePage) })
      const files = repositoryMarkdownFiles(root)
      for (const file of files) await loadRepositoryPage(context, root, file)
      await loadClaimsPage(context, root)
      context.watcher?.add(files.map((file) => join(root, file)))
      context.watcher?.on('change', async (changed) => {
        const file = relative(root, changed).split('\\').join('/')
        if (files.includes(file)) await loadRepositoryPage(context, root, file)
      })
    },
  }
}
