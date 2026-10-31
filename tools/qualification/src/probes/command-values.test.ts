import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import {
  decodeText,
  evidenceCatalog,
  indexCatalog,
  isSystemAttr,
  type DatomType,
} from '@viviefs/datom'
import { renameList, sealItem, type CommandMint } from '@viviefs/evidence-model'

const mint: CommandMint = {
  cs: 'cs-1',
  memberTx: 'tx-1',
  extraTx: 'tx-2',
  commitTx: 'tx-3',
  actor: 'actor-1',
  device: 'device-1',
  basis: 0,
}

const refused = (datoms: ReadonlyArray<DatomType>) => {
  const { byAttr } = indexCatalog(evidenceCatalog)
  return datoms
    .filter((datom) => !isSystemAttr(datom.a))
    .filter((datom) => {
      const value = byAttr.get(datom.a)?.spec.value
      return !value || Option.isNone(decodeText(value, datom.v))
    })
}

describe('the values the evidence commands write', () => {
  it.effect('are all accepted by their attribute Schemas', () =>
    Effect.gen(function* () {
      const renamed = yield* renameList(
        { title: null },
        { org: 'acme', list: '1', title: 'Inbox' },
        mint,
      )
      const sealed = yield* sealItem(
        { org: 'acme', list: '1', item: '2', seal: 's-81' },
        mint,
      )
      expect(renamed.datoms.length).toBeGreaterThan(1)
      expect(refused(renamed.datoms)).toEqual([])
      expect(refused(sealed.datoms)).toEqual([])
    }),
  )
})
