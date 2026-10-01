/**
 * verify static / ownership (ADR-0024, D76). Every Nx project declares a kind
 * tag, and every production file has exactly one registry entry whose shape
 * its file treatment allows. Pure over injected data; `check-ownership.ts`
 * reads the repository and runs it.
 */
import {
  BUILD_STEPS,
  FILE_TREATMENTS,
  isNamedSlot,
  isReExportOnly,
  isTypeOnly,
  type RegistryEntry,
} from './file-treatments.ts'

const KIND_TAGS = ['kind:app', 'kind:feature', 'kind:lib', 'kind:tool'] as const

/** Tests, stories and test configs are evidence, not subjects. */
const EVIDENCE_FILE = /\.(?:test|spec|stories)\.[cm]?[jt]sx?$|(?:^|\/)vitest[^/]*\.config\.ts$/

/** A production file: source under a project kind's directory that is not evidence. */
export const isProductionFile = (path: string) =>
  /^(?:apps|features|libs|tools)\//.test(path) &&
  /\.(?:[cm]?[jt]sx?)$/.test(path) &&
  !EVIDENCE_FILE.test(path)

export type ProjectFile = {
  readonly path: string
  readonly parsed: { readonly tags?: ReadonlyArray<string>; readonly metadata?: Record<string, unknown> } | undefined
}

export const projectProblems = (
  projects: ReadonlyArray<ProjectFile>,
  workspacePackages: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  const problems: string[] = []
  if (projects.length === 0) problems.push('No project.json files are tracked.')
  const projectDirs = new Set(projects.map(({ path }) => path.replace(/\/?project\.json$/, '')))
  for (const pkg of workspacePackages) {
    if (!projectDirs.has(pkg.replace(/\/package\.json$/, ''))) {
      problems.push(`${pkg} has no sibling project.json. Every workspace package must declare tags.`)
    }
  }
  for (const { path, parsed } of projects) {
    if (parsed === undefined) {
      problems.push(`${path} is not valid JSON.`)
      continue
    }
    const tags = parsed.tags ?? []
    if (tags.length === 0) problems.push(`${path} has no tags.`)
    else if (!tags.some((tag) => (KIND_TAGS as ReadonlyArray<string>).includes(tag))) {
      problems.push(`${path} has no kind: tag (need one of ${KIND_TAGS.join(', ')}).`)
    }
    if (parsed.metadata && 'evidenceOwner' in parsed.metadata) {
      problems.push(`${path} declares metadata.evidenceOwner; evidence is owned per file in the registry (D76).`)
    }
  }
  return problems
}

export type RegistryContext = {
  readonly productionFiles: ReadonlyArray<string>
  /** Contents of a repository file, or undefined when it does not exist. */
  readonly source: (path: string) => string | undefined
  readonly gates: ReadonlyArray<string>
  readonly suites: ReadonlyArray<string>
  /** Whether this verify step exists and runs the file as a process. */
  readonly stepRuns: (step: string, path: string) => boolean
  /** Nx targets of the project the file belongs to. */
  readonly projectTargets: (path: string) => ReadonlyArray<string>
}

const TARGET_FOR_BUILD_STEP: Record<(typeof BUILD_STEPS)[number], string> = {
  docs: 'build',
  build: 'build',
  'bundle-size': 'bundle-size',
}

const shapeProblem = (entry: RegistryEntry, context: RegistryContext): string | undefined => {
  const source = context.source(entry.path) ?? ''
  switch (entry.treatment) {
    case 're-export':
      return isReExportOnly(source) ? undefined : 'is re-export but has statements other than `export ... from`'
    case 'type-only':
      return isTypeOnly(source, entry.path) ? undefined : 'is type-only but emits runtime code'
    case 'named-slot':
      return isNamedSlot(source) ? undefined : 'is a named slot but is not `export {}`; classify its code'
    case 'device':
    case 'qualify-only':
      return context.gates.includes(entry.gate) ? undefined : `names gate ${entry.gate}, which is not in the gate table`
    case 'rendered-ui':
      return context.source(entry.stories) !== undefined ? undefined : `names stories ${entry.stories}, which do not exist`
    case 'build-step': {
      if (!(BUILD_STEPS as ReadonlyArray<string>).includes(entry.step)) return `names build step ${entry.step}`
      const target = TARGET_FOR_BUILD_STEP[entry.step]
      return context.projectTargets(entry.path).includes(target)
        ? undefined
        : `names the ${entry.step} step, but its project has no ${target} target`
    }
    case 'process-entry':
      if ('test' in entry.runBy) {
        const { test } = entry.runBy
        return /\.test\.tsx?$/.test(test) && context.source(test) !== undefined
          ? undefined
          : `names test ${test}, which does not exist`
      }
      return context.stepRuns(entry.runBy.step, entry.path)
        ? undefined
        : `names verify step ${entry.runBy.step}, which does not run it`
    case 'node-unit':
    case 'node-integration': {
      const unknown = (entry.suites ?? []).filter((suite) => !context.suites.includes(suite))
      return unknown.length === 0 ? undefined : `names unknown suites ${unknown.join(', ')}`
    }
    case 'test-support':
      return undefined
  }
}

export const registryProblems = (
  registry: ReadonlyArray<RegistryEntry>,
  context: RegistryContext,
): ReadonlyArray<string> => {
  const problems: string[] = []
  const seen = new Map<string, number>()
  for (const { path } of registry) seen.set(path, (seen.get(path) ?? 0) + 1)
  for (const [path, count] of seen) {
    if (count > 1) problems.push(`${path}: ${count} registry entries; a file has exactly one`)
  }
  const files = new Set(context.productionFiles)
  for (const path of context.productionFiles) {
    if (!seen.has(path)) {
      problems.push(`${path}: no registry entry. Classify it in tools/verify/src/evidence-registry.ts`)
    }
  }
  for (const entry of registry) {
    if (!files.has(entry.path)) {
      problems.push(`${entry.path}: registry entry has no production file`)
      continue
    }
    if (!(entry.treatment in FILE_TREATMENTS)) {
      problems.push(`${entry.path}: unknown file treatment ${String(entry.treatment)}`)
      continue
    }
    if (entry.rationale.trim() === '') problems.push(`${entry.path}: a rationale is required`)
    const shape = shapeProblem(entry, context)
    if (shape) problems.push(`${entry.path}: ${entry.treatment} ${shape}`)
  }
  return problems
}
