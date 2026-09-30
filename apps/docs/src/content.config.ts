// Astro entry file, checked by the site build, not by tsc (see astro.config.ts).
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro/content/config'
import { repoDocsLoader } from './lib/repo-docs-loader.ts'

export const collections = {
  docs: defineCollection({ loader: repoDocsLoader(), schema: docsSchema() }),
  // Starlight's default English UI strings, declared as one empty entry:
  // Starlight reads this collection on every page, and Astro warns on every
  // build when it is missing.
  i18n: defineCollection({
    loader: {
      name: 'viviefs-ui-strings',
      load: async ({ store, parseData }) => {
        store.set({ id: 'en', data: await parseData({ id: 'en', data: {} }) })
      },
    },
    schema: i18nSchema(),
  }),
}
