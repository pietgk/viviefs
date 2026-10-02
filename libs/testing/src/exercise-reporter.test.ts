// What a learner sees from `pnpm exercise` (D91): "not yet" with the hint,
// the file to edit and the lesson; "done" with the solution and what is next.
// The folder layout is a fixture repository, so no real track is read.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import { formatVerdict, hintOf, LESSONS_DIRECTORY, verdictFor } from './exercise-reporter.ts'
import { EXERCISE_FILES, exerciseTrackConfig } from './vitest.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-exercise-reporter-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

for (const file of [
  'exercises/x/01.01-append-and-stream/problem/send.ts',
  'exercises/x/01.01-append-and-stream/solution/send.ts',
  'exercises/x/02.01-mint/problem/mint.ts',
  'exercises/x/02.01-mint/solution/mint.ts',
  'exercises/x/02.02-receive/problem/receive.ts',
  'exercises/x/02.02-receive/solution/receive.ts',
  `${LESSONS_DIRECTORY('x')}/01-a-fact.mdx`,
  `${LESSONS_DIRECTORY('x')}/02-time.mdx`,
]) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), file.endsWith('.mdx') ? `---\ntitle: ${file.includes('01-') ? 'A datom is one fact' : 'Time'}\n---\n` : '')
}

describe("a learner's verdict", () => {
  it('keeps the assertion, not Vitest\'s "expected ... to equal" tail', () => {
    expect(hintOf('a retry must not add facts: expected { inserted: 3 } to deeply equal { inserted: 0 }')).toBe(
      'a retry must not add facts',
    )
    expect(hintOf('the database is locked\n  at x')).toBe('the database is locked')
  })

  it('says not yet, what is missing, what to edit and what to reread', () => {
    const verdict = verdictFor(root, 'exercises/x/01.01-append-and-stream', {
      message: 'a retry must not add facts: expected {} to deeply equal {}',
      expected: '{ "inserted": 0, "duplicates": 3 }',
      actual: '{\n  "inserted": 3,\n  "duplicates": 0\n}',
    })
    expect(formatVerdict(verdict)).toBe(
      [
        '01.01 append and stream: not yet',
        '',
        '  a retry must not add facts',
        '    expected { "inserted": 0, "duplicates": 3 }',
        '    received { "inserted": 3, "duplicates": 0 }',
        '',
        '  Edit   exercises/x/01.01-append-and-stream/problem/send.ts',
        '  Then   pnpm exercise x 01.01',
        `  Reread lesson 01, A datom is one fact: ${LESSONS_DIRECTORY('x')}/01-a-fact.mdx`,
        '',
      ].join('\n'),
    )
  })

  it('says done, the solution to compare, and the next lesson', () => {
    expect(formatVerdict(verdictFor(root, 'exercises/x/01.01-append-and-stream', null))).toBe(
      [
        '01.01 append and stream: done',
        '',
        '  Compare with the reference solution:',
        '    exercises/x/01.01-append-and-stream/solution/send.ts',
        '',
        '  Then   answer "Check yourself" in lesson 01, A datom is one fact',
        `  Next   lesson 02, Time: ${LESSONS_DIRECTORY('x')}/02-time.mdx`,
        '',
      ].join('\n'),
    )
  })

  it('sends a learner to the next exercise of the same section first, and says when the track ends', () => {
    expect(formatVerdict(verdictFor(root, 'exercises/x/02.01-mint', null))).toContain('  Next   pnpm exercise x 02.02')
    expect(formatVerdict(verdictFor(root, 'exercises/x/02.02-receive', null))).toContain('That was the last exercise of this track.')
  })

  it('reports with the verdict only when pnpm exercise runs', () => {
    const verify = exerciseTrackConfig('file:///repo/exercises/x/vitest.config.ts', {})
    const learner = exerciseTrackConfig('file:///repo/exercises/x/vitest.config.ts', { VIVIEFS_EXERCISE: 'problem' })
    expect(verify.test?.reporters).toBeUndefined()
    expect(learner.test?.reporters).toHaveLength(1)
    expect(learner.test?.include).toEqual(EXERCISE_FILES)
  })
})
