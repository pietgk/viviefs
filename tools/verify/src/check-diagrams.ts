/**
 * Every Mermaid edge in the repository's Markdown and MDX survives rendering
 * (D61). The rule and its failing cases are in diagrams.test.ts.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  countDiagrams,
  describeFinding,
  findCollapsingSelfTransitions,
} from './diagrams.ts'

/** Copies of other repositories, whose diagrams are not ours to change. */
const NOT_OURS = ['.agents/', 'repos/', 'vendor/']

const documents = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(
    (path) =>
      /\.mdx?$/.test(path) && !NOT_OURS.some((prefix) => path.startsWith(prefix)),
  )

const problems: string[] = []
let files = 0
let diagrams = 0

for (const path of documents) {
  const markdown = readFileSync(path, 'utf8')
  const count = countDiagrams(markdown)
  if (count === 0) continue
  files += 1
  diagrams += count
  for (const finding of findCollapsingSelfTransitions(markdown)) {
    problems.push(describeFinding(finding, path))
  }
}

if (problems.length > 0) {
  throw new Error(
    `${problems.length} diagram edge(s) would not survive rendering:\n` +
      problems.map((line) => `  ${line}`).join('\n'),
  )
}

console.log(`Diagrams: ${diagrams} in ${files} file(s); every edge survives rendering.`)
