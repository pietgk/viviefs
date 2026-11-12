import { describe, expect, it } from '@effect/vitest'
import {
  ACTIONS,
  append,
  appendAll,
  can,
  COMMIT_ATTRIBUTE,
  counts,
  createFacts,
  exampleTx,
  initial,
  LIST_ATTRIBUTE,
  ownFacts,
  renameFacts,
  ROOM,
  step,
  TITLES,
  TITLE_ATTRIBUTE,
  type Action,
  type State,
} from './datom-log.ts'

const run = (...actions: ReadonlyArray<Action>): State => actions.reduce(step, initial)
const tags = (state: State, node: 'A' | 'B' | 'server') => state.logs[node].map(({ tx }) => tx)
const titles = (state: State, node: 'A' | 'B' | 'server') => state.logs[node].filter(({ a }) => a === TITLE_ATTRIBUTE).map(({ v }) => v)

describe('append', () => {
  const fact = { e: 'O1/L1', a: 'evidence/list/title', v: 'Visit', tx: exampleTx(1), op: 'assert', cs: exampleTx(1) } as const

  it('stores a new tx at the next place', () => {
    const [log, outcome] = append([], fact)
    expect(outcome).toBe('inserted')
    expect(log).toEqual([{ ...fact, seq: 1, again: false }])
  })

  it('stores a tx it already has never again', () => {
    const [once] = append([], fact)
    const [twice, outcome] = append(once, fact)
    expect(outcome).toBe('duplicate')
    expect(twice).toBe(once)
  })

  it('compares facts by tx alone', () => {
    const [once] = append([], fact)
    const [, outcome] = append(once, { ...fact, v: 'Roof' })
    expect(outcome).toBe('duplicate')
  })
})

describe('appendAll', () => {
  it('appends in order and answers per fact, as one LogStore.append call does', () => {
    const fact = (n: number) => ({ e: 'O1/L1', a: 'evidence/list/title', v: `t${n}`, tx: exampleTx(n), op: 'assert', cs: exampleTx(n) }) as const
    const [log, outcomes] = appendAll([], [fact(1), fact(2), fact(1)])
    expect(outcomes).toEqual(['inserted', 'inserted', 'duplicate'])
    expect(log.map(({ v, seq }) => [v, seq])).toEqual([['t1', 1], ['t2', 2]])
    expect(counts(outcomes)).toEqual({ inserted: 2, duplicates: 1 })
  })
})

describe('the facts of a command', () => {
  const ids = { cs: 'cs', memberTx: 'm', extraTx: 'x', commitTx: 'c' }

  it('create: the list, its title and the commit, all in one changeset', () => {
    expect(createFacts('Visit', ids).map(({ e, a, v, tx, cs }) => [e, a, v, tx, cs])).toEqual([
      ['O1/L1', 'evidence/list', '1', 'm', 'cs'],
      ['O1/L1', 'evidence/list/title', 'Visit', 'x', 'cs'],
      ['cs', 'viviefs/changeset/commit', '{"n":2,…}', 'c', 'cs'],
    ])
    expect(createFacts('Visit', ids).every(({ op }) => op === 'assert')).toBe(true)
  })

  it('rename: the title and the commit, never the list again', () => {
    expect(renameFacts('Roof', ids).map(({ e, a, v, tx }) => [e, a, v, tx])).toEqual([
      ['O1/L1', 'evidence/list/title', 'Roof', 'm'],
      ['cs', 'viviefs/changeset/commit', '{"n":1,…}', 'c'],
    ])
  })

  it('reach the device that wrote them without the commit', () => {
    expect(ownFacts(createFacts('Visit', ids)).map(({ tx }) => tx)).toEqual(['m', 'x'])
  })
})

describe('the example clock', () => {
  it('mints 26 Crockford characters that sort in minting order', () => {
    const txs = Array.from({ length: 40 }, (_, n) => exampleTx(n + 1))
    expect(txs.every((tx) => /^[0-9A-HJKMNP-TV-Z]{26}$/.test(tx))).toBe(true)
    expect([...txs].sort()).toEqual(txs)
    expect(new Set(txs.map((tx) => tx.slice(-4))).size).toBe(txs.length)
  })
})

