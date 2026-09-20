import { ancestorPrefixes } from './ids.ts'

export type ReactivityKeys = ReadonlyArray<string>

const unique = (values: ReadonlyArray<string>): ReadonlyArray<string> => [
  ...new Set(values),
]

/** Prefix keys (entity + ancestors) and attribute keys for D42 invalidation. */
export const keysFor = (
  entityIds: ReadonlyArray<string>,
  attributes: ReadonlyArray<string>,
): ReactivityKeys =>
  unique([
    ...entityIds.flatMap((entity) =>
      ancestorPrefixes(entity).map((prefix) => `prefix:${prefix}`),
    ),
    ...attributes.map((attribute) => `attribute:${attribute}`),
  ])

export const keysOverlap = (
  declared: ReactivityKeys,
  invalidated: ReactivityKeys,
): boolean => {
  const set = new Set(invalidated)
  return declared.some((key) => set.has(key))
}
