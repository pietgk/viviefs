import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type { CaptureEvent, CaptureInteraction } from './interaction.ts'

export class SubmitFailed extends Schema.TaggedError<SubmitFailed>()(
  'SubmitFailed',
  { message: Schema.String },
) {}

export type CaptureDeps = {
  readonly submit: (hash: string) => Effect.Effect<void, SubmitFailed>
}

export type CaptureSession = {
  readonly snapshot: () => CaptureInteraction
  readonly send: (event: CaptureEvent) => void
  readonly subscribe: (listener: () => void) => () => void
}

export type CaptureDriverName = 'xstate' | 'effect-machine' | 'atom' | 'broken'

export type CaptureDriver = {
  readonly name: CaptureDriverName
  readonly start: (deps: CaptureDeps) => Effect.Effect<CaptureSession, unknown>
}

export class WaitTimeout extends Schema.TaggedError<WaitTimeout>()(
  'WaitTimeout',
  { phase: Schema.String },
) {}

export const waitForInteraction = (
  session: CaptureSession,
  predicate: (snapshot: CaptureInteraction) => boolean,
): Effect.Effect<CaptureInteraction, WaitTimeout> =>
  Effect.callback<CaptureInteraction, WaitTimeout>((resume) => {
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
