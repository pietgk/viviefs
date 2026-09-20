import { describe, expect, it } from '@effect/vitest'
import {
  activityId,
  ancestorPrefixes,
  clockId,
  decodeIdSegment,
  deferredId,
  encodeIdSegment,
  evidenceId,
  executionId,
  itemId,
  listId,
  orgId,
  parentId,
  underPrefix,
} from './ids.ts'

describe('strict-composition ids', () => {
  it('encodes org, list, item and evidence with / separators', () => {
    expect(orgId('acme')).toBe('Oacme')
    expect(listId('acme', '1')).toBe('Oacme/L1')
    expect(itemId('acme', '1', '2')).toBe('Oacme/L1/I2')
    expect(evidenceId('acme', '9')).toBe('Oacme/E9')
  })

  it('walks parents and prefixes without treating L1 as a prefix of L10', () => {
    expect(parentId('Oacme/L1/I2')).toBe('Oacme/L1')
    expect(parentId('Oacme/L1')).toBe('Oacme')
    expect(parentId('Oacme')).toBeNull()
    expect(ancestorPrefixes('Oacme/L1')).toContain('Oacme/L1/')
    expect(underPrefix('Oacme/L1/I2', 'Oacme/L1')).toBe(true)
    expect(underPrefix('Oacme/L10', 'Oacme/L1')).toBe(false)
  })

  it('encodes execution journal children with escaped activity names', () => {
    expect(executionId('p06', 'abc')).toBe('Op06/Wabc')
    expect(activityId('p06', 'abc', 'DurableClock/wait', 1)).toBe(
      'Op06/Wabc/ADurableClock~wait#1',
    )
    expect(deferredId('p06', 'abc', 'approval')).toBe('Op06/Wabc/Dapproval')
    expect(clockId('p06', 'abc', 'wait')).toBe('Op06/Wabc/Cwait')
    expect(encodeIdSegment('a/b~c')).toBe('a~b~~c')
    expect(decodeIdSegment(encodeIdSegment('a/b~c'))).toBe('a/b~c')
    expect(underPrefix(activityId('p06', 'abc', 'one', 1), executionId('p06', 'abc'))).toBe(
      true,
    )
  })
})
