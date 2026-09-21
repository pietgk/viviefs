import { describe, expect, it } from '@effect/vitest'
import {
  brokenDriver,
  CAPTURE_CHECK_NAMES,
  passingDrivers,
} from '@viviefs/evidence-client'

describe('P08 UI three-way prototype picks', () => {
  it('compares the three named interaction libraries', () => {
    expect(passingDrivers.map((driver) => driver.name)).toEqual([
      'xstate',
      'effect-machine',
      'atom',
    ])
  })

  it('keeps a broken variant so the shared tests can fail', () => {
    expect(brokenDriver.name).toBe('broken')
    expect(CAPTURE_CHECK_NAMES).toContain('confirm reaches idle')
  })
})
