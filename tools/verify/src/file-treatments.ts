/**
 * File treatments (D75, D76): how one production file's behaviour is shown
 * in `verify`. Each names the verify step that produces its evidence and the
 * verdict applied to it. The registry (`evidence-registry.ts`) gives every
 * production file exactly one, with a written rationale.
 */
import ts from 'typescript'
import type { SuiteId } from '@viviefs/testing'
import type { CoverageProducer } from '@viviefs/testing/vitest'

export const FILE_TREATMENTS = {
  'node-unit': {
    step: 'unit',
    verdict: 'exact coverage',
    when: 'runtime logic proven in-process in Node, no real store or server needed',
  },
  'node-integration': {
    step: 'integration',
    verdict: 'exact coverage',
    when: 'proving it needs a real store (sqlite-node, PGlite) or an HTTP server',
  },
  'rendered-ui': {
    step: 'storybook',
    verdict: 'stories ran',
    when: 'a rendered component',
  },
  'process-entry': {
    step: 'the named test or verify step',
    verdict: 'runs as a process',
    when: 'its contract is a process (a CLI, a main); logic lives in other modules',
  },
  'test-support': {
    step: 'the named coverage producer',
    verdict: 'reached',
    when: 'a suite, fake or harness',
  },
  'build-step': {
    step: 'the named verify step',
    verdict: 'the step builds its project',
    when: 'loaded by a build tool (Astro, Metro, Babel)',
  },
  device: {
    step: 'typecheck, lint',
    verdict: 'gate named',
    when: 'it needs a device or browser runtime and does not load in Node',
  },
  'qualify-only': {
    step: 'typecheck, lint',
    verdict: 'gate named',
    when: 'only qualify runs it: a lab or device driver, or a gate runner',
  },
  're-export': {
    step: 'ownership',
    verdict: 'statically checked',
    when: 'it only re-exports',
  },
  'type-only': {
    step: 'typecheck',
    verdict: 'statically checked',
    when: 'a declaration file (`.d.ts`)',
  },
  'named-slot': {
    step: 'ownership',
    verdict: 'statically checked',
    when: 'an empty named slot (`export {}`)',
  },
} as const

export type FileTreatment = keyof typeof FILE_TREATMENTS

/** Verify steps a build-step file can name: each builds its project. */
export const BUILD_STEPS = ['docs', 'build', 'bundle-size'] as const

type Entry<T extends FileTreatment, Extra = unknown> = {
  readonly path: string
  readonly treatment: T
  readonly rationale: string
} & Extra

export type RegistryEntry =
  | Entry<'node-unit' | 'node-integration', { readonly suites?: ReadonlyArray<SuiteId> }>
  | Entry<'rendered-ui', { readonly stories: string }>
  | Entry<'process-entry', { readonly runBy: { readonly test: string } | { readonly step: string } }>
  | Entry<'test-support', { readonly producer: CoverageProducer }>
  | Entry<'build-step', { readonly step: (typeof BUILD_STEPS)[number] }>
  | Entry<'device' | 'qualify-only', { readonly gate: `P${number}` }>
  | Entry<'re-export' | 'type-only' | 'named-slot'>

/** The coverage producer whose map holds a file's evidence, if any. */
export const owningProducer = (entry: RegistryEntry): CoverageProducer | undefined => {
  switch (entry.treatment) {
    case 'node-unit':
      return 'unit'
    case 'node-integration':
      return 'integration'
    case 'rendered-ui':
      return 'storybook'
    case 'test-support':
      return entry.producer
    default:
      return undefined
  }
}

/** Whether the owning producer's tuple is judged exactly against the lockfile. */
export const hasExactCoverage = (entry: RegistryEntry) =>
  entry.treatment === 'node-unit' || entry.treatment === 'node-integration'

const statementsOf = (source: string, path = 'file.ts') =>
  ts.createSourceFile(path, source, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX)
    .statements

const isReExport = (statement: ts.Statement) =>
  ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined

/** True when every statement is `export ... from '...'`. */
export const isReExportOnly = (source: string) => {
  const statements = statementsOf(source)
  return statements.length > 0 && statements.every(isReExport)
}

/** True when the file declares types only and emits no runtime code. */
export const isTypeOnly = (source: string, path = 'file.ts') => {
  const statements = statementsOf(source, path)
  if (path.endsWith('.d.ts')) return true
  return (
    statements.length > 0 &&
    statements.every(
      (statement) =>
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly === true) ||
        (ts.isExportDeclaration(statement) && statement.isTypeOnly),
    )
  )
}

/** True when the file is `export {}` and comments only. */
export const isNamedSlot = (source: string) => {
  const statements = statementsOf(source)
  const [only] = statements
  return (
    statements.length === 1 &&
    only !== undefined &&
    ts.isExportDeclaration(only) &&
    only.moduleSpecifier === undefined &&
    only.exportClause !== undefined &&
    ts.isNamedExports(only.exportClause) &&
    only.exportClause.elements.length === 0
  )
}
