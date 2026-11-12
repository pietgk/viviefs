// The list commands (D219): createList makes a list that exists and has a
// title; renameList writes only the title, so renaming never restores a list
// that another device deleted (ADR-0010).
import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import { Attr, decodeCommit } from '@viviefs/datom'
import { createList, renameList, type CommandMint } from './command.ts'

const mint: CommandMint = { cs: 'cs', memberTx: 'm', extraTx: 'x', commitTx: 'c', actor: 'a', device: 'd', basis: 0 }
const intent = { org: 'acme', list: 'one', title: 'Roof' }
const refusal = <A, E extends { readonly message: string }>(effect: Effect.Effect<A, E>) =>
  Effect.match(effect, { onSuccess: () => 'made', onFailure: (error) => error.message })

describe('createList', () => {
  it.effect('asserts that the list exists, and its title, then the commit', () =>
    Effect.gen(function* () {
      const made = yield* createList({ exists: false }, intent, mint)
      expect(made.datoms.map(({ a, v, tx }) => [a, v, tx])).toEqual([
        [Attr.list, '1', 'm'],
        [Attr.listTitle, 'Roof', 'x'],
        [Attr.changesetCommit, made.datoms[2]?.v, 'c'],
      ])
      expect(decodeCommit(made.datoms[2]?.v ?? '')?.n).toBe(2)
      expect(made.envelope.command).toBe('evidence.createList')
    }),
  )

  it.effect('refuses a list that exists, and a blank title', () =>
    Effect.gen(function* () {
      expect(yield* refusal(createList({ exists: true }, intent, mint))).toBe('list exists')
      expect(yield* refusal(createList({ exists: false }, { ...intent, title: ' ' }, mint))).toBe('blank title')
    }),
  )
})

describe('renameList', () => {
  it.effect('writes the title alone, never the list again', () =>
    Effect.gen(function* () {
      const renamed = yield* renameList({ exists: true, title: 'Visit' }, intent, mint)
      expect(renamed.datoms.map(({ a, v, tx }) => [a, v, tx])).toEqual([
        [Attr.listTitle, 'Roof', 'm'],
        [Attr.changesetCommit, renamed.datoms[1]?.v, 'c'],
      ])
      expect(decodeCommit(renamed.datoms[1]?.v ?? '')?.n).toBe(1)
      expect(renamed.envelope.command).toBe('evidence.renameList')
    }),
  )

  it.effect('refuses a list it does not know, an unchanged title and a blank one', () =>
    Effect.gen(function* () {
      expect(yield* refusal(renameList({ exists: false, title: null }, intent, mint))).toBe('no such list')
      expect(yield* refusal(renameList({ exists: true, title: 'Roof' }, intent, mint))).toBe('unchanged title')
      expect(yield* refusal(renameList({ exists: true, title: 'Visit' }, { ...intent, title: '' }, mint))).toBe('blank title')
    }),
  )
})
