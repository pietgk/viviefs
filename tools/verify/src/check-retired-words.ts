/**
 * verify quality / retired-words: fails a word the glossary retired in code
 * font wherever a living document writes it so outside another project's
 * words (D180', D204). Reads the glossary and the living documents and
 * applies retired-words.ts.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { GLOSSARY_FILE } from './glossary-report.ts'
import { isCheckedForRetiredWords, retiredCodeWords, retiredWordUses } from './retired-words.ts'
import { ROOT } from './stages.ts'

const words = retiredCodeWords(readFileSync(join(ROOT, GLOSSARY_FILE), 'utf8'))
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  cwd: ROOT,
})
  .split('\n')
  .filter((path) => /\.mdx?$/.test(path) && existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile())
  .map((path) => ({ path, content: readFileSync(join(ROOT, path), 'utf8') }))
  .filter(({ path, content }) => isCheckedForRetiredWords(path, content))

const problems = files.flatMap(({ path, content }) => retiredWordUses(path, content, words))
for (const problem of problems) console.error(problem)
console.log(`Retired words in code font: ${words.map(({ word }) => `\`${word}\``).join(', ')}, read against ${files.length} living documents.`)
if (problems.length > 0) process.exit(1)
console.log(`note: ${words.length} retired in code font, none in use`)
