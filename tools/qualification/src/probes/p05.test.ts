import { describe, expect, it } from '@effect/vitest'
import { CHANGESET_TTL_MS } from '@viviefs/datom'
import { P05_CHECK_COUNT, P05_CHECK_NAMES } from '@viviefs/testing'

describe('P05 changeset picks', () => {
  it('pins a 24 hour open-changeset TTL', () => {
    expect(CHANGESET_TTL_MS).toBe(86_400_000)
  })

  it('names fourteen conformance checks including the incomplete-changeset positive control', () => {
    expect(P05_CHECK_COUNT).toBe(14)
    expect(P05_CHECK_NAMES).toContain('incomplete changeset')
    expect(P05_CHECK_NAMES).toContain('basis write-once')
    expect(P05_CHECK_NAMES).toContain('rebuild equals incremental')
    expect(P05_CHECK_NAMES).toContain('reactivity keys')
  })
})
