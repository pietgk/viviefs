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

/** Everything visibility asks of the reduced facts, indexed by entity. */
export type VisibilityIndex = {
  readonly factsOf: (entity: string) => ReadonlyArray<StoredFact>
  readonly isVisible: (entity: string) => boolean
  /** The entities given and every entity whose visibility depends on one. */
  readonly withDependents: (
    entities: ReadonlyArray<string>,
  ) => ReadonlySet<string>
}

export const visibilityIndex = (
  reduced: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): VisibilityIndex => {
  const { byDefining } = indexCatalog(catalog)
  const byEntity = new Map<string, StoredFact[]>()
  for (const fact of reduced) {
    const list = byEntity.get(fact.e)
    if (list) list.push(fact)
    else byEntity.set(fact.e, [fact])
  }
  const factsOf = (entity: string): ReadonlyArray<StoredFact> =>
    byEntity.get(entity) ?? []

  const ownersOf = (entity: string): ReadonlyArray<string> => {
    const facts = factsOf(entity)
    const type = facts
      .map((fact) => byDefining.get(fact.a))
      .find((value) => value !== undefined)
    if (type?.composition === 'reference' && type.ownerAttribute) {
      return facts
        .filter((fact) => fact.a === type.ownerAttribute && fact.op === 'assert')
        .map((fact) => fact.v)
    }
    if (type && type.composition !== 'prefix') return []
    const parent = parentId(entity)
    return parent ? [parent] : []
  }

  const visible = (entity: string, seen: Set<string>): boolean => {
    if (parentId(entity) === null) return true
    if (seen.has(entity)) return false
    seen.add(entity)
    const asserted = factsOf(entity).some(
      (fact) => fact.op === 'assert' && byDefining.has(fact.a),
    )
    if (!asserted) return false
    const owners = ownersOf(entity)
    if (owners.length === 0) return true
    return owners.some((owner) => visible(owner, seen))
  }

  const withDependents = (entities: ReadonlyArray<string>) => {
    const dependents = new Map<string, string[]>()
    const linked = new Set<string>()
    const link = (entity: string) => {
      if (linked.has(entity)) return
      linked.add(entity)
      for (const owner of ownersOf(entity)) {
        const list = dependents.get(owner)
        if (list) list.push(entity)
        else dependents.set(owner, [entity])
        link(owner)
      }
    }
    for (const entity of byEntity.keys()) link(entity)
    const found = new Set(entities)
    for (const entity of found) {
      for (const dependent of dependents.get(entity) ?? []) found.add(dependent)
    }
    return found
  }

  return {
    factsOf,
    isVisible: (entity) => visible(entity, new Set()),
    withDependents,
  }
}

export const isVisible = (
  entity: string,
  reduced: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): boolean => visibilityIndex(reduced, catalog).isVisible(entity)

export const visibleFacts = (
  facts: ReadonlyArray<StoredFact>,
  catalog: Catalog,
): ReadonlyArray<StoredFact> => {
  const reduced = reduceAll(facts, catalog)
  const index = visibilityIndex(reduced, catalog)
  return reduced.filter((fact) => index.isVisible(fact.e))
}
