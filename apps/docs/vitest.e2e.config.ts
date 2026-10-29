import { defineConfig } from 'vitest/config'

/**
 * The built docs site in a browser (I97): `verify`'s `docs-e2e` step runs it
 * after the `docs` step has built `dist/`. Not a coverage producer.
 */
export default defineConfig({
  test: {
    include: ['e2e/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
