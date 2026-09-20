import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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
        blurb: 'every project.json declares tags and an evidence owner',
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
        blurb: 'unit tests on projects that declare a test target',
        invocations: [nxTarget('test')],
      },
    ],
  },
  {
    name: 'integration',
    blurb: 'conformance suites and crash matrix',
    steps: [
      {
        name: 'integration',
        blurb: 'integration tests (none until P04/P06)',
        invocations: [nxTarget('test-integration')],
      },
    ],
  },
  {
    name: 'ui',
    blurb: 'Storybook play + a11y, Playwright web smoke',
    steps: [
      {
        name: 'storybook',
        blurb: 'web and shared component stories (none until P08)',
        invocations: [nxTarget('test-storybook')],
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
    blurb: 'a production bundle is measured',
    steps: [
      {
        name: 'build',
        blurb: 'production builds on projects that declare a build target',
        invocations: [nxTarget('build')],
      },
      {
        name: 'bundle-size',
        blurb: 'gated JS bundle size (baseline recorded at P01)',
        invocations: [nxTarget('bundle-size')],
      },
    ],
  },
]

export const findStage = (name: string) =>
  STAGES.find((stage) => stage.name === name)

export const findStep = (name: string) =>
  STAGES.flatMap((stage) => stage.steps).find((step) => step.name === name)

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
  lines.push('')
  return lines.join('\n')
}
