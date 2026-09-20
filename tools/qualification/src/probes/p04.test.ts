import { describe, expect, it } from '@effect/vitest'
import { APPEND_VOLUME, FUTURE_SKEW_MS } from '@viviefs/datom'
import { P04_CHECK_COUNT, P04_CHECK_NAMES } from '@viviefs/testing'

describe('P04 log store picks', () => {
  it('pins a 5 second future-skew bound and a 2000-datom volume', () => {
    expect(FUTURE_SKEW_MS).toBe(5_000)
    expect(APPEND_VOLUME).toBe(2_000)
  })

  it('names eleven conformance checks including the duplicate-append positive control', () => {
    expect(P04_CHECK_COUNT).toBe(11)
    expect(P04_CHECK_NAMES).toContain('duplicate append')
    expect(P04_CHECK_NAMES).toContain('hlc future skew')
    expect(P04_CHECK_NAMES).toContain('compaction horizon')
  })
})
