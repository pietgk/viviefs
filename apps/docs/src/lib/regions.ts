/**
 * Samples embedded from source by region (D60).
 *
 * A region is marked in the source file itself, so what a page shows is the
 * code that type-checks and runs:
 *
 *     // #region datom
 *     export const Datom = Schema.Struct({ ... })
 *     // #endregion datom
 *
 * Regions may nest; marker lines never appear in the output. A page that
 * names a region the file does not have fails the build.
 */
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { findRepositoryRoot } from './repo.ts'

const START = /^\s*\/\/\s*#region\s+(\S+)\s*$/
const END = /^\s*\/\/\s*#endregion(?:\s+(\S+))?\s*$/

const dedent = (lines: ReadonlyArray<string>): string => {
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.length - line.trimStart().length)
  const common = indents.length === 0 ? 0 : Math.min(...indents)
  return lines.map((line) => line.slice(common)).join('\n')
}

/** The lines of region `name` in `source`, dedented, without marker lines. */
export const extractRegion = (source: string, name: string): string => {
  const lines = source.split('\n')
  const starts = lines.flatMap((line, index) =>
    START.exec(line)?.[1] === name ? [index] : [],
  )
  const [start, ...more] = starts
  if (start === undefined) throw new Error(`No region "${name}".`)
  if (more.length > 0) {
    throw new Error(`Region "${name}" is marked ${starts.length} times.`)
  }
  const body: string[] = []
  let depth = 1
  for (const line of lines.slice(start + 1)) {
    if (START.test(line)) {
      depth += 1
      continue
    }
    const end = END.exec(line)
    if (end) {
      depth -= 1
      if (depth === 0) {
        if (end[1] !== undefined && end[1] !== name) {
          throw new Error(
            `Region "${name}" is closed by "#endregion ${end[1]}".`,
          )
        }
        return dedent(body)
      }
      continue
    }
    body.push(line)
  }
  throw new Error(`Region "${name}" has no #endregion.`)
}

const LANGUAGES: Record<string, string> = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.json': 'json',
}

export type Sample = {
  readonly code: string
  readonly lang: string
  readonly path: string
}

/**
 * Reads a sample: a repository file, or one region of it. `path` is relative
 * to the repository root, for example `libs/datom/src/schema.ts`.
 */
export const readSample = (
  path: string,
  region?: string,
  repositoryRoot: string = findRepositoryRoot(),
): Sample => {
  const source = readFileSync(join(repositoryRoot, path), 'utf8')
  const lang = LANGUAGES[extname(path)]
  if (!lang) throw new Error(`Sample ${path}: unknown language.`)
  if (region === undefined) return { code: source.trimEnd(), lang, path }
  try {
    return { code: extractRegion(source, region), lang, path }
  } catch (error) {
    throw new Error(`Sample ${path}: ${(error as Error).message}`, {
      cause: error,
    })
  }
}
