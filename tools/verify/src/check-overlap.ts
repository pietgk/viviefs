/**
 * verify / overlap (D221): reads the glossary, the guides and the partials
 * they embed, and fails on prose two of them share (`overlap.ts`).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { overlaps, RUN } from './overlap.ts'
import { ROOT } from './stages.ts'

/** Where knowledge lives: words in the glossary, concepts in partials, the rest in guide pages and lessons. */
export const HOMES = /^(?:GLOSSARY\.md|apps\/docs\/src\/content\/docs\/guides\/.+\.mdx|apps\/docs\/src\/partials\/.+\.mdx)$/

const documents = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', cwd: ROOT })
  .split('\n')
  .filter((path) => HOMES.test(path) && existsSync(join(ROOT, path)))
  .map((path) => ({ path, content: readFileSync(join(ROOT, path), 'utf8') }))

const found = overlaps(documents)
if (found.length > 0) {
  throw new Error(
    `${found.length} passage(s) of ${RUN} or more words written twice; give each one home and embed it (D221):\n` +
      found.map(({ first, second, words }) => `  ${first} and ${second}: "${words}"`).join('\n'),
  )
}
console.log(`Overlap: ${documents.length} documents, no passage of ${RUN} or more words written twice (D221).`)
