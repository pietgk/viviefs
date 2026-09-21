import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import {
  changesetMembers,
  decodeCommit,
  encodeCommit,
  hashMembers,
} from './manifest.ts'
import { Attr } from './vocabulary.ts'
import type { Datom } from './schema.ts'

const member = (
  e: string,
  a: string,
  v: string,
  tx: string,
  cs: string,
): Datom => ({ e, a, v, tx, op: 'assert', cs })

describe('changeset manifest', () => {
  it('treats incomplete JSON as a missing commit', () => {
    expect(decodeCommit('not-json')).toBeNull()
  })

  it.effect('hashes members independently of commit order', () =>
    Effect.gen(function* () {
      const cs = 'AAAAAAAAAAAAAAAAAAAAAAAAAA'
      const members = [
        member('Oacme/L1', Attr.list, '1', 'AAAAAAAAAAAAAAAAAAAAAAAAAB', cs),
        member('Oacme/L1', Attr.listTitle, 'Q3', 'AAAAAAAAAAAAAAAAAAAAAAAAAC', cs),
      ]
      const reversed = members.slice().reverse()
      const left = yield* hashMembers(members)
      const right = yield* hashMembers(reversed)
      expect(left).toHaveLength(64)
      expect(left).toBe(right)
      const encoded = encodeCommit({ n: 2, hash: left, basis: 4, files: [] })
      expect(decodeCommit(encoded)).toEqual({
        n: 2,
        hash: left,
        basis: 4,
        files: [],
      })
      expect(
        changesetMembers([
          ...members,
          member(
            cs,
            Attr.changesetCommit,
            encoded,
            'AAAAAAAAAAAAAAAAAAAAAAAAAD',
            cs,
          ),
        ]),
      ).toHaveLength(2)
    }),
  )
})
