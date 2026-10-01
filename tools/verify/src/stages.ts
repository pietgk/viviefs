import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DOCS_ONLY_PATHS, DOCS_ONLY_STEPS } from './docs-only.ts'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export type Invocation = {
  command: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
  tolerateOffline?: boolean
}

export type Step = {
  name: string
  blurb: string
  invocations: Invocation[]
  artifact?: string
}

export type Stage = { name: string; blurb: string; steps: Step[] }

const nxScope = process.env.CI
  ? ['run-many', '--all']
  : ['affected']

const nxTarget = (target: string): Invocation => ({
  command: 'pnpm',
  args: ['exec', 'nx', ...nxScope, '-t', target],
})

/**
 * One Vitest run from the workspace root per coverage producer (D77), over the
 * projects that declare its target; see `producers.ts`.
 */
const coverageProducer = (producer: 'unit' | 'integration' | 'storybook'): Invocation => ({
  command: 'pnpm',
  args: ['exec', 'vitest', 'run', '--config', 'tools/verify/vitest.producer.config.ts'],
  env: { VIVIEFS_COVERAGE_PRODUCER: producer },
})

/**
 * The five stages of `verify`, in the order a failure invalidates what follows.
 *
 * Fail fast BETWEEN stages; collect every failure WITHIN a stage.
 * Stage names are an elaboration of D48', not a grilling decision.
 */
export const STAGES: Stage[] = [
  {
    name: 'static',
    blurb: 'nothing executes',
    steps: [
      {
        name: 'sync',
        blurb: 'TypeScript project references match the project graph',
        invocations: [
          {
            command: 'pnpm',
            args: ['exec', 'nx', 'sync:check'],
          },
        ],
      },
      {
        name: 'typecheck',
        blurb: 'every tsconfig project',
        invocations: [nxTarget('typecheck')],
      },
      {
        name: 'lint',
        blurb: 'boundaries, determinism rules, and eslint over every project',
        invocations: [nxTarget('lint')],
      },
      {
        name: 'lint-scope',
        blurb: 'every tracked source file is actually covered by an eslint config',
        invocations: [
          {
            command: 'node',
            args: [
              '--experimental-strip-types',
              'tools/verify/src/check-lint-scope.ts',
            ],
          },
        ],
      },
      {
        name: 'ownership',
        blurb: 'every project is tagged; every production file has one file treatment',
        invocations: [
          {
            command: 'node',
            args: [
              '--experimental-strip-types',
              'tools/verify/src/check-ownership.ts',
            ],
          },
        ],
      },
      {
        name: 'skills',
        blurb: 'vendored skills match skills-lock.json and load in every agent',
        invocations: [
          {
            command: 'node',
            args: [
              '--experimental-strip-types',
              'tools/verify/src/check-skills.ts',
            ],
          },
        ],
      },
      {
        name: 'audit',
        blurb: 'high and critical advisories',
        invocations: [
          {
            command: 'pnpm',
            args: ['audit', '--audit-level=high'],
            tolerateOffline: true,
          },
        ],
      },
    ],
  },
  {
    name: 'unit',
    blurb: 'code executes in Node (Vitest + @effect/vitest)',
    steps: [
      {
        name: 'unit',
        blurb: 'unit tests of every project with a test target, with coverage',
        invocations: [coverageProducer('unit')],
      },
    ],
  },
  {
    name: 'integration',
    blurb: 'suites and tests that need a real store or server',
    steps: [
      {
        name: 'integration',
        blurb: 'log-store, changesets, engine and projection suites on sqlite-node and PGlite, with coverage',
        invocations: [coverageProducer('integration')],
      },
    ],
  },
  {
    name: 'ui',
    blurb: 'Storybook play + a11y, Playwright web smoke',
    steps: [
      {
        name: 'storybook',
        blurb: 'component stories, jsdom until P12 (P08 capture screen), with coverage',
        invocations: [coverageProducer('storybook')],
      },
      {
        name: 'e2e-web',
        blurb: 'Playwright web smoke (none until the exemplar serves)',
        invocations: [nxTarget('e2e-web')],
      },
    ],
  },
  {
    name: 'quality',
    blurb: 'production builds are measured and the docs site is built',
    steps: [
      {
        name: 'build',
        blurb: 'production builds on projects that declare a build target',
        invocations: [nxTarget('build')],
      },
      {
        name: 'bundle-size',
        blurb: 'gated JS bundle size, compared with the reference verify baseline recorded',
        invocations: [nxTarget('bundle-size')],
      },
      {
        name: 'docs',
        blurb: 'docs site build: repository pages, samples, links and anchors',
        invocations: [
          {
            command: 'pnpm',
            args: ['exec', 'nx', 'run', 'docs:build'],
          },
        ],
      },
      {
        name: 'diagrams',
        blurb: 'every Mermaid edge in Markdown and MDX survives rendering',
        invocations: [
          {
            command: 'node',
            args: [
              '--experimental-strip-types',
              'tools/verify/src/check-diagrams.ts',
            ],
          },
        ],
      },
      {
        name: 'evidence',
        blurb: 'coverage, suites and stories of this run hold against the registry and the lockfile',
        invocations: [
          {
            command: 'node',
            args: [
              '--experimental-strip-types',
              'tools/verify/src/check-evidence.ts',
            ],
          },
        ],
      },
    ],
  },
]

