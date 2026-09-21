import { describe, expect, it } from '@effect/vitest'
import {
  P07_CHECK_COUNT,
  P07_DEVICE_CHECK_COUNT,
  P07_HOST_CHECK_COUNT,
  P07_PARKED_ATTR,
} from '@viviefs/testing'

describe('P07 device resume picks', () => {
  it('pins the probe parked attribute', () => {
    expect(P07_PARKED_ATTR).toBe('viviefs/probe/parked')
  })

  it('names host sweep checks and the device force-quit matrix', () => {
    expect(P07_HOST_CHECK_COUNT).toBe(2)
    expect(P07_DEVICE_CHECK_COUNT).toBe(5)
    expect(P07_CHECK_COUNT).toBe(7)
  })
})
