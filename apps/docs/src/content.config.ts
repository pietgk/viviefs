// Astro entry file, checked by the site build, not by tsc (see astro.config.ts).
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro/content/config'
import { z } from 'astro/zod'
import { repoDocsLoader } from './lib/repo-docs-loader.ts'

/**
 * Guide and lesson frontmatter (D63, D81), typed for the components that
 * render it. Which keys a guide must have comes from the guide template,
 * checked by verify's `guides` step; here every key is optional.
 */
const guideFields = z.object({
  pattern: z.string().optional(),
  adrs: z.array(z.string()).optional(),
  gates: z.array(z.string()).optional(),
  exemplar: z.array(z.string()).optional(),
  exercises: z.string().optional(),
  status: z.enum(['draft', 'in review', 'accepted']).optional(),
  accepted: z.string().optional(),
  lesson: z.number().int().optional(),
  evidence: z.array(z.string()).optional(),
  source: z.object({ title: z.string(), href: z.string().url() }).optional(),
})

export const collections = {
  docs: defineCollection({ loader: repoDocsLoader(), schema: docsSchema({ extend: guideFields }) }),
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
