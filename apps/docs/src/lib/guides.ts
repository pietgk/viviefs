/**
 * Guides in the sidebar (D62): one group per guide, its pages in reading
 * order, its lessons in their own group. The guide template is listed the
 * same way under Reference, so it reads like a guide.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Where guides live, and where the guide template lives. */
export const GUIDES_DIRECTORY = 'apps/docs/src/content/docs/guides'
export const TEMPLATE_DIRECTORY = 'apps/docs/src/guide-template'
export const TEMPLATE_ROUTE = 'reference/guide-template'

/**
 * A guide's pages in reading order. The template decides which pages exist
 * (the `guides` check in verify); this is only the order a reader meets them.
 */
export const GUIDE_PAGES = ['index', 'concepts', 'how-to', 'testing', 'review', 'lessons', 'try-it'] as const

export type GuideSidebarItem =
  | { readonly label: string; readonly slug: string }
  | { readonly label: string; readonly items: ReadonlyArray<GuideSidebarItem>; readonly collapsed?: boolean }

/** The `title` of an MDX page's frontmatter. */
export const frontmatterTitle = (path: string, source: string): string => {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1]
  const title = frontmatter === undefined ? undefined : /^title:\s*(.+)$/m.exec(frontmatter)?.[1]
  if (title === undefined) throw new Error(`${path} has no frontmatter title.`)
  return title.trim().replace(/^(['"])(.*)\1$/, '$2')
}

const page = (root: string, directory: string, name: string) => {
  const path = `${directory}/${name}.mdx`
  return existsSync(join(root, path)) ? { path, title: frontmatterTitle(path, readFileSync(join(root, path), 'utf8')) } : null
}

/** The sidebar items of one guide in `directory`, routed under `route`. */
export const guideItems = (root: string, directory: string, route: string): GuideSidebarItem[] =>
  GUIDE_PAGES.flatMap((name): GuideSidebarItem[] => {
    if (name === 'lessons') {
      const lessons = existsSync(join(root, directory, 'lessons'))
        ? readdirSync(join(root, directory, 'lessons')).filter((file) => file.endsWith('.mdx')).sort()
        : []
      if (lessons.length === 0) return []
      return [
        {
          label: 'Lessons',
          items: lessons.map((file) => {
            const lesson = page(root, `${directory}/lessons`, file.replace(/\.mdx$/, ''))
            if (lesson === null) throw new Error(`${directory}/lessons/${file} vanished.`)
            return { label: lesson.title, slug: `${route}/lessons/${file.replace(/\.mdx$/, '')}` }
          }),
        },
      ]
    }
    const found = page(root, directory, name)
    if (found === null) return []
    return [name === 'index' ? { label: 'Overview', slug: route } : { label: found.title, slug: `${route}/${name}` }]
  })

/** One collapsed group per guide folder, labelled with the guide's title. */
export const guideGroups = (root: string): GuideSidebarItem[] =>
  readdirSync(join(root, GUIDES_DIRECTORY), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const directory = `${GUIDES_DIRECTORY}/${name}`
      const index = page(root, directory, 'index')
      if (index === null) throw new Error(`${directory} has no index.mdx.`)
      return { label: index.title, collapsed: true, items: guideItems(root, directory, `guides/${name}`) }
    })
