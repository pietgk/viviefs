/**
 * The coverage producers' Vitest config (D77). `verify` runs it once per
 * producer with `VIVIEFS_COVERAGE_PRODUCER` set; see `src/producers.ts`.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import { COVERAGE_PRODUCERS, CONFIG_FILES, type CoverageProducer } from '@viviefs/testing/vitest'
import {
  artifactsOf,
  ownedFiles,
  producerProjects,
  reportFileOf,
  runFileOf,
} from './src/producers.ts'
import { ROOT } from './src/stages.ts'

const requested = process.env.VIVIEFS_COVERAGE_PRODUCER
if (!(COVERAGE_PRODUCERS as ReadonlyArray<string>).includes(requested ?? '')) {
  throw new Error(`Set VIVIEFS_COVERAGE_PRODUCER to one of ${COVERAGE_PRODUCERS.join(', ')}.`)
}
const producer = requested as CoverageProducer

mkdirSync(artifactsOf(producer), { recursive: true })
writeFileSync(
  runFileOf(producer),
  `${JSON.stringify({ producer, run: process.env.VIVIEFS_VERIFY_RUN ?? null }, null, 2)}\n`,
)

export default defineConfig({
  root: ROOT,
  test: {
    projects: producerProjects(producer).map((dir) => `${dir}/${CONFIG_FILES[producer]}`),
    reporters: ['default', ['json', { outputFile: reportFileOf(producer) }]],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: [...ownedFiles(producer)],
      exclude: [],
      reporter: [['json', { file: 'coverage-final.json' }]],
      reportsDirectory: `${artifactsOf(producer)}/coverage`,
      clean: true,
    },
  },
})
