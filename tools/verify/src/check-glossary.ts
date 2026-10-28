/**
 * verify quality / glossary: reports the glossary's size and the terms no
 * living document uses (D178). It never fails; each map's acceptance reads the
 * report and removes or justifies an unused term.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { GLOSSARY_FILE, glossaryReport, isLivingDocument } from './glossary-report.ts'
import { ROOT } from './stages.ts'

const documents = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  cwd: ROOT,
})
  .split('\n')
  .filter((path) => /\.mdx?$/.test(path) && !/^(?:repos|vendor|\.agents)\//.test(path))
  .filter((path) => existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile())
  .flatMap((path) => {
    const content = readFileSync(join(ROOT, path), 'utf8')
    return isLivingDocument(path, content) ? [content] : []
  })

const { terms, unused } = glossaryReport(readFileSync(join(ROOT, GLOSSARY_FILE), 'utf8'), documents)
console.log(`Glossary: ${terms} terms, read against ${documents.length} living documents.`)
for (const term of unused) console.log(`  unused: ${term}`)
console.log(`note: ${terms} terms; ${unused.length === 0 ? 'every term is used' : `${unused.length} unused: ${unused.join(', ')}`}`)
