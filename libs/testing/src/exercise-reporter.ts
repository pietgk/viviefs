/**
 * What a learner sees from `pnpm exercise <pattern> <NN.MM>` (D91): instead
 * of Vitest's output, one verdict. "Not yet" names what the check still
 * misses, the file to edit and the lesson to reread; "done" names the
 * reference solution to compare and what comes next. The first run is red by
 * design: `problem/` runs but is not right yet.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import type { Reporter, TestModule } from 'vitest/node'

/** The variable `pnpm exercise` sets to run only `problem/`. */
export const LEARNER_VARIABLE = 'VIVIEFS_EXERCISE'

/** Where a track's guide keeps its lessons (D81). */
export const LESSONS_DIRECTORY = (pattern: string) => `apps/docs/src/content/docs/guides/${pattern}/lessons`

export type Lesson = { readonly number: number; readonly title: string; readonly path: string }

export type Failure = { readonly message: string; readonly expected?: string | undefined; readonly actual?: string | undefined }

export type Verdict = {
  readonly pattern: string
  /** `01.01`. */
  readonly id: string
  /** `append and stream`, from the folder name. */
  readonly title: string
  readonly problemFiles: ReadonlyArray<string>
  readonly solutionFiles: ReadonlyArray<string>
  readonly failure: Failure | null
  readonly lesson: Lesson | undefined
  /** The next exercise of the same section, if any. */
  readonly nextExercise: string | undefined
  /** The lesson after this section, if any. */
  readonly nextLesson: Lesson | undefined
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').replace(/,\s*([}\]])/g, ' $1').trim()

/** The assertion's own words, without Vitest's "expected X to equal Y" tail. */
export const hintOf = (message: string): string => {
  const first = message.split('\n')[0] ?? message
  const cut = first.search(/: expected [\s\S]* to /)
  return oneLine(cut === -1 ? first : first.slice(0, cut))
}

export type Colors = { readonly red: (s: string) => string; readonly green: (s: string) => string; readonly dim: (s: string) => string }

export const plainColors: Colors = { red: (s) => s, green: (s) => s, dim: (s) => s }

export const ansiColors: Colors = {
  red: (s) => `\u001b[31m${s}\u001b[39m`,
  green: (s) => `\u001b[32m${s}\u001b[39m`,
  dim: (s) => `\u001b[2m${s}\u001b[22m`,
}

const lessonLine = (lesson: Lesson) => `lesson ${String(lesson.number).padStart(2, '0')}, ${lesson.title}`

/** The learner's verdict as printed lines. */
export const formatVerdict = (verdict: Verdict, colors: Colors = plainColors): string => {
  const command = `pnpm exercise ${verdict.pattern} ${verdict.id}`
  const heading = `${verdict.id} ${verdict.title}`
  if (verdict.failure !== null) {
    const { message, expected, actual } = verdict.failure
    const lines = [colors.red(`${heading}: not yet`), '', `  ${hintOf(message)}`]
    if (expected !== undefined && actual !== undefined) {
      lines.push(colors.dim(`    expected ${oneLine(expected)}`), colors.dim(`    received ${oneLine(actual)}`))
    }
    lines.push('')
    for (const file of verdict.problemFiles) lines.push(`  Edit   ${file}`)
    lines.push(`  Then   ${command}`)
    if (verdict.lesson) lines.push(`  Reread ${lessonLine(verdict.lesson)}: ${verdict.lesson.path}`)
    return `${lines.join('\n')}\n`
  }
  const lines = [colors.green(`${heading}: done`), '', '  Compare with the reference solution:']
  for (const file of verdict.solutionFiles) lines.push(`    ${file}`)
  lines.push('')
  if (verdict.nextExercise !== undefined) {
    lines.push(`  Next   pnpm exercise ${verdict.pattern} ${verdict.nextExercise}`)
  } else {
    if (verdict.lesson) lines.push(`  Then   answer "Check yourself" in ${lessonLine(verdict.lesson)}`)
    lines.push(verdict.nextLesson ? `  Next   ${lessonLine(verdict.nextLesson)}: ${verdict.nextLesson.path}` : '  That was the last exercise of this track.')
  }
  return `${lines.join('\n')}\n`
}

const filesIn = (root: string, directory: string): ReadonlyArray<string> =>
  existsSync(join(root, directory))
    ? readdirSync(join(root, directory), { recursive: true, encoding: 'utf8' })
        .filter((name) => /\.tsx?$/.test(name))
        .sort()
        .map((name) => `${directory}/${name}`)
    : []

/** The lessons of a pattern's guide, from their file names and titles. */
export const lessonsOf = (root: string, pattern: string): ReadonlyArray<Lesson> => {
  const directory = LESSONS_DIRECTORY(pattern)
  if (!existsSync(join(root, directory))) return []
  return readdirSync(join(root, directory))
    .filter((name) => /^\d\d-.+\.mdx$/.test(name))
    .sort()
    .map((name) => {
      const source = readFileSync(join(root, directory, name), 'utf8')
      const title = /^title:\s*(.+)$/m.exec(source)?.[1]?.trim() ?? name
      return { number: Number(name.slice(0, 2)), title, path: `${directory}/${name}` }
    })
}

/** Everything the verdict needs about one exercise folder, from the repository. */
export const verdictFor = (root: string, folder: string, failure: Failure | null): Verdict => {
  const track = dirname(folder)
  const pattern = basename(track)
  const name = basename(folder)
  const [, id = '', section = '', item = '', slug = ''] = /^((\d\d)\.(\d\d))-(.+)$/.exec(name) ?? []
  const siblings = readdirSync(join(root, track)).filter((entry) => entry.startsWith(`${section}.`)).sort()
  const later = siblings.find((entry) => Number(entry.slice(3, 5)) > Number(item))
  const lessons = lessonsOf(root, pattern)
  return {
    pattern,
    id,
    title: slug.replace(/-/g, ' '),
    problemFiles: filesIn(root, `${folder}/problem`),
    solutionFiles: filesIn(root, `${folder}/solution`),
    failure,
    lesson: lessons.find(({ number }) => number === Number(section)),
    nextExercise: later?.slice(0, 5),
    nextLesson: lessons.find(({ number }) => number === Number(section) + 1),
  }
}

/** The Vitest reporter `pnpm exercise` runs with (`exerciseTrackConfig`). */
export const learnerReporter = (root: string): Reporter => ({
  onUserConsoleLog: () => {
    // Test output is not the learner's concern; the verdict says what matters.
  },
  onTestRunEnd: (testModules: ReadonlyArray<TestModule>) => {
    const colors = process.stdout.isTTY ? ansiColors : plainColors
    if (testModules.length === 0) {
      process.stdout.write('No exercise matched. Run it as: pnpm exercise <pattern> <NN.MM>, for example pnpm exercise log-store 01.01\n')
      return
    }
    for (const module of testModules) {
      const folder = relative(root, dirname(module.moduleId)).split('\\').join('/')
      const errors = [...module.children.allTests()].flatMap((test) => test.result().errors ?? [])
      const first = errors[0] ?? module.errors()[0]
      const failure: Failure | null =
        first === undefined ? null : { message: first.message, expected: first.expected, actual: first.actual }
      process.stdout.write(`\n${formatVerdict(verdictFor(root, folder, failure), colors)}\n`)
    }
  },
})
