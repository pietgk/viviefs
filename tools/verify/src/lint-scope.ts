/**
 * Proves every tracked source file is actually linted.
 *
 * ESLint reports an unmatched file as a warning and still exits 0, so a file
 * can silently leave lint scope. This rule turns that warning into a failure.
 * `check-lint-scope.ts` runs it over the repository.
 *
 * Adapted from web-interview `scripts/check-lint-scope.ts`.
 */

export const SOURCE_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts']

const MODULE_SYSTEM_EXTENSIONS = ['mjs', 'cjs', 'mts', 'cts']

const moduleSystemPattern = new RegExp(`\\.(?:${MODULE_SYSTEM_EXTENSIONS.join('|')})$`)

export const sourcePattern = new RegExp(`\\.(?:${SOURCE_EXTENSIONS.join('|')})$`)

export const INTENTIONALLY_UNLINTED: readonly { prefix: string; rationale: string }[] =
  Object.freeze([
    {
      prefix: '.agents/',
      rationale:
        "Vendored skills. Upstream copies are not subject to this repo's lint rules.",
    },
    {
      prefix: 'repos/',
      rationale:
        "Git-subtree reference trees. Read-only for agents; not this repo's lint rules.",
    },
  ])

const excuseFor = (path: string) =>
  INTENTIONALLY_UNLINTED.find((entry) => path.startsWith(entry.prefix)) ?? null

export type LintScope = {
  readonly problems: ReadonlyArray<string>
  readonly linted: number
  readonly sources: number
}

/** Judge the scope, given each source file and whether a config covers it. */
export const judgeLintScope = (
  files: ReadonlyArray<{ readonly path: string; readonly covered: boolean }>,
): LintScope => {
  const sources = files.filter((file) => sourcePattern.test(file.path))
  const unlinted: string[] = []
  const excusedButLinted: string[] = []
  const moduleSystemNamed: string[] = []
  let linted = 0

  for (const { path, covered } of sources) {
    const excuse = excuseFor(path)
    if (moduleSystemPattern.test(path) && !excuse) moduleSystemNamed.push(path)
    if (covered) {
      linted += 1
      if (excuse) excusedButLinted.push(path)
      continue
    }
    if (!excuse) unlinted.push(path)
  }

  const problems: string[] = []
  if (moduleSystemNamed.length > 0) {
    problems.push(
      `${moduleSystemNamed.length} file(s) encode a module system in their extension:\n` +
        moduleSystemNamed.map((path) => `  ${path}`).join('\n') +
        `\nThis repo uses one extension per language (.js, .jsx, .ts, .tsx) and lets ` +
        `package.json "type" decide the module system. Rename to .js or .ts.`,
    )
  }
  if (unlinted.length > 0) {
    problems.push(
      `${unlinted.length} tracked source file(s) are not linted by any configuration:\n` +
        unlinted.map((path) => `  ${path}`).join('\n') +
        '\nEither bring them into scope in eslint.config.js, or add a justified ' +
        'entry to INTENTIONALLY_UNLINTED in lint-scope.ts.',
    )
  }
  if (excusedButLinted.length > 0) {
    problems.push(
      `${excusedButLinted.length} file(s) are excused in INTENTIONALLY_UNLINTED but are ` +
        `linted anyway, so the excuse is stale:\n` +
        excusedButLinted.map((path) => `  ${path}`).join('\n'),
    )
  }
  return { problems, linted, sources: sources.length }
}