export const findStage = (name: string) =>
  STAGES.find((stage) => stage.name === name)

export const findStep = (name: string) =>
  STAGES.flatMap((stage) => stage.steps).find((step) => step.name === name)

export type SelectedStages =
  | { readonly _tag: 'All' | 'Some'; readonly stages: Stage[] }
  | { readonly _tag: 'Unknown'; readonly selector: string }

export const selectStages = (selectors: ReadonlyArray<string>): SelectedStages => {
  if (selectors.length === 0 || selectors.includes('all')) {
    return { _tag: 'All', stages: STAGES }
  }
  const wanted = new Set<string>()
  for (const selector of selectors) {
    const stage = findStage(selector)
    if (stage) {
      for (const step of stage.steps) wanted.add(step.name)
      continue
    }
    const step = findStep(selector)
    if (!step) return { _tag: 'Unknown', selector }
    wanted.add(step.name)
  }
  return {
    _tag: 'Some',
    stages: STAGES.map((stage) => ({
      ...stage,
      steps: stage.steps.filter((step) => wanted.has(step.name)),
    })).filter((stage) => stage.steps.length > 0),
  }
}

export const formatHelp = (invoke = 'pnpm verify'): string => {
  const nameWidth =
    Math.max(
      ...STAGES.flatMap(({ name, steps }) => [
        name.length,
        ...steps.map(({ name: stepName }) => stepName.length),
      ]),
    ) + 1
  const lines = [
    '',
    `  ${invoke} [stage|step ...]`,
    '',
    '  Runs every stage in order. A stage that fails stops the ones after it,',
    '  because their results would no longer mean anything. Within a stage,',
    '  every step runs so you get the whole list at once.',
    '',
  ]
  for (const stage of STAGES) {
    lines.push(`  ${stage.name.padEnd(nameWidth)}${stage.blurb}`)
    for (const step of stage.steps) {
      lines.push(`    ${step.name.padEnd(nameWidth)}${step.blurb}`)
    }
    lines.push('')
  }
  lines.push(`  ${invoke} help              this text, generated from the stage table`)
  lines.push(`  ${invoke} static            one stage`)
  lines.push(`  ${invoke} lint unit         any mix of stages and steps`)
  lines.push(`  ${invoke} all               every stage, even for a docs-only change`)
  lines.push(`  ${invoke} baseline          records the evidence lockfile; never part of done`)
  lines.push('')
  lines.push(`  Docs-only rule: without a selector, a change that touches only`)
  lines.push(`  ${DOCS_ONLY_PATHS.map(({ label }) => label).join(', ')}`)
  lines.push(`  runs ${DOCS_ONLY_STEPS.join(' and ')}. CI always runs every stage.`)
  lines.push('')
  return lines.join('\n')
}
