/**
 * verify / exercises (D222): runs every exercise of every track on
 * `problem/` and on `solution/`, as `pnpm exercise` does, and checks that
 * `exercises/<pattern>/runs.json` holds exactly those runs. With `--write`
 * (`pnpm exercise:record`) it writes the file instead.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exerciseFolders, formatRunsFile, RUNS_FILE, runsFile } from './exercise-runs.ts'
import { ROOT } from './stages.ts'

const write = process.argv.includes('--write')
const tracks = readdirSync(join(ROOT, 'exercises')).filter((name) => existsSync(join(ROOT, 'exercises', name, 'vitest.config.ts')))
const stale: string[] = []

const side = (pattern: string, folders: ReadonlyArray<string>, which: 'problem' | 'solution'): Record<string, string> => {
  const directory = mkdtempSync(join(tmpdir(), 'viviefs-exercise-runs-'))
  const record = join(directory, 'runs.json')
  try {
    spawnSync('pnpm', ['exec', 'vitest', 'run', '--config', `exercises/${pattern}/vitest.config.ts`, ...folders.map((folder) => `${folder}/`)], {
      cwd: ROOT,
      env: { ...process.env, VIVIEFS_EXERCISE: which, VIVIEFS_EXERCISE_RECORD: record, NODE_OPTIONS: '--disable-warning=ExperimentalWarning' },
      encoding: 'utf8',
    })
    if (!existsSync(record)) throw new Error(`exercises/${pattern}: the ${which} run recorded nothing`)
    return JSON.parse(readFileSync(record, 'utf8')) as Record<string, string>
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

for (const pattern of tracks) {
  const folders = exerciseFolders(readdirSync(join(ROOT, 'exercises', pattern)))
  const text = formatRunsFile(runsFile(pattern, side(pattern, folders, 'problem'), side(pattern, folders, 'solution')))
  const path = join(ROOT, 'exercises', pattern, RUNS_FILE)
  if (write) writeFileSync(path, text)
  else if (!existsSync(path) || readFileSync(path, 'utf8') !== text) stale.push(`exercises/${pattern}/${RUNS_FILE}`)
}

if (stale.length > 0) {
  throw new Error(`${stale.join(', ')} no longer show what the exercises print; run pnpm exercise:record and review the change.`)
}
console.log(`Exercise runs: ${tracks.length} track(s) ${write ? 'recorded' : 'match a fresh run of both sides'} (D222).`)