describe('the widget', () => {
  it('writes a new list to the device and its outbox, and to nothing else', () => {
    const state = run('create A')
    expect(titles(state, 'A')).toEqual(['Visit'])
    expect(state.logs.A.some(({ a }) => a === COMMIT_ATTRIBUTE)).toBe(false)
    expect(state.outbox.A).toHaveLength(1)
    expect(state.logs.server).toEqual([])
    expect(state.logs.B).toEqual([])
    expect(counts(state.last?.calls[0]?.outcomes ?? [])).toEqual({ inserted: 2, duplicates: 0 })
  })

  it('creates the list once, and renames only on a device that knows it', () => {
    expect(can(initial, 'rename A')).toBe(false)
    const created = run('create A')
    expect(can(created, 'create B')).toBe(false)
    expect(can(created, 'rename A')).toBe(true)
    expect(can(created, 'rename B')).toBe(false)
    expect(can(run('create A', 'sync A', 'sync B'), 'rename B')).toBe(true)
  })

  it('syncs: the server appends the changeset, and the device pulls back only the commit as new', () => {
    const state = run('create A', 'sync A')
    expect(state.last?.calls.map(({ at, outcomes }) => [at, counts(outcomes)])).toEqual([
      ['server', { inserted: 3, duplicates: 0 }],
      ['A', { inserted: 1, duplicates: 2 }],
    ])
    expect(state.outbox.A).toEqual([])
    expect(tags(state, 'A')).toEqual(tags(state, 'server'))
  })

  it('takes turns, A then B then A, as plain appends: one list fact, every title kept', () => {
    const state = run('create A', 'sync A', 'sync B', 'rename B', 'sync B', 'sync A', 'rename A', 'sync A', 'sync B')
    for (const node of ['A', 'B', 'server'] as const) {
      expect(titles(state, node)).toEqual(['Visit', 'Roof', 'Attic'])
      expect(state.logs[node].filter(({ a }) => a === LIST_ATTRIBUTE)).toHaveLength(1)
    }
    expect(state.logs.server.every(({ again }) => !again)).toBe(true)
  })

  it('gives one fact another position in another log', () => {
    // B renames before it has pulled A's rename, so B's own title comes first in B's log.
    const state = run('create A', 'sync A', 'sync B', 'rename B', 'rename A', 'sync A', 'sync B')
    const attic = state.logs.server.find(({ v }) => v === 'Attic')
    const roof = state.logs.server.find(({ v }) => v === 'Roof')
    expect([roof?.seq, attic?.seq]).toEqual([6, 4])
    expect(state.logs.B.find(({ tx }) => tx === roof?.tx)?.seq).toBe(4)
    expect(new Set(tags(state, 'B'))).toEqual(new Set(tags(state, 'server')))
  })

  it('stores nothing when the same changeset is sent again', () => {
    const synced = run('create A', 'sync A')
    const again = step(synced, 'sendAgain')
    expect(counts(again.last?.calls[0]?.outcomes ?? [])).toEqual({ inserted: 0, duplicates: 3 })
    expect(again.logs.server).toBe(synced.logs.server)
  })

  it('stores the same rename a second time when it is minted again', () => {
    const state = run('create A', 'sync A', 'rename A', 'sync A', 'newTags')
    expect(state.last?.calls.map(({ at, outcomes }) => [at, counts(outcomes)])).toEqual([
      ['A', { inserted: 1, duplicates: 0 }],
      ['server', { inserted: 2, duplicates: 0 }],
      ['A', { inserted: 1, duplicates: 1 }],
    ])
    expect(titles(state, 'server')).toEqual(['Visit', 'Roof', 'Roof'])
    expect(state.logs.server.map(({ again }) => again)).toEqual([false, false, false, false, false, true, true])
    expect(state.logs.A.map(({ again }) => again)).toEqual([false, false, false, false, false, true, true])
  })

  it('creates again with new tags too, as the same bug', () => {
    const state = run('create A', 'sync A', 'newTags')
    expect(state.logs.server.filter(({ a }) => a === LIST_ATTRIBUTE)).toHaveLength(2)
  })

  it('refuses what the buttons do not allow, and stops at its room', () => {
    expect(ACTIONS).toHaveLength(9)
    expect(step(initial, 'sync A')).toBe(initial)
    expect(step(initial, 'sendAgain')).toBe(initial)
    expect(can(initial, 'newTags')).toBe(false)
    expect(can(run('create A'), 'sync B')).toBe(false)
    expect(can(run('create A', 'sync A', 'rename A'), 'newTags')).toBe(false)
    const full = run('create A', 'sync A', ...Array.from({ length: 6 }, (): ReadonlyArray<Action> => ['rename A', 'sync A']).flat())
    expect(full.logs.server).toHaveLength(ROOM)
    expect(can(full, 'rename B')).toBe(false)
    expect(can(full, 'rename A')).toBe(false)
    expect(can(full, 'newTags')).toBe(false)
    expect(can(full, 'sendAgain')).toBe(true)
    expect(step(full, 'reset')).toBe(initial)
  })

  it('never offers a title twice', () => {
    expect(new Set(TITLES).size).toBe(TITLES.length)
    expect(3 + (TITLES.length - 1) * 2).toBeGreaterThanOrEqual(ROOM)
  })
})
