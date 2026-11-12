// One home for every piece of knowledge (D221): text that two documents
// share drifts, so a shared run of prose is reported; code, components,
// imports and reference names are not prose.
import { describe, expect, it } from '@effect/vitest'
import { overlaps, proseWords } from './overlap.ts'

const passage = 'the server holds authority so it accepts each change and keeps its log'

describe('the overlap check', () => {
  it('reads prose only', () => {
    const words = proseWords(
      "---\ntitle: T\n---\nimport X from './x.astro'\n\nSee [D1 A decision][D1] and [the page](/p/).\n\n```ts\nconst code = 1\n```\n\n<Sample path=\"a.ts\" />\n\n{/* note */}\n\n[D1]: ../x.md#d1\n",
    )
    expect(words).toEqual(['see', 'and', 'the', 'page'])
  })

  it('reports a passage two documents share, once', () => {
    const found = overlaps([
      { path: 'a.mdx', content: `Intro. ${passage}, and more.` },
      { path: 'b.mdx', content: `Other words. ${passage}.` },
      { path: 'c.mdx', content: 'Nothing in common here at all, not one run of eight words.' },
    ])
    expect(found).toEqual([{ first: 'a.mdx', second: 'b.mdx', words: 'the server holds authority so it accepts each change and keeps its log' }])
  })

  it('passes documents that only share fewer words than the run', () => {
    expect(overlaps([{ path: 'a', content: 'the server holds authority today' }, { path: 'b', content: 'the server holds authority now' }])).toEqual([])
  })

  it('keeps code spans as one word, so a shared identifier alone is not a passage', () => {
    expect(proseWords('call `store.append(datoms, envelope)` once')).toEqual(['call', 'code_store_append_datoms_envelope', 'once'])
  })
})
