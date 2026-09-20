import { describe, expect, it } from '@effect/vitest'
import {
  ancestorPrefixes,
  evidenceId,
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
})
