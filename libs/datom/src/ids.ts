/**
 * Strict-composition ids (D38). Parent lives in the id only when the child
 * cannot move. Separator `/`. Organization is the isolation root `O{org}`.
 */

export const orgId = (org: string): string => `O${org}`

export const listId = (org: string, list: string): string =>
  `${orgId(org)}/L${list}`

export const itemId = (org: string, list: string, item: string): string =>
  `${listId(org, list)}/I${item}`

export const evidenceId = (org: string, evidence: string): string =>
  `${orgId(org)}/E${evidence}`

export const parentId = (entity: string): string | null => {
  const index = entity.lastIndexOf('/')
  if (index <= 0) return null
  return entity.slice(0, index)
}

export const ancestorIds = (entity: string): ReadonlyArray<string> => {
  const ids: string[] = [entity]
  let current: string | null = entity
  while (current) {
    const parent = parentId(current)
    if (!parent) break
    ids.push(parent)
    current = parent
  }
  return ids
}

/** Entity id plus each ancestor, and each of those with a trailing `/`. */
export const ancestorPrefixes = (entity: string): ReadonlyArray<string> => {
  const ids = ancestorIds(entity)
  return [...ids, ...ids.map((id) => `${id}/`)]
}

export const underPrefix = (entity: string, prefix: string): boolean => {
  if (entity === prefix) return true
  const withSlash = prefix.endsWith('/') ? prefix : `${prefix}/`
  return entity.startsWith(withSlash)
}
