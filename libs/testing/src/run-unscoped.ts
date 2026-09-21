import * as Effect from 'effect/Effect'

/**
 * Run an Effect on a fresh runtime so it does not inherit the test `Scope`.
 *
 * `it.live` / `it.effect` wrap the body in `Effect.scoped`. The workflow
 * engine's `yield* Effect.scope` then captures that long-lived test scope,
 * leaks PGlite connections across crash-matrix sessions, and busy-loops.
 */
export const runUnscoped = <A, E>(
  effect: Effect.Effect<A, E>,
): Effect.Effect<A, E> =>
  Effect.callback((resume) => {
    void Effect.runPromiseExit(effect).then(resume)
  })
