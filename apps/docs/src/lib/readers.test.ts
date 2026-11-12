import { describe, expect, it } from '@effect/vitest'
import { ACTIONS, after, can, commandFacts, initial, ROOM, step, TITLES, type Action, type State } from './readers.ts'

const run = (...actions: ReadonlyArray<Action>): State => actions.reduce(step, initial)
const received = (state: State) => state.exporter.received.map(({ seq, again }) => (again ? `${seq} again` : `${seq}`))

describe('the commands', () => {
  it('create the list with three facts, and rename it with two', () => {
    expect(commandFacts(0).map(({ kind, v }) => `${kind} ${v}`)).toEqual(['list O1/L1', 'title Visit', 'commit {"n":2,…}'])
    expect(commandFacts(1).map(({ kind, v }) => `${kind} ${v}`)).toEqual(['title Roof', 'commit {"n":1,…}'])
  })

  it('reads the facts after a place, in log order', () => {
    expect(after(run('write', 'write').log, 3).map(({ seq }) => seq)).toEqual([4, 5])
  })
})

describe('each reader keeps its own place', () => {
  it('moves the read models and trace export apart', () => {
    const state = run('write', 'project', 'write', 'export')
    expect(state.models).toEqual({ place: 3, title: 'Visit' })
    expect(state.exporter.place).toBe(5)
    expect(received(state)).toEqual(['1', '2', '3', '4', '5'])
    expect(step(state, 'project').models).toEqual({ place: 5, title: 'Roof' })
  })

  it('sends again after a crash between sending and acknowledging, and loses nothing', () => {
    const state = run('write', 'crashAfterSend', 'export')
    expect(received(state)).toEqual(['1', '2', '3', '1 again', '2 again', '3 again'])
    expect(state.exporter.place).toBe(3)
    expect(state.lost).toEqual([])
    expect(state.last?.read).toEqual([1, 2, 3])
  })

  it('loses what it acknowledged before sending, and the log still has it', () => {
    const state = run('write', 'export', 'write', 'ackThenCrash', 'write', 'export')
    expect(state.lost).toEqual([4, 5])
    expect(received(state)).toEqual(['1', '2', '3', '6', '7'])
    expect(state.log).toHaveLength(7)
  })

  it('offers only what can happen, and stops at its room', () => {
    expect(ACTIONS).toHaveLength(6)
    expect(['project', 'export', 'crashAfterSend', 'ackThenCrash'].some((action) => can(initial, action as Action))).toBe(false)
    expect(step(initial, 'export')).toBe(initial)
    const full = run(...TITLES.map((): Action => 'write'))
    expect(full.log).toHaveLength(ROOM)
    expect(can(full, 'write')).toBe(false)
    expect(step(full, 'reset')).toBe(initial)
  })
})
