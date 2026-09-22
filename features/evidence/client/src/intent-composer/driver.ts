import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type { ComposerEvent, ComposerSnapshot } from './interaction.ts'

export class SubmitFailed extends Schema.TaggedError<SubmitFailed>()(
  'SubmitFailed',
  { message: Schema.String },
) {}

export type ComposerDeps = {
  readonly submit: (hash: string) => Effect.Effect<void, SubmitFailed>
}

export type ComposerSession = {
  readonly snapshot: () => ComposerSnapshot
  readonly send: (event: ComposerEvent) => void
  readonly subscribe: (listener: () => void) => () => void
}

export type ComposerDriverName = 'xstate' | 'effect-machine' | 'atom' | 'broken'

export type ComposerDriver = {
  readonly name: ComposerDriverName
  readonly start: (deps: ComposerDeps) => Effect.Effect<ComposerSession, unknown>
}

export class WaitTimeout extends Schema.TaggedError<WaitTimeout>()(
  'WaitTimeout',
  { phase: Schema.String },
) {}

export const waitForComposer = (
  session: ComposerSession,
  predicate: (snapshot: ComposerSnapshot) => boolean,
): Effect.Effect<ComposerSnapshot, WaitTimeout> =>
  Effect.callback<ComposerSnapshot, WaitTimeout>((resume) => {
    if (predicate(session.snapshot())) {
      resume(Effect.succeed(session.snapshot()))
      return
    }
    const timer = setTimeout(() => {
      off()
      resume(Effect.fail(new WaitTimeout({ phase: session.snapshot().phase })))
    }, 500)
    const off = session.subscribe(() => {
      if (predicate(session.snapshot())) {
        clearTimeout(timer)
        off()
        resume(Effect.succeed(session.snapshot()))
      }
    })
    return Effect.sync(() => {
      clearTimeout(timer)
      off()
    })
  })
