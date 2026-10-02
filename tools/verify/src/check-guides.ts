/**
 * verify quality / guides: reads the guide template, the guides, the ADRs,
 * the projects and the exercise tracks, and applies the rules in `guides.ts`
 * (D62, D63, D66, D67, D81-D86).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATTERNS } from '@viviefs/testing'
import { guideProblems } from './guides.ts'
import { ROOT } from './stages.ts'

const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  cwd: ROOT,
})
  .split('\n')
  .filter((path) => path !== '' && !/^(?:repos|vendor|\.agents)\//.test(path) && existsSync(join(ROOT, path)))

const read = (path: string) => {
  const absolute = join(ROOT, path)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined
}

const gates = [...(read('tools/qualification/src/gates.ts') ?? '').matchAll(/gate: '(P\d\d)'/g)].map(
  (match) => match[1] ?? '',
)

const problems = guideProblems({ paths, read, gates, patterns: PATTERNS })

if (problems.length > 0) {
  throw new Error(`${problems.length} guide problem(s):\n${problems.map((line) => `  ${line}`).join('\n')}`)
}

const guides = new Set(
  paths.flatMap((path) => /^apps\/docs\/src\/content\/docs\/guides\/([^/]+)\//.exec(path)?.[1] ?? []),
)
console.log(`Guides: ${guides.size} in the template's shape; statuses, exemplar links and exercise tracks agree.`)
