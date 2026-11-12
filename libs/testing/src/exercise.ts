/**
 * `@viviefs/testing/exercise`: one exercise of a track (D66, D81). An exercise
 * is one check run against two folders. In `verify` the solution must pass
 * and the problem must fail with the assertion the exercise expects: a
 * problem that already passes teaches nothing, so that is the positive
 * control. A learner runs `pnpm exercise <pattern> <NN.MM>`, which sets
 * `VIVIEFS_EXERCISE=problem`: then only `problem/` runs, and it must pass;
 * `VIVIEFS_EXERCISE=solution` runs only `solution/` the same way, which is
 * how a lesson records both runs (D222). A check says what it saw with
 * `note`, and the verdict prints those lines.
 */
import { expect, it } from '@effect/vitest'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { LEARNER_VARIABLE, NOTE_PREFIX } from './exercise-reporter.ts'

export { LEARNER_VARIABLE }

export type ExerciseMode = 'verify' | 'learner'

/** Which folder a learner run checks. */
export type ExerciseSide = 'problem' | 'solution'

export const exerciseSide = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): ExerciseSide | undefined => {
  const side = env[LEARNER_VARIABLE]
  return side === 'problem' || side === 'solution' ? side : undefined
}

export const exerciseMode = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): ExerciseMode => (exerciseSide(env) === undefined ? 'verify' : 'learner')

/**
 * One line of what the check saw, such as the counts an append answered. It
 * goes to the test's log, which the learner's verdict prints under "What the
 * test saw"; write it before the assertion, so a failing run shows it too.
 */
export const note = (line: string): Effect.Effect<void> => Effect.sync(() => console.log(`${NOTE_PREFIX}${line}`))

export type Exercise<M> = {
  /** `NN.MM`, as in the folder name. */
  readonly id: string
  readonly problem: M
  readonly solution: M
  /** Fails, with an assertion that says what is missing, until `impl` is right. */
  readonly check: (impl: M) => Effect.Effect<void, unknown>
  /** What the problem's failure must say. */
  readonly failsWith: RegExp
  readonly timeout?: number
}

/**
 * Why a problem's run is not the expected failure, or undefined when it is:
 * it must fail, and say what `failsWith` expects.
 */
export const judgeProblem = (
  exit: Exit.Exit<void, unknown>,
  failsWith: RegExp,
): string | undefined => {
  if (Exit.isSuccess(exit)) return 'problem/ already passes, so it teaches nothing'
  const message = Cause.pretty(exit.cause)
  return failsWith.test(message)
    ? undefined
    : `problem/ fails, but not with ${String(failsWith)}:\n${message}`
}

/** Registers the exercise's tests for the current mode. */
export const exercise = <M>(spec: Exercise<M>, mode: ExerciseMode = exerciseMode(), side: ExerciseSide = exerciseSide() ?? 'problem'): void => {
  const timeout = spec.timeout ?? 30_000
  if (mode === 'learner') {
    it.live(`${spec.id}: ${side}/ passes`, () => spec.check(side === 'solution' ? spec.solution : spec.problem), timeout)
    return
  }
  it.live(`${spec.id}: solution/ passes`, () => spec.check(spec.solution), timeout)
  it.live(
    `${spec.id}: problem/ fails with the expected assertion`,
    () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(spec.check(spec.problem))
        expect(judgeProblem(exit, spec.failsWith)).toBeUndefined()
      }),
    timeout,
  )
}
