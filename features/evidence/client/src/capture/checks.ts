import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import { SubmitFailed, waitForInteraction, type CaptureDriver } from './driver.ts'
import { CaptureEvent } from './interaction.ts'

export type CaptureCheck = {
  readonly name: string
  readonly status: 'PASS' | 'FAIL'
  readonly detail: string
}

const check = (
  name: string,
  ok: boolean,
  detail: string,
): CaptureCheck => ({
  name,
  status: ok ? 'PASS' : 'FAIL',
  detail,
})

export const CAPTURE_CHECK_NAMES = [
  'starts idle',
  'capture to preview',
  'retake',
  'cancel',
  'confirm reaches idle',
  'submitting is observable',
  'submit failure returns to preview',
] as const

export const runCaptureChecks = (
  driver: CaptureDriver,
): Effect.Effect<ReadonlyArray<CaptureCheck>, unknown> =>
  Effect.gen(function* () {
    const checks: CaptureCheck[] = []
    const session = yield* driver.start({ submit: () => Effect.void })
    checks.push(
      check(
        'starts idle',
        session.snapshot().phase === 'idle' &&
          session.snapshot().previewHash === null,
        JSON.stringify(session.snapshot()),
      ),
    )

    session.send(CaptureEvent.start)
    session.send(CaptureEvent.preview('blob:local'))
    const previewed = yield* waitForInteraction(
      session,
      (snapshot) =>
        snapshot.phase === 'previewing' && snapshot.previewHash === 'blob:local',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check('capture to preview', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'capture to preview',
            snapshot.phase === 'previewing',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(previewed)

    session.send(CaptureEvent.retake)
    const retaken = yield* waitForInteraction(
      session,
      (snapshot) => snapshot.phase === 'capturing',
    ).pipe(
      Effect.match({
        onFailure: (error) => check('retake', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'retake',
            snapshot.previewHash === null,
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(retaken)

    session.send(CaptureEvent.preview('blob:local'))
    yield* waitForInteraction(
      session,
      (snapshot) => snapshot.phase === 'previewing',
    ).pipe(Effect.ignore)
    session.send(CaptureEvent.cancel)
    const cancelled = yield* waitForInteraction(
      session,
      (snapshot) => snapshot.phase === 'idle',
    ).pipe(
      Effect.match({
        onFailure: (error) => check('cancel', false, String(error)),
        onSuccess: (snapshot) =>
          check('cancel', snapshot.phase === 'idle', JSON.stringify(snapshot)),
      }),
    )
    checks.push(cancelled)

    session.send(CaptureEvent.start)
    session.send(CaptureEvent.preview('blob:local'))
    session.send(CaptureEvent.confirm)
    const confirmed = yield* waitForInteraction(
      session,
      (snapshot) => snapshot.phase === 'idle',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check(
            'confirm reaches idle',
            false,
            String(error),
          ),
        onSuccess: (snapshot) =>
          check(
            'confirm reaches idle',
            snapshot.phase === 'idle' && snapshot.previewHash === null,
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(confirmed)

    const latch = yield* Deferred.make<void>()
    const pending = yield* driver.start({
      submit: () => Deferred.await(latch),
    })
    pending.send(CaptureEvent.start)
    pending.send(CaptureEvent.preview('blob:hold'))
    pending.send(CaptureEvent.confirm)
    const submitting = yield* waitForInteraction(
      pending,
      (snapshot) => snapshot.phase === 'submitting',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check('submitting is observable', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'submitting is observable',
            snapshot.previewHash === 'blob:hold',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(submitting)
    yield* Deferred.succeed(latch, undefined)
    yield* waitForInteraction(
      pending,
      (snapshot) => snapshot.phase === 'idle',
    ).pipe(Effect.ignore)

    const failing = yield* driver.start({
      submit: () => Effect.fail(new SubmitFailed({ message: 'rejected' })),
    })
    failing.send(CaptureEvent.start)
    failing.send(CaptureEvent.preview('blob:fail'))
    failing.send(CaptureEvent.confirm)
    const bounced = yield* waitForInteraction(
      failing,
      (snapshot) => snapshot.phase === 'previewing',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check(
            'submit failure returns to preview',
            false,
            String(error),
          ),
        onSuccess: (snapshot) =>
          check(
            'submit failure returns to preview',
            snapshot.previewHash === 'blob:fail',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(bounced)
    return checks
  })

export const allPassed = (checks: ReadonlyArray<CaptureCheck>): boolean =>
  checks.every((entry) => entry.status === 'PASS')
