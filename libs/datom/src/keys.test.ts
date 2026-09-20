import { describe, expect, it } from '@effect/vitest'
import { keysFor, keysOverlap } from './keys.ts'
import { listId } from './ids.ts'
import { Attr } from './vocabulary.ts'

describe('reactivity keys', () => {
  it('invalidates entity prefixes and attributes, not an unrelated prefix', () => {
    const list = listId('acme', '1')
    const keys = keysFor([list], [Attr.listTitle])
    expect(keys).toContain(`prefix:${list}`)
    expect(keys).toContain('prefix:Oacme/')
    expect(keys).toContain(`attribute:${Attr.listTitle}`)
    expect(
      keysOverlap(keys, keysFor([listId('other', '9')], [Attr.itemSeal])),
    ).toBe(false)
    expect(keysOverlap(keys, keysFor([list], [Attr.itemSeal]))).toBe(true)
  })
})
