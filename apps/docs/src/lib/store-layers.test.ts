import { describe, expect, it } from '@effect/vitest'
import { canRun, CHECKS, code, conformance, databaseOf, DATABASES, initial, needs, step, type Action, type State } from './store-layers.ts'

const run = (...actions: ReadonlyArray<Action>): State => actions.reduce(step, initial)
const complete: ReadonlyArray<Action> = [
  { kind: 'piece', id: 'entropy' },
  { kind: 'piece', id: 'device' },
]

describe('a store composed from Layers', () => {
  it('needs every service until it is given, and leaves the clock to whoever runs it', () => {
    expect(needs(initial)).toEqual(['HlcEntropy', 'HlcDevice', 'HlcClock'])
    expect(canRun(initial)).toBe(false)
    expect(needs(run(...complete))).toEqual(['HlcClock'])
    expect(step(initial, { kind: 'run' })).toBe(initial)
  })

  it('writes the composition as code', () => {
    expect(code(run({ kind: 'database', id: 'sqlite-file' }, ...complete))).toBe(
      [
        'const store = logStoreLayer.pipe(',
        "  Layer.provideMerge(sqliteNodeLayer(join(directory, 'log.sqlite'))),",
        '  Layer.provide(cryptoEntropy),',
        "  Layer.provide(deviceLayer('learner')),",
        ')',
        '// still needs HlcClock: whoever runs the store gives it',
      ].join('\n'),
    )
    expect(code(initial).split('\n').at(-1)).toBe('// still needs HlcEntropy, HlcDevice, HlcClock')
  })

  it('fails only hlc reboot on a database that forgets on a restart', () => {
    const memory = run(...complete, { kind: 'run' })
    expect(memory.run?.results.filter(({ status }) => status === 'FAIL').map(({ name }) => name)).toEqual(['hlc reboot'])
    const file = run({ kind: 'database', id: 'sqlite-file' }, ...complete, { kind: 'run' })
    expect(file.run?.results.every(({ status }) => status === 'PASS')).toBe(true)
    expect(conformance(databaseOf('pglite-dir'))).toHaveLength(CHECKS.length)
  })

  it('leaves device and browser stores to the gate, and forgets a run when the store changes', () => {
    expect(canRun(run({ kind: 'database', id: 'op-sqlite' }, ...complete))).toBe(false)
    const ran = run(...complete, { kind: 'run' })
    expect(step(ran, { kind: 'piece', id: 'device' }).run).toBeNull()
    expect(DATABASES.filter(({ here }) => here)).toHaveLength(4)
    expect(step(ran, { kind: 'reset' })).toBe(initial)
  })
})
