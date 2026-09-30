/**
 * Rewrites relative file links in Markdown and MDX to site or GitHub URLs,
 * and fails the build on a link to a file that does not exist.
 *
 * Repository Markdown links files the way GitHub resolves them. The site
 * renders some of those files in place (see `repo.ts`), so the same link
 * must point at the page there. A broken file link fails here; broken site
 * paths and anchors fail in `starlight-links-validator`.
 */
import { fileURLToPath } from 'node:url'
import type { MdastPluginEntry } from 'satteri'
import { resolveLink } from './repo.ts'

/** The rewritten URL of a link in `sourceFile`, or null to leave it alone. */
export const rewriteLink = (
  repositoryRoot: string,
  sourceFile: string,
  url: string,
): string | null => {
  const target = resolveLink(repositoryRoot, sourceFile, url)
  switch (target._tag) {
    case 'Untouched':
      return null
    case 'Rewritten':
      return target.href
    case 'Missing':
      throw new Error(
        `${sourceFile}: link "${url}" points at ${target.repositoryPath}, which does not exist.`,
      )
    case 'OutsideRepository':
      throw new Error(
        `${sourceFile}: link "${url}" leaves the repository (${target.path}).`,
      )
  }
}

/** The same rewrite for the `href` attributes of an HTML research record. */
export const rewriteHtmlLinks = (
  repositoryRoot: string,
  sourceFile: string,
  html: string,
): string =>
  html.replace(/\bhref="([^"]*)"/g, (attribute, url: string) => {
    const href = rewriteLink(repositoryRoot, sourceFile, url)
    return href === null ? attribute : `href="${href}"`
  })

export const repoLinks = (repositoryRoot: string): MdastPluginEntry => {
  return ({ fileURL }) => {
    if (!fileURL) return null
    const sourceFile = fileURLToPath(fileURL)
    const rewrite = (url: string) => rewriteLink(repositoryRoot, sourceFile, url)
    return {
      name: 'viviefs-repo-links',
      link(node, context) {
        const href = rewrite(node.url)
        if (href !== null) context.setProperty(node, 'url', href)
      },
      definition(node, context) {
        const href = rewrite(node.url)
        if (href !== null) context.setProperty(node, 'url', href)
      },
    }
  }
}
