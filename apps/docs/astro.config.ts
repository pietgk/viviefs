/**
 * The ViViEfs docs site (D59-D61): Starlight on Astro 7.
 *
 * Not deployed until that is decided after the first accepted guide (D61).
 *
 * This file and `src/content.config.ts` are Astro's entry files, which the
 * site build loads and validates. `tsc` does not check them: the Starlight
 * plugins ship TypeScript sources that do not compile under this repo's
 * `nodenext` and strict settings, and the collection types do not survive
 * declaration emit. The code they call, in `src/lib`, is checked.
 */
import { relative } from 'node:path'
import { satteri } from '@astrojs/markdown-satteri'
import starlight from '@astrojs/starlight'
import mermaid from 'astro-mermaid'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'
import starlightLlmsTxt from 'starlight-llms-txt'
import { repoLinks } from './src/lib/repo-links.ts'
import { sidebarItems } from './src/lib/repo-pages.ts'
import { findRepositoryRoot } from './src/lib/repo.ts'

const repositoryRoot = findRepositoryRoot()

export default defineConfig({
  // The site runs only locally (`astro preview`) until deployment is decided;
  // `llms.txt` needs an absolute URL.
  site: 'http://localhost:4321',
  markdown: {
    processor: satteri({ mdastPlugins: [repoLinks(repositoryRoot)] }),
  },
  vite: {
    server: { fs: { allow: [repositoryRoot] } },
    build: {
      // Mermaid's core chunk (about 650 kB) loads only on pages with a diagram.
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        onLog(level, log, handler) {
          // Astro marks every MDX module with this directive and handles it
          // itself; the bundler cannot know that.
          if (
            log.code === 'MODULE_LEVEL_DIRECTIVE' &&
            log.message.includes('"use astro:head-inject"')
          ) {
            return
          }
          handler(level, log)
        },
      },
    },
  },
  integrations: [
    mermaid({ theme: 'default', autoTheme: true }),
    starlight({
      title: 'ViViEfs',
      // The 404 page is src/content/docs/404.md, rendered like any page.
      disable404Route: true,
      // Repository Markdown rendered in place gets Starlight's own Markdown
      // features (heading anchors, asides), like pages in src/content/docs.
      markdown: { processedDirs: [relative(process.cwd(), repositoryRoot) || '.'] },
      description:
        'Vision - View - Effects: a reference stack for Expo apps and their backend with Effect, durable execution and one datom log.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/pietgk/viviefs',
        },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [{ label: 'How a pattern is delivered', link: '/' }],
        },
        {
          label: 'Guides',
          items: [{ label: 'Guide index', slug: 'guides' }],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Glossary', slug: 'reference/glossary' },
            {
              label: 'ADRs',
              collapsed: true,
              items: sidebarItems(repositoryRoot, 'docs/adr'),
            },
            {
              label: 'Evidence',
              collapsed: true,
              items: sidebarItems(repositoryRoot, 'docs/evidence'),
            },
          ],
        },
        {
          label: 'Research',
          collapsed: true,
          items: sidebarItems(repositoryRoot, 'docs/research'),
        },
      ],
      plugins: [
        starlightLinksValidator({ exclude: ['/research/*.html'] }),
        starlightLlmsTxt(),
      ],
    }),
  ],
})
