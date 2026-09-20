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

/**
 * Journal path segments encode `/` so `DurableClock/wait` cannot look like
 * another composition level. Separator `/` stays the id tree delimiter (D38).
 */
export const encodeIdSegment = (value: string): string =>
  value.replace(/~/g, '~~').replace(/\//g, '~')

export const decodeIdSegment = (value: string): string => {
  let out = ''
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (char === '~') {
      const next = value[index + 1]
      if (next === '~') {
        out += '~'
        index += 1
      } else {
        out += '/'
      }
    } else {
      out += char
    }
  }
  return out
}

export const executionId = (org: string, exec: string): string =>
  `${orgId(org)}/W${encodeIdSegment(exec)}`

export const activityId = (
  org: string,
  exec: string,
  name: string,
  attempt: number,
): string =>
  `${executionId(org, exec)}/A${encodeIdSegment(name)}#${attempt}`

export const deferredId = (org: string, exec: string, name: string): string =>
  `${executionId(org, exec)}/D${encodeIdSegment(name)}`

export const clockId = (org: string, exec: string, name: string): string =>
  `${executionId(org, exec)}/C${encodeIdSegment(name)}`

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
