/**
 * verify static / ownership: reads the projects, the production files and the
 * registry, and applies the rules in `ownership.ts` (ADR-0024, D76).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { SUITES } from '@viviefs/testing'
import { REGISTRY } from './evidence-registry.ts'
import { isProductionFile, projectProblems, registryProblems, type ProjectFile } from './ownership.ts'
import { ROOT, STAGES } from './stages.ts'

const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  cwd: ROOT,
})
  .split('\n')
  .filter((path) => path !== '' && existsSync(join(ROOT, path)))

const outside = (path: string) => /^(?:repos|vendor|\.agents)\//.test(path)

const read = (path: string) => {
  const absolute = join(ROOT, path)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined
}

const parse = (path: string): ProjectFile['parsed'] => {
  try {
    return JSON.parse(read(path) ?? '') as ProjectFile['parsed']
  } catch {
    return undefined
  }
}

type Targets = Record<string, { options?: { command?: string; commands?: ReadonlyArray<string> } }>

const projects = tracked
  .filter((path) => (path.endsWith('/project.json') || path === 'project.json') && !outside(path))
  .map((path) => ({ path, parsed: parse(path) }))

const workspacePackages = tracked.filter(
  (path) => path.endsWith('/package.json') && path !== 'package.json' && !outside(path),
)

const targetsOf = (projectJson: string): Targets =>
  ((parse(projectJson) as { targets?: Targets } | undefined)?.targets ?? {})

const projectOf = (path: string): string | undefined => {
  for (let dir = dirname(path); dir !== '.' && dir !== '/'; dir = dirname(dir)) {
    if (existsSync(join(ROOT, dir, 'project.json'))) return join(dir, 'project.json')
  }
  return undefined
}

const stepRuns = (stepName: string, path: string) => {
  const step = STAGES.flatMap((stage) => stage.steps).find(({ name }) => name === stepName)
  if (!step) return false
  return step.invocations.some(({ args }) => {
    if (args.includes(path)) return true
    const target = args[args.indexOf('-t') + 1]
    if (!args.includes('-t') || target === undefined) return false
    return projects.some(({ path: projectJson }) => {
      const options = targetsOf(projectJson)[target]?.options
      return [options?.command ?? '', ...(options?.commands ?? [])].some((command) => command.includes(path))
    })
  })
}

const gates = [...(read('tools/qualification/src/gates.ts') ?? '').matchAll(/gate: '(P\d\d)'/g)].map(
  (match) => match[1] ?? '',
)

const problems = [
  ...projectProblems(projects, workspacePackages),
  ...registryProblems(REGISTRY, {
    productionFiles: tracked.filter(isProductionFile),
    source: read,
    gates,
    suites: SUITES.map(({ id }) => id),
    stepRuns,
    projectTargets: (path) => {
      const projectJson = projectOf(path)
      return projectJson ? Object.keys(targetsOf(projectJson)) : []
    },
  }),
]

if (problems.length > 0) {
  throw new Error(`Ownership is incomplete:\n${problems.map((line) => `  ${line}`).join('\n')}`)
}

const counts = new Map<string, number>()
for (const { treatment } of REGISTRY) counts.set(treatment, (counts.get(treatment) ?? 0) + 1)
console.log(
  `Ownership: ${projects.length} projects tagged; ${REGISTRY.length} production files classified (` +
    [...counts].map(([treatment, count]) => `${treatment} ${count}`).join(', ') +
    ').',
)
