// The runs a lesson shows of its exercise (D222): both sides of every
// exercise, keyed by id, in a stable form a fresh run can be compared with.
import { describe, expect, it } from '@effect/vitest'
import { exerciseFolders, formatRunsFile, GENERATED, runsFile } from './exercise-runs.ts'

describe('the runs file', () => {
  it('reads only exercise folders, in order', () => {
    expect(exerciseFolders(['track.ts', '02.01-mint', '01.01-append', 'learner.test.ts', 'node_modules'])).toEqual(['01.01-append', '02.01-mint'])
  })

  it('keeps both runs of each exercise, with the command that made them', () => {
    const file = runsFile('log-store', { '01.01': 'not yet', '02.01': 'not yet' }, { '02.01': 'done', '01.01': 'done' })
    expect(file.generated).toBe(GENERATED)
    expect(Object.keys(file.exercises)).toEqual(['01.01', '02.01'])
    expect(file.exercises['01.01']).toEqual({ command: 'pnpm exercise log-store 01.01', problem: 'not yet', solution: 'done' })
    expect(formatRunsFile(file).endsWith('}\n')).toBe(true)
  })

  it('refuses an exercise that ran on one side only', () => {
    expect(() => runsFile('log-store', { '01.01': 'not yet' }, {})).toThrow(/01.01 of log-store did not run on both sides/)
  })
})
