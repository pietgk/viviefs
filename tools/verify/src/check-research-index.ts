/**
 * verify quality / research-index: every research record is named by its
 * date and listed in the index, and the index links only records that exist
 * (D68). Reads the repository's files under docs/research/ and the index and
 * applies research-index.ts.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RESEARCH_DIR, RESEARCH_INDEX, researchIndexProblems, researchRecords } from './research-index.ts'
import { ROOT } from './stages.ts'

const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', RESEARCH_DIR], {
  encoding: 'utf8',
  cwd: ROOT,
})
  .split('\n')
  .filter((path) => path !== '' && existsSync(join(ROOT, path)))
const records = researchRecords(paths)

const problems = researchIndexProblems(records, readFileSync(join(ROOT, RESEARCH_INDEX), 'utf8'))
for (const problem of problems) console.error(problem)
console.log(`Research index: ${records.length} records.`)
if (problems.length > 0) process.exit(1)
console.log(`note: ${records.length} records, each listed`)
