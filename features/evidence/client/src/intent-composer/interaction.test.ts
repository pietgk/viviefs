import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { brokenDriver } from './broken.ts'
import { allPassed, runComposerChecks } from './checks.ts'
import type { ComposerCheck } from './checks.ts'
import type { ComposerDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { xstateDriver } from './xstate.ts'

const passingDrivers: ReadonlyArray<ComposerDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

describe('intent composer contract', () => {
  for (const driver of passingDrivers) {
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
