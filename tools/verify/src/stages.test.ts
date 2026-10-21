import { Effect, Fiber } from 'effect'
import { TestClock } from 'effect/testing'
import { expect, it } from '@effect/vitest'
import { STAGES, everyProject, findStage, findStep, formatHelp, selectStages } from './stages.ts'

it('help is generated from the executed stage table', () => {
  const help = formatHelp()
  expect(help).toContain('pnpm verify')
  for (const stage of STAGES) {
    expect(help).toContain(stage.name)
    expect(help).toContain(stage.blurb)
    for (const step of stage.steps) {
      expect(help).toContain(step.name)
      expect(help).toContain(step.blurb)
    }
  }
})

it('looks up stages and steps from the same table', () => {
  expect(findStage('static')?.steps.map((step) => step.name)).toContain(
    'lint-scope',
  )
  expect(findStep('ownership')?.blurb).toMatch(/file treatment/)
  expect(findStage('quality')?.steps.map((step) => step.name)).toContain('evidence')
  expect(findStage('not-a-stage')).toBeUndefined()
  expect(findStep('not-a-step')).toBeUndefined()
})

it('selects a mix of stages and steps from the executed table', () => {
  const selected = selectStages(['static', 'unit'])
  expect(selected._tag).toBe('Some')
  if (selected._tag !== 'Some') return
  expect(selected.stages.map((stage) => stage.name)).toEqual(['static', 'unit'])
  expect(selectStages(['not-a-stage'])).toEqual({
    _tag: 'Unknown',
    selector: 'not-a-stage',
  })
  expect(selectStages([])._tag).toBe('All')
  expect(selectStages(['all'])._tag).toBe('All')
})

it.effect('wires @effect/vitest as the unit runner', () =>
  Effect.gen(function* () {
    const value = yield* Effect.succeed(2)
    expect(value).toBe(2)
  }),
)

it.effect('advances TestClock instead of waiting on wall time', () =>
  Effect.gen(function* () {
    const fiber = yield* Effect.sleep('10 seconds').pipe(
      Effect.as('done'),
      Effect.forkChild,
    )
    yield* TestClock.adjust('10 seconds')
    expect(yield* Fiber.join(fiber)).toBe('done')
  }),
)

it('runs a step over every project for the baseline, whatever changed (I72)', () => {
  const step = {
    name: 'bundle-size',
    blurb: '',
    invocations: [
      { command: 'pnpm', args: ['exec', 'nx', 'affected', '-t', 'bundle-size'] },
      { command: 'pnpm', args: ['exec', 'nx', 'run-many', '--all', '-t', 'build'] },
      { command: 'node', args: ['affected'] },
    ],
  }
  expect(everyProject(step).invocations.map(({ args }) => args)).toEqual([
    ['exec', 'nx', 'run-many', '--all', '-t', 'bundle-size'],
    ['exec', 'nx', 'run-many', '--all', '-t', 'build'],
    ['affected'],
  ])
  const real = findStep('bundle-size')
  expect(real && everyProject(real).invocations.every(({ args }) => !args.includes('affected'))).toBe(true)
})
