import { describe, expect, it } from '@effect/vitest'
import { Attr, CHANGESET_TTL_MS, isSystemAttr } from './vocabulary.ts'
import { engineCatalog, evidenceCatalog, indexCatalog } from './catalog.ts'

describe('P05 vocabulary', () => {
  it('pins changeset control and evidence exemplar names', () => {
    expect(Attr.changesetCommit).toBe('viviefs/changeset/commit')
    expect(Attr.changesetAbort).toBe('viviefs/changeset/abort')
    expect(Attr.conflict).toBe('viviefs/conflict')
    expect(Attr.list).toBe('evidence/list')
    expect(Attr.itemTitle).toBe('evidence/item/title')
    expect(Attr.itemSeal).toBe('evidence/item/seal')
    expect(Attr.evidenceFile).toBe('evidence/file')
    expect(CHANGESET_TTL_MS).toBe(86_400_000)
  })

  it('treats only control attributes as system', () => {
    expect(isSystemAttr(Attr.changesetCommit)).toBe(true)
    expect(isSystemAttr(Attr.itemTitle)).toBe(false)
  })

  it('declares one defining attribute and a policy per catalog attribute', () => {
    const { byAttr, byDefining } = indexCatalog(evidenceCatalog)
    expect(byDefining.size).toBe(3)
    expect(byAttr.get(Attr.itemSeal)?.spec.policy).toBe('write-once')
    expect(byAttr.get(Attr.evidenceFile)?.spec.policy).toBe('human-conflict')
    expect(byAttr.get(Attr.listTitle)?.spec.policy).toBe('lww')
    expect(byAttr.get(Attr.captured)?.type.userContent).toBe(true)
  })
})

describe('P06 engine vocabulary', () => {
  it('pins journal attribute names', () => {
    expect(Attr.workflowStarted).toBe('viviefs/workflow/started')
    expect(Attr.workflowResult).toBe('viviefs/workflow/result')
    expect(Attr.activityExit).toBe('viviefs/activity/exit')
    expect(Attr.deferredExit).toBe('viviefs/deferred/exit')
    expect(Attr.clockWakeAt).toBe('viviefs/clock/wake-at')
    expect(Attr.leaseHolder).toBe('viviefs/lease/holder')
    expect(isSystemAttr(Attr.activityExit)).toBe(true)
  })

  it('declares write-once journal facts and LWW lease holder', () => {
    const { byAttr, byDefining } = indexCatalog(engineCatalog)
    expect(byDefining.size).toBe(4)
    expect(byAttr.get(Attr.workflowStarted)?.spec.policy).toBe('write-once')
    expect(byAttr.get(Attr.activityExit)?.spec.policy).toBe('write-once')
    expect(byAttr.get(Attr.leaseHolder)?.spec.policy).toBe('lww')
    expect(byAttr.get(Attr.clockWakeAt)?.type.composition).toBe('prefix')
  })
})
