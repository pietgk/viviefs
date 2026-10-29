/**
 * verify quality / identifiers: fails a `project.json` `metadata` key, a
 * `pnpm` script, a `verify` step or a `viviefs/` name that a living document
 * or a diagram label names and the stack does not have (D180). Reads the names
 * from the repository and applies named-identifiers.ts.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isCheckedForNamedIdentifiers, namedIdentifierProblems, type StackNames } from './named-identifiers.ts'
import { REFUSED_METADATA_KEYS } from './ownership.ts'
import { ROOT, STAGES } from './stages.ts'

const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', cwd: ROOT })
  .split('\n')
  .filter((path) => path !== '' && existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile())

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

const metadataKeys = tracked
  .filter((path) => path.endsWith('project.json'))
  .flatMap((path) => Object.keys((JSON.parse(read(path)) as { metadata?: Record<string, unknown> }).metadata ?? {}))

/** Every string literal that is wholly a `viviefs/` name, outside tests: the attributes and service keys. */
const viviefsNames = tracked
  .filter((path) => /^(?:apps|features|libs|tools)\/.+\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))
  .flatMap((path) => [...read(path).matchAll(/(['"`])(viviefs\/[\w./*-]+)\1/g)].map(([, , name = '']) => name))

const names: StackNames = {
  metadataKeys: new Set([...metadataKeys, ...REFUSED_METADATA_KEYS]),
  scripts: new Set(Object.keys((JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts)),
  verifySelectors: new Set([...STAGES.flatMap((stage) => [stage.name, ...stage.steps.map((step) => step.name)]), 'all', 'baseline', 'help']),
  viviefsNames: new Set(viviefsNames),
}

const files = tracked
  .filter((path) => /\.mdx?$/.test(path))
  .map((path) => ({ path, content: read(path) }))
  .filter(({ path, content }) => isCheckedForNamedIdentifiers(path, content))

const problems = files.flatMap(({ path, content }) => namedIdentifierProblems(path, content, names))
for (const problem of problems) console.error(problem)
console.log(`Names the stack owns, read against ${files.length} living documents and site pages.`)
if (problems.length > 0) process.exit(1)
console.log(
  `note: ${names.metadataKeys.size} metadata keys, ${names.scripts.size} scripts, ${names.verifySelectors.size} verify selectors, ${names.viviefsNames.size} viviefs/ names`,
)
