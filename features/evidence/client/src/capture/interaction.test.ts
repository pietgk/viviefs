import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { brokenDriver } from './broken.ts'
import { allPassed, runCaptureChecks } from './checks.ts'
import type { CaptureCheck } from './checks.ts'
import type { CaptureDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { xstateDriver } from './xstate.ts'

const passingDrivers: ReadonlyArray<CaptureDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

describe('capture interaction contract', () => {
  for (const driver of passingDrivers) {
    it(`${driver.name} implements the capture contract`, async () => {
      const checks = await Effect.runPromise(runCaptureChecks(driver))
      expect(checks.map((entry: CaptureCheck) => entry.name)).toEqual([
        'starts idle',
        'capture to preview',
        'retake',
        'cancel',
        'confirm reaches idle',
        'submitting is observable',
        'submit failure returns to preview',
      ])
      expect(allPassed(checks)).toBe(true)
    })
  }

  it('broken variant fails confirm, so the harness can fail', async () => {
    const checks = await Effect.runPromise(runCaptureChecks(brokenDriver))
    const confirm = checks.find(
      (entry: CaptureCheck) => entry.name === 'confirm reaches idle',
    )
    expect(confirm?.status).toBe('FAIL')
    expect(allPassed(checks)).toBe(false)
  })
})
