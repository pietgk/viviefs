import { describe, expect, it } from '@effect/vitest'
import { ACTIONS, can, compare, fromStart, initial, JUMP_BACK_MS, mint, receive, ROOM, step, T0, tagOrder, type Action, type State } from './hlc-clock.ts'

const run = (...actions: ReadonlyArray<Action>): State => actions.reduce(step, initial)
const minted = (state: State, who: 'A' | 'B') => state[who].entries.filter(({ kind }) => kind === 'minted').map(({ hlc }) => [hlc.pt - T0, hlc.c])

describe('mint and receive', () => {
  it('mints (now, 0) when time moved on, and counts up when it did not', () => {
    expect(mint(T0, null)).toEqual({ pt: T0, c: 0 })
    expect(mint(T0 + 1, { pt: T0, c: 4 })).toEqual({ pt: T0 + 1, c: 0 })
    expect(mint(T0 - 5, { pt: T0, c: 4 })).toEqual({ pt: T0, c: 5 })
  })

  it('moves up to a tag from elsewhere, keeps a later own value, and refuses one too far ahead', () => {
    expect(receive(T0, { pt: T0, c: 1 }, { pt: T0 + 3_000, c: 0 })).toEqual({ ok: true, last: { pt: T0 + 3_000, c: 0 } })
    expect(receive(T0, { pt: T0, c: 1 }, { pt: T0 - 9, c: 7 })).toEqual({ ok: true, last: { pt: T0, c: 1 } })
    expect(receive(T0, null, { pt: T0 + 5_000, c: 0 }).ok).toBe(true)
    expect(receive(T0, null, { pt: T0 + 5_001, c: 0 }).ok).toBe(false)
    expect(compare({ pt: 1, c: 2 }, { pt: 1, c: 2 })).toBe(0)
  })
})

describe('the widget', () => {
  it('counts up within one millisecond, and starts again at 0 when time moves', () => {
    expect(minted(run('mint A', 'mint A', 'wait', 'mint A'), 'A')).toEqual([[0, 0], [0, 1], [1, 0]])
  })

  it('ignores a wall clock set back while the device runs', () => {
    expect(minted(run('mint A', 'jumpBack', 'wait', 'mint A'), 'A')).toEqual([[0, 0], [1, 0]])
  })

  it('after a reboot, starts from the last value it saved, not from a wall clock set back', () => {
    const state = run('mint A', 'wait', 'mint A', 'jumpBack', 'reboot', 'mint A', 'wait', 'mint A')
    expect(minted(state, 'A')).toEqual([[0, 0], [1, 0], [1, 1], [2, 0]])
    expect(state.A.wall).toBe(T0 + 2 - JUMP_BACK_MS)
  })

  it('moves A up to B when B runs 3 s ahead, so A mints after B', () => {
    const state = run('ahead', 'mint B', 'mint A', 'receive', 'mint A')
    expect(minted(state, 'B')).toEqual([[3_000, 0]])
    expect(state.A.entries.map(({ kind }) => kind)).toEqual(['minted', 'received', 'minted'])
    expect(minted(state, 'A')).toEqual([[0, 0], [3_000, 1]])
    expect(tagOrder(state).map(({ label }) => label)).toEqual(['A1', 'B1', 'A2'])
  })

  it('refuses a tag from 6 s ahead, and keeps its own clock', () => {
    const state = run('ahead', 'ahead', 'mint B', 'mint A', 'receive', 'mint A')
    expect(state.A.entries[1]?.kind).toBe('refused')
    expect(minted(state, 'A')).toEqual([[0, 0], [0, 1]])
    expect(state.last?.entry?.label).toBe('A2')
  })

  it('refuses what the buttons do not allow, and stops at its room', () => {
    expect(ACTIONS).toHaveLength(8)
    expect(step(initial, 'receive')).toBe(initial)
    expect(step(initial, 'reboot')).toBe(initial)
    expect(can(run('ahead', 'ahead'), 'ahead')).toBe(false)
    expect(can(run('mint B'), 'ahead')).toBe(false)
    const full = run(...Array.from({ length: ROOM }, (): Action => 'mint A'))
    expect(can(full, 'mint A')).toBe(false)
    expect(step(full, 'reset')).toBe(initial)
    expect([fromStart(T0 + 3), fromStart(T0 - 2)]).toEqual(['+3', '-2'])
  })
})
