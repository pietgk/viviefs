import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import { runsSuite } from '@viviefs/testing'
import { atomDriver } from './atom.ts'
import { brokenDriver } from './broken.ts'
import { allPassed, runComposerChecks } from './checks.ts'
import type { ComposerCheck } from './checks.ts'
import { waitForComposer, type ComposerDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { ComposerEvent } from './interaction.ts'
import { xstateDriver } from './xstate.ts'

const passingDrivers: ReadonlyArray<ComposerDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

describe('intent composer contract', runsSuite('interaction-state/intent-composer'), () => {
  for (const driver of passingDrivers) {
    it.live(`${driver.name} waits through composing for the requested review`, () =>
      Effect.gen(function* () {
        const session = yield* driver.start({ submit: () => Effect.void })
        const waiting = yield* Effect.forkChild(
          waitForComposer(session, (snapshot) => snapshot.phase === 'reviewing'),
          { startImmediately: true },
        )

        session.send(ComposerEvent.start)
        yield* waitForComposer(session, (snapshot) => snapshot.phase === 'composing')
        session.send(ComposerEvent.candidate('blob:review'))

        expect(yield* Fiber.join(waiting)).toEqual({
          phase: 'reviewing',
          candidateHash: 'blob:review',
        })
      }),
    )

    it(`${driver.name} implements the composer contract`, async () => {
      const checks = await Effect.runPromise(runComposerChecks(driver))
      expect(checks.map((entry: ComposerCheck) => entry.name)).toEqual([
        'starts empty',
        'compose to review',
        'retake',
        'cancel',
        'confirm reaches empty',
        'submitting is observable',
        'submit failure returns to reviewing',
      ])
      expect(allPassed(checks)).toBe(true)
    })
  }

  it('broken variant fails confirm, so the harness can fail', async () => {
    const checks = await Effect.runPromise(runComposerChecks(brokenDriver))
    const confirm = checks.find(
      (entry: ComposerCheck) => entry.name === 'confirm reaches empty',
    )
    expect(confirm?.status).toBe('FAIL')
    expect(allPassed(checks)).toBe(false)
  })
})
