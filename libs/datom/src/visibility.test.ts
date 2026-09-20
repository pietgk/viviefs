import { describe, expect, it } from '@effect/vitest'
import { evidenceCatalog } from './catalog.ts'
import { Attr } from './vocabulary.ts'
import { isVisible, reduceAttribute, visibleFacts, type StoredFact } from './visibility.ts'
import { itemId, listId } from './ids.ts'

const fact = (
  e: string,
  a: string,
  v: string,
  commitTx: string,
  extra: Partial<StoredFact> = {},
): StoredFact => ({
  e,
  a,
  v,
  op: 'assert',
  cs: commitTx,
  commitTx,
  memberTx: commitTx,
  commitSeq: 1,
  ...extra,
})

describe('projection visibility', () => {
  it('picks LWW by highest commit tx and write-once by the first', () => {
    const e = listId('acme', '1')
    const lww = reduceAttribute(
      [
        fact(e, Attr.listTitle, 'old', 'AAAAAAAAAAAAAAAAAAAAAAAAAA'),
        fact(e, Attr.listTitle, 'new', 'AAAAAAAAAAAAAAAAAAAAAAAAAB'),
      ],
      'lww',
    )
    expect(lww[0]?.v).toBe('new')
    const writeOnce = reduceAttribute(
      [
        fact(e, Attr.itemSeal, 'first', 'AAAAAAAAAAAAAAAAAAAAAAAAAA'),
        fact(e, Attr.itemSeal, 'second', 'AAAAAAAAAAAAAAAAAAAAAAAAAB'),
      ],
      'write-once',
    )
    expect(writeOnce[0]?.v).toBe('first')
  })

  it('hides a child when the parent defining attribute is retracted', () => {
    const list = listId('acme', '1')
    const item = itemId('acme', '1', '2')
    const facts = [
      fact(list, Attr.list, '1', 'AAAAAAAAAAAAAAAAAAAAAAAAAA', {
        op: 'retract',
      }),
      fact(item, Attr.item, '2', 'AAAAAAAAAAAAAAAAAAAAAAAAAB'),
      fact(item, Attr.itemTitle, 'hidden', 'AAAAAAAAAAAAAAAAAAAAAAAAAB'),
    ]
    expect(isVisible(list, facts, evidenceCatalog)).toBe(false)
    expect(visibleFacts(facts, evidenceCatalog)).toEqual([])
  })
})
