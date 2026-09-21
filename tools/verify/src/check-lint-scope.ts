/**
 * Proves every tracked source file is actually linted.
 *
 * ESLint reports an unmatched file as a warning and still exits 0, so a file
 * can silently leave lint scope. This gate turns that warning into a failure.
 *
 * Adapted from web-interview `scripts/check-lint-scope.ts`.
 */
import { execFileSync } from 'node:child_process'
import { ESLint } from 'eslint'

const SOURCE_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts']

const MODULE_SYSTEM_EXTENSIONS = ['mjs', 'cjs', 'mts', 'cts']

const moduleSystemPattern = new RegExp(
  `\\.(?:${MODULE_SYSTEM_EXTENSIONS.join('|')})$`,
)

const INTENTIONALLY_UNLINTED: readonly { prefix: string; rationale: string }[] =
  Object.freeze([
    {
      prefix: '.agents/',
      rationale:
        'Vendored skills. Upstream copies are not subject to this repo\'s lint rules.',
    },
    {
      prefix: 'repos/',
      rationale:
        'Git-subtree reference trees. Read-only for agents; not this repo\'s lint rules.',
    },
  ])

const sourcePattern = new RegExp(`\\.(?:${SOURCE_EXTENSIONS.join('|')})$`)

const trackedSources = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter((path) => path !== '' && sourcePattern.test(path))

const excuseFor = (path: string) =>
  INTENTIONALLY_UNLINTED.find((entry) => path.startsWith(entry.prefix)) ?? null

const eslint = new ESLint()

const unlinted: string[] = []
const excusedButLinted: string[] = []
const moduleSystemNamed: string[] = []
let linted = 0

for (const path of trackedSources) {
  if (moduleSystemPattern.test(path) && !excuseFor(path)) {
    moduleSystemNamed.push(path)
  }
  const configured = (await eslint.calculateConfigForFile(path)) !== undefined
  const ignored = await eslint.isPathIgnored(path)
  const covered = configured && !ignored
  const excuse = excuseFor(path)

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
      'entry to INTENTIONALLY_UNLINTED in this file.',
  )
}

if (excusedButLinted.length > 0) {
  problems.push(
    `${excusedButLinted.length} file(s) are excused in INTENTIONALLY_UNLINTED but are ` +
      `linted anyway, so the excuse is stale:\n` +
      excusedButLinted.map((path) => `  ${path}`).join('\n'),
  )
}

if (problems.length > 0) {
  throw new Error(`Lint scope is incomplete:\n${problems.join('\n\n')}`)
}

const excused = trackedSources.length - linted
console.log(
  `Lint scope: ${linted} of ${trackedSources.length} tracked source files linted, ` +
    `${excused} excused.`,
)
