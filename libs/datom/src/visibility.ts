import type { ConflictPolicy } from './catalog.ts'
import { indexCatalog, type Catalog } from './catalog.ts'
import { parentId } from './ids.ts'

export type StoredFact = {
  readonly e: string
  readonly a: string
  readonly v: string
  readonly op: 'assert' | 'retract'
  readonly cs: string
  readonly commitTx: string
  readonly memberTx: string
  readonly commitSeq: number
}

const byCommitThenMember = (
  left: StoredFact,
  right: StoredFact,
  direction: 'min' | 'max',
): number => {
  const commit =
    left.commitTx < right.commitTx ? -1 : left.commitTx > right.commitTx ? 1 : 0
  const member =
    left.memberTx < right.memberTx ? -1 : left.memberTx > right.memberTx ? 1 : 0
  const ordered = commit !== 0 ? commit : member
  return direction === 'min' ? ordered : -ordered
}

export const reduceAttribute = (
  facts: ReadonlyArray<StoredFact>,
  policy: ConflictPolicy,
): ReadonlyArray<StoredFact> => {
  if (facts.length === 0) return []
  if (policy === 'human-conflict') {
    return facts.filter((fact) => fact.op === 'assert')
  }
  const winner = facts.slice().sort((left, right) =>
    byCommitThenMember(
      left,
      right,
      policy === 'write-once' ? 'min' : 'max',
    ),
  )[0]
  if (!winner || winner.op === 'retract') return []
  return [winner]
}

export const factsByEntityAttr = (
  facts: ReadonlyArray<StoredFact>,
): Map<string, StoredFact[]> => {
  const grouped = new Map<string, StoredFact[]>()
  for (const fact of facts) {
    const key = `${fact.e}\0${fact.a}`
    const list = grouped.get(key)
    if (list) list.push(fact)
    else grouped.set(key, [fact])
  }
  return grouped
}

export const reduceAll = (
  facts: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): ReadonlyArray<StoredFact> => {
  const { byAttr } = indexCatalog(catalog)
  const grouped = factsByEntityAttr(facts)
  const reduced: StoredFact[] = []
  for (const group of grouped.values()) {
    const first = group[0]
    if (!first) continue
    const lookup = byAttr.get(first.a)
    const policy = lookup?.spec.policy ?? 'lww'
    reduced.push(...reduceAttribute(group, policy))
  }
  return reduced
}

const definingAsserted = (
  entity: string,
  reduced: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): boolean => {
  const { byDefining } = indexCatalog(catalog)
  return reduced.some(
    (fact) =>
      fact.e === entity &&
      fact.op === 'assert' &&
      byDefining.has(fact.a),
  )
}

const ownerOf = (
  entity: string,
  reduced: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): ReadonlyArray<string> => {
  const { byDefining } = indexCatalog(catalog)
  const type = reduced
    .filter((fact) => fact.e === entity && byDefining.has(fact.a))
    .map((fact) => byDefining.get(fact.a))
    .find((value) => value !== undefined)
  if (!type) {
    const parent = parentId(entity)
    return parent ? [parent] : []
  }
  if (type.composition === 'prefix') {
    const parent = parentId(entity)
    return parent ? [parent] : []
  }
  if (type.composition === 'reference' && type.ownerAttribute) {
    return reduced
      .filter(
        (fact) =>
          fact.e === entity &&
          fact.a === type.ownerAttribute &&
          fact.op === 'assert',
      )
      .map((fact) => fact.v)
  }
  return []
}

export const isVisible = (
  entity: string,
  reduced: ReadonlyArray<StoredFact>,
  catalog: Catalog,
  seen: Set<string> = new Set(),
): boolean => {
  if (parentId(entity) === null) return true
  if (seen.has(entity)) return false
  seen.add(entity)
  if (!definingAsserted(entity, reduced, catalog)) return false
  const owners = ownerOf(entity, reduced, catalog)
  if (owners.length === 0) return true
  return owners.some((owner) => isVisible(owner, reduced, catalog, seen))
}

export const visibleFacts = (
  facts: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): ReadonlyArray<StoredFact> => {
  const reduced = reduceAll(facts, catalog)
  return reduced.filter((fact) => isVisible(fact.e, reduced, catalog))
}
