/**
 * `@viviefs/testing/vitest`: the one shape of a project's Vitest config (D80).
 * The file name decides which coverage producer runs a test: `*.integration.test.ts`
 * runs in `integration`, `*.stories.test.tsx` in `storybook`, any other
 * `*.test.ts(x)` in `unit`. Every config defines the suite tags, so a test
 * tagged with a suite the catalogue does not declare fails.
 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type ViteUserConfig } from 'vitest/config'
import { suiteTags } from './suites.ts'

export const COVERAGE_PRODUCERS = ['unit', 'integration', 'storybook'] as const

export type CoverageProducer = (typeof COVERAGE_PRODUCERS)[number]

const INTEGRATION = 'src/**/*.integration.test.ts'
const STORIES = 'src/**/*.stories.test.tsx'

export const TEST_FILES: Readonly<
  Record<CoverageProducer, { include: string[]; exclude: string[] }>
> = {
  unit: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [INTEGRATION, STORIES],
  },
  integration: { include: [INTEGRATION], exclude: [] },
  storybook: { include: [STORIES], exclude: [] },
}

/** The config file each producer reads in a project directory. */
export const CONFIG_FILES: Readonly<Record<CoverageProducer, string>> = {
  unit: 'vitest.config.ts',
  integration: 'vitest.integration.config.ts',
  storybook: 'vitest.storybook.config.ts',
}

export const projectTestConfig = (
  configUrl: string,
  producer: CoverageProducer,
  environment: 'node' | 'jsdom' = 'node',
): ViteUserConfig =>
  defineConfig({
    root: dirname(fileURLToPath(configUrl)),
    test: {
      include: TEST_FILES[producer].include,
      exclude: ['**/node_modules/**', ...TEST_FILES[producer].exclude],
      environment,
      tags: suiteTags,
    },
  })
