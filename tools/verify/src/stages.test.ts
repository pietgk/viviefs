import { Effect } from 'effect'
import { expect, it } from '@effect/vitest'
import { STAGES, findStage, findStep, formatHelp } from './stages.ts'

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
  expect(findStep('ownership')?.blurb).toMatch(/evidence owner/)
  expect(findStage('not-a-stage')).toBeUndefined()
  expect(findStep('not-a-step')).toBeUndefined()
})

it.effect('wires @effect/vitest as the unit runner', () =>
  Effect.gen(function* () {
    const value = yield* Effect.succeed(2)
    expect(value).toBe(2)
  }),
)
