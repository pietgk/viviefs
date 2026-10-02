import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { exercise, exerciseMode, judgeProblem, LEARNER_VARIABLE } from './exercise.ts'

describe('an exercise', () => {
  it('runs both folders in verify, and only problem/ for a learner', () => {
    expect(exerciseMode({})).toBe('verify')
    expect(exerciseMode({ [LEARNER_VARIABLE]: 'problem' })).toBe('learner')
  })

  it('refuses a problem that already passes', () => {
    expect(judgeProblem(Exit.void, /missing/)).toMatch(/already passes/)
  })

  it('refuses a problem that fails for another reason', () => {
    const exit = Exit.die(new Error('the database is locked'))
    expect(judgeProblem(exit, /not above the last/)).toMatch(/but not with/)
  })

  it('accepts a problem that fails with the expected assertion', () => {
    const exit = Exit.die(new Error('same millisecond: (pt, c) not above the last'))
    expect(judgeProblem(exit, /not above the last/)).toBeUndefined()
  })

  describe('registered for verify', () => {
    exercise(
      {
        id: '00.01',
        problem: 1,
        solution: 2,
        check: (value) =>
          Effect.sync(() => {
            expect(value, 'value must be two').toBe(2)
          }),
        failsWith: /value must be two/,
      },
      'verify',
    )
  })
})
