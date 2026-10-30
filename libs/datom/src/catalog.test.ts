import { describe, expect, it } from '@effect/vitest'
import * as Option from 'effect/Option'
import { engineCatalog, evidenceCatalog, identityCatalog } from './catalog.ts'
import { Attr } from './vocabulary.ts'
import { decodeText, descriptionOf } from './values.ts'
import { indexCatalog, type Catalog } from './catalog.ts'

const attributes = (catalog: Catalog) =>
  catalog.types.flatMap((type) => type.attributes)

const shipped = [
  ...attributes(evidenceCatalog),
  ...attributes(engineCatalog),
  ...attributes(identityCatalog),
]

describe('what a shipped attribute declares', () => {
  it('describes every attribute through its value Schema', () => {
    const undescribed = shipped
      .filter((spec) => descriptionOf(spec.value) === undefined)
      .map((spec) => spec.name)
    expect(undescribed).toEqual([])
  })

  it('takes a blob hash for a file and refuses anything else', () => {
    const file = indexCatalog(evidenceCatalog).byAttr.get(Attr.evidenceFile)
    const value = file?.spec.value
    expect(value).toBeDefined()
    if (!value) return
    const hash = `blob:${'a1'.repeat(32)}`
    expect(decodeText(value, hash)).toEqual(Option.some(hash))
    expect(decodeText(value, 'blob:a')).toEqual(Option.none())
    expect(decodeText(value, 'a photo')).toEqual(Option.none())
  })
})
