import { describe, expect, it } from '@effect/vitest'
import { Attr } from '@viviefs/datom'
import { P06_CHECK_COUNT, P06_CHECK_NAMES, P06_DATOM_CHECK_COUNT } from '@viviefs/testing'

describe('P06 engine crash matrix picks', () => {
  it('pins journal attribute names', () => {
    expect(Attr.workflowStarted).toBe('viviefs/workflow/started')
    expect(Attr.activityExit).toBe('viviefs/activity/exit')
    expect(Attr.deferredExit).toBe('viviefs/deferred/exit')
    expect(Attr.clockWakeAt).toBe('viviefs/clock/wake-at')
    expect(Attr.leaseHolder).toBe('viviefs/lease/holder')
  })

  it('names seven kill boundaries plus the memory durability positive control', () => {
    expect(P06_DATOM_CHECK_COUNT).toBe(7)
    expect(P06_CHECK_COUNT).toBe(8)
    expect(P06_CHECK_NAMES).toContain('kill before activity')
    expect(P06_CHECK_NAMES).toContain('kill after activity before journal')
    expect(P06_CHECK_NAMES).toContain('kill during lease handoff')
    expect(P06_CHECK_NAMES).toContain('kill during upload')
    expect(P06_CHECK_NAMES).toContain('memory engine fails durability')
  })
})
