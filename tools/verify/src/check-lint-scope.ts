/**
 * verify static / lint-scope: asks ESLint whether each tracked source file is
 * linted and applies the rule in `lint-scope.ts`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { ESLint } from 'eslint'
import { judgeLintScope, sourcePattern } from './lint-scope.ts'

const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter((path) => path !== '' && sourcePattern.test(path) && existsSync(path))

const eslint = new ESLint()
const files = []
for (const path of tracked) {
  const configured = (await eslint.calculateConfigForFile(path)) !== undefined
  files.push({ path, covered: configured && !(await eslint.isPathIgnored(path)) })
}

const scope = judgeLintScope(files)
if (scope.problems.length > 0) {
  throw new Error(`Lint scope is incomplete:\n${scope.problems.join('\n\n')}`)
}

console.log(
  `Lint scope: ${scope.linted} of ${scope.sources} tracked source files linted, ` +
    `${scope.sources - scope.linted} excused.`,
)
