/**
 * The evidence lockfile (D77): each owning producer's exact per-file coverage,
 * the coverage provider's identity, the registry digest, and the bundle-size
 * references. Only `pnpm verify baseline` writes it.
 */
import { createHash } from 'node:crypto'
import type { CoverageProducer } from '@viviefs/testing/vitest'
import type { RegistryEntry } from './file-treatments.ts'

export const LOCKFILE = 'evidence-baseline.json'

/** `covered/total`, as text so the lockfile diffs line by line. */
export type Count = `${number}/${number}`

export type Tuple = {
  readonly statements: Count
  readonly branches: Count
  readonly functions: Count
  readonly lines: Count
}

export type Provider = { readonly name: string; readonly package: string; readonly version: string }

/** A platform bundle at the last baseline; the lockfile's own history says which commit. */
export type BundleReference = {
  readonly recordedAt: string
  readonly hbcBytes: number
  readonly jsBytes: number | null
  readonly packages: Readonly<Record<string, number>>
}

export type Lockfile = {
  readonly notice: string
  readonly registryDigest: string
  readonly providers: Partial<Record<CoverageProducer, Provider>>
  readonly coverage: Partial<Record<CoverageProducer, Readonly<Record<string, Tuple>>>>
  readonly bundle: Readonly<Record<string, Readonly<Record<string, BundleReference>>>>
}

export const NOTICE =
  'Written by `pnpm verify baseline`. Do not edit by hand. Exact per-file coverage for each owning producer (D77).'

/** Istanbul's per-file coverage, as Vitest writes it to coverage-final.json. */
export type FileCoverage = {
  readonly statementMap: Readonly<Record<string, { readonly start: { readonly line: number } }>>
  readonly s: Readonly<Record<string, number>>
  readonly f: Readonly<Record<string, number>>
  readonly b: Readonly<Record<string, ReadonlyArray<number>>>
}

const count = (hits: ReadonlyArray<number>): Count => `${hits.filter((hit) => hit > 0).length}/${hits.length}`

export const tupleOf = (file: FileCoverage): Tuple => {
  const lines = new Map<number, number>()
  for (const [id, statement] of Object.entries(file.statementMap)) {
    const line = statement.start.line
    lines.set(line, Math.max(lines.get(line) ?? 0, file.s[id] ?? 0))
  }
  return {
    statements: count(Object.values(file.s)),
    branches: count(Object.values(file.b).flat()),
    functions: count(Object.values(file.f)),
    lines: count([...lines.values()]),
  }
}

export const METRICS = ['statements', 'branches', 'functions', 'lines'] as const

export const sameTuple = (left: Tuple, right: Tuple) =>
  METRICS.every((metric) => left[metric] === right[metric])

export const covered = (value: Count) => Number(value.split('/')[0])

export const uncovered = (value: Count) => Number(value.split('/')[1]) - covered(value)

export const formatTuple = (tuple: Tuple) =>
  METRICS.map((metric) => `${metric} ${tuple[metric]}`).join(', ')

/** A digest of the registry: changing a file treatment is a reviewed change. */
export const registryDigest = (registry: ReadonlyArray<RegistryEntry>) =>
  createHash('sha256')
    .update(JSON.stringify([...registry].sort((left, right) => left.path.localeCompare(right.path))))
    .digest('hex')

/** Stable JSON: object keys sorted, so the lockfile diffs cleanly. */
export const stableJson = (value: unknown): string =>
  `${JSON.stringify(
    value,
    (_key, inner: unknown) =>
      inner !== null && typeof inner === 'object' && !Array.isArray(inner)
        ? Object.fromEntries(Object.entries(inner).sort(([left], [right]) => left.localeCompare(right)))
        : inner,
    2,
  )}\n`
