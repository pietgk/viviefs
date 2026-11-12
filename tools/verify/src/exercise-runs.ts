/**
 * verify / exercises (D222): what a lesson shows of its exercise's two runs,
 * `pnpm exercise <pattern> <NN.MM>` on `problem/` and on `solution/`, kept in
 * `exercises/<pattern>/runs.json`. The file is written by
 * `pnpm exercise:record` and checked against a fresh run by verify's
 * `exercises` step, so a lesson never shows a run that is not the code's.
 */

/** One exercise's two runs, as the learner's verdict prints them. */
export type ExerciseRuns = { readonly command: string; readonly problem: string; readonly solution: string }

export type RunsFile = {
  readonly generated: string
  readonly exercises: Readonly<Record<string, ExerciseRuns>>
}

export const RUNS_FILE = 'runs.json'
export const GENERATED = 'by pnpm exercise:record from both runs of every exercise; do not edit (D222)'

/** The exercise folders of a track: `NN.MM-name`. */
export const exerciseFolders = (entries: ReadonlyArray<string>): ReadonlyArray<string> =>
  entries.filter((entry) => /^\d\d\.\d\d-[a-z0-9-]+$/.test(entry)).sort()

/** The runs file of a track from the verdicts each side recorded, keyed by exercise id. */
export const runsFile = (
  pattern: string,
  problem: Readonly<Record<string, string>>,
  solution: Readonly<Record<string, string>>,
): RunsFile => {
  const ids = [...new Set([...Object.keys(problem), ...Object.keys(solution)])].sort()
  const missing = ids.filter((id) => problem[id] === undefined || solution[id] === undefined)
  if (missing.length > 0) throw new Error(`exercises ${missing.join(', ')} of ${pattern} did not run on both sides`)
  return {
    generated: GENERATED,
    exercises: Object.fromEntries(ids.map((id) => [id, { command: `pnpm exercise ${pattern} ${id}`, problem: problem[id] ?? '', solution: solution[id] ?? '' }])),
  }
}

export const formatRunsFile = (file: RunsFile): string => `${JSON.stringify(file, null, 2)}\n`
