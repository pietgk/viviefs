import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import { SubmitFailed, waitForComposer, type ComposerDriver } from './driver.ts'
import { ComposerEvent } from './interaction.ts'

export type ComposerCheck = {
  readonly name: string
  readonly status: 'PASS' | 'FAIL'
  readonly detail: string
}

const check = (name: string, ok: boolean, detail: string): ComposerCheck => ({
  name,
  status: ok ? 'PASS' : 'FAIL',
  detail,
})

export const COMPOSER_CHECK_NAMES = [
  'starts empty',
  'compose to review',
  'retake',
  'cancel',
  'confirm reaches empty',
  'submitting is observable',
  'submit failure returns to reviewing',
] as const

export const runComposerChecks = (
  driver: ComposerDriver,
): Effect.Effect<ReadonlyArray<ComposerCheck>, unknown> =>
  Effect.gen(function* () {
    const checks: ComposerCheck[] = []
    const session = yield* driver.start({ submit: () => Effect.void })
    checks.push(
      check(
        'starts empty',
        session.snapshot().phase === 'empty' &&
          session.snapshot().candidateHash === null,
        JSON.stringify(session.snapshot()),
      ),
    )

    session.send(ComposerEvent.start)
    session.send(ComposerEvent.candidate('blob:local'))
    const reviewed = yield* waitForComposer(
      session,
      (snapshot) =>
        snapshot.phase === 'reviewing' &&
        snapshot.candidateHash === 'blob:local',
    ).pipe(
      Effect.match({
        onFailure: (error) => check('compose to review', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'compose to review',
            snapshot.phase === 'reviewing',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(reviewed)

    session.send(ComposerEvent.retake)
    const retaken = yield* waitForComposer(
      session,
      (snapshot) => snapshot.phase === 'composing',
    ).pipe(
      Effect.match({
        onFailure: (error) => check('retake', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'retake',
            snapshot.candidateHash === null,
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(retaken)

    session.send(ComposerEvent.candidate('blob:local'))
    yield* waitForComposer(
      session,
      (snapshot) => snapshot.phase === 'reviewing',
    ).pipe(Effect.ignore)
    session.send(ComposerEvent.cancel)
    const cancelled = yield* waitForComposer(
      session,
      (snapshot) => snapshot.phase === 'empty',
    ).pipe(
      Effect.match({
        onFailure: (error) => check('cancel', false, String(error)),
        onSuccess: (snapshot) =>
          check('cancel', snapshot.phase === 'empty', JSON.stringify(snapshot)),
      }),
    )
    checks.push(cancelled)

    session.send(ComposerEvent.start)
    session.send(ComposerEvent.candidate('blob:local'))
    session.send(ComposerEvent.confirm)
    const confirmed = yield* waitForComposer(
      session,
      (snapshot) => snapshot.phase === 'empty',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check('confirm reaches empty', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'confirm reaches empty',
            snapshot.phase === 'empty' && snapshot.candidateHash === null,
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(confirmed)

    const latch = yield* Deferred.make<void>()
    const pending = yield* driver.start({
      submit: () => Deferred.await(latch),
    })
    pending.send(ComposerEvent.start)
    pending.send(ComposerEvent.candidate('blob:hold'))
    pending.send(ComposerEvent.confirm)
    const submitting = yield* waitForComposer(
      pending,
      (snapshot) => snapshot.phase === 'submitting',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check('submitting is observable', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'submitting is observable',
            snapshot.candidateHash === 'blob:hold',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(submitting)
    yield* Deferred.succeed(latch, undefined)
    yield* waitForComposer(
      pending,
      (snapshot) => snapshot.phase === 'empty',
    ).pipe(Effect.ignore)

    const failing = yield* driver.start({
      submit: () => Effect.fail(new SubmitFailed({ message: 'rejected' })),
    })
    failing.send(ComposerEvent.start)
    failing.send(ComposerEvent.candidate('blob:fail'))
    failing.send(ComposerEvent.confirm)
    const bounced = yield* waitForComposer(
      failing,
      (snapshot) => snapshot.phase === 'reviewing',
    ).pipe(
      Effect.match({
        onFailure: (error) =>
          check('submit failure returns to reviewing', false, String(error)),
        onSuccess: (snapshot) =>
          check(
            'submit failure returns to reviewing',
            snapshot.candidateHash === 'blob:fail',
            JSON.stringify(snapshot),
          ),
      }),
    )
    checks.push(bounced)
    return checks
  })

export const allPassed = (checks: ReadonlyArray<ComposerCheck>): boolean =>
  checks.every((entry) => entry.status === 'PASS')
