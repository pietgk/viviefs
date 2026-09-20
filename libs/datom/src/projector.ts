import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Reactivity from 'effect/unstable/reactivity/Reactivity'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import { HlcClock } from './clock.ts'
import {
  indexCatalog,
  type Catalog,
} from './catalog.ts'
import { CHANGESET_TTL_MS, Attr, isSystemAttr } from './vocabulary.ts'
import { decodeHlc } from './hlc.ts'
import { ancestorPrefixes, parentId, underPrefix } from './ids.ts'
import { keysFor, type ReactivityKeys } from './keys.ts'
import { LogStore } from './log-store.ts'
import {
  changesetMembers,
  decodeCommit,
  encodeConflict,
  hashMembers,
  type CommitManifest,
} from './manifest.ts'
import { migrateReadModels } from './read-models.ts'
import type { Datom, StoredDatom } from './schema.ts'
import {
  isVisible,
  reduceAll,
  visibleFacts,
  type StoredFact,
} from './visibility.ts'

export type ChangesetStatusName =
  | 'open'
  | 'committed'
  | 'aborted'
  | 'expired'
  | 'rejected'

export type ProjectedFact = StoredFact

export type ConflictRow = {
  readonly e: string
  readonly a: string
  readonly payload: string
  readonly tx: string
  readonly cs: string
}

export type StatusRow = {
  readonly cs: string
  readonly status: ChangesetStatusName
  readonly commitTx: string | null
  readonly basis: number | null
  readonly actor: string
}

export type ProjectResult = {
  readonly applied: number
  readonly open: number
  readonly rejected: number
  readonly expired: number
  readonly aborted: number
  readonly keys: ReactivityKeys
}

export type FactQuery = {
  readonly view: 'committed' | 'draft'
  readonly actor?: string
  readonly prefix?: string
}

const asSeq = (value: unknown): number => Number(value)

const unique = (values: ReadonlyArray<string>): string[] => [...new Set(values)]

const earliestPt = (datoms: ReadonlyArray<Datom>): number => {
  let min = Number.POSITIVE_INFINITY
  for (const datom of datoms) {
    const parts = decodeHlc(datom.tx)
    if (parts && parts.pt < min) min = parts.pt
  }
  return min
}

const ptOf = (tx: string): number => decodeHlc(tx)?.pt ?? 0

const readFact = (row: {
  e: string
  a: string
  v: string
  op: string
  cs: string
  commit_tx: string
  member_tx: string
  commit_seq: unknown
}): StoredFact => ({
  e: row.e,
  a: row.a,
  v: row.v,
  op: row.op === 'retract' ? 'retract' : 'assert',
  cs: row.cs,
  commitTx: row.commit_tx,
  memberTx: row.member_tx,
  commitSeq: asSeq(row.commit_seq),
})

const overlayDraft = (
  committed: ReadonlyArray<StoredFact>,
  members: ReadonlyArray<Datom>,
  catalog: Catalog,
): StoredFact[] => {
  const { byAttr } = indexCatalog(catalog)
  const grouped = new Map<string, StoredFact[]>()
  for (const fact of committed) {
    const key = `${fact.e}\0${fact.a}`
    const list = grouped.get(key)
    if (list) list.push(fact)
    else grouped.set(key, [fact])
  }
  const sorted = members.slice().sort((left, right) =>
    left.tx < right.tx ? -1 : left.tx > right.tx ? 1 : 0,
  )
  for (const member of sorted) {
    const key = `${member.e}\0${member.a}`
    const asFact: StoredFact = {
      e: member.e,
      a: member.a,
      v: member.v,
      op: member.op,
      cs: member.cs,
      commitTx: member.tx,
      memberTx: member.tx,
      commitSeq: Number.MAX_SAFE_INTEGER,
    }
    const policy = byAttr.get(member.a)?.spec.policy ?? 'lww'
    if (policy === 'human-conflict' && member.op === 'assert') {
      const list = grouped.get(key) ?? []
      list.push(asFact)
      grouped.set(key, list)
    } else {
      grouped.set(key, [asFact])
    }
  }
  return [...grouped.values()].flat()
}

const canonicalSnapshot = (
  facts: ReadonlyArray<StoredFact>,
  conflicts: ReadonlyArray<ConflictRow>,
  statuses: ReadonlyArray<StatusRow>,
): string =>
  JSON.stringify({
    facts: [...facts].sort((left, right) =>
      left.e !== right.e
        ? left.e.localeCompare(right.e)
        : left.a !== right.a
          ? left.a.localeCompare(right.a)
          : left.v !== right.v
            ? left.v.localeCompare(right.v)
            : left.cs.localeCompare(right.cs),
    ),
    conflicts: [...conflicts].sort((left, right) =>
      left.e !== right.e
        ? left.e.localeCompare(right.e)
        : left.a !== right.a
          ? left.a.localeCompare(right.a)
          : left.tx.localeCompare(right.tx),
    ),
    statuses: [...statuses].sort((left, right) => left.cs.localeCompare(right.cs)),
  })

export class Projector extends Context.Service<
  Projector,
  {
    readonly project: () => Effect.Effect<ProjectResult, SqlError>
    readonly rebuild: () => Effect.Effect<ProjectResult, SqlError>
    readonly facts: (
      query: FactQuery,
    ) => Effect.Effect<ReadonlyArray<ProjectedFact>, SqlError>
    readonly conflicts: () => Effect.Effect<ReadonlyArray<ConflictRow>, SqlError>
    readonly statuses: () => Effect.Effect<ReadonlyArray<StatusRow>, SqlError>
    readonly snapshot: () => Effect.Effect<string, SqlError>
    readonly lastKeys: () => ReactivityKeys
  }
>()('viviefs/datom/Projector') {}

const makeProjector = (catalog: Catalog) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const store = yield* LogStore
    const clock = yield* HlcClock
    const reactivity = yield* Reactivity.Reactivity
    yield* migrateReadModels
    const indexed = indexCatalog(catalog)
    let lastKeys: ReactivityKeys = []

    const loadCursor = Effect.fn(function* () {
      const rows = yield* sql<{ seq: unknown }>`
        SELECT seq FROM projection_cursor WHERE id = 1
      `
      return rows[0] ? asSeq(rows[0].seq) : 0
    })

    const saveCursor = (seq: number) =>
      sql`
        INSERT INTO projection_cursor (id, seq) VALUES (1, ${seq})
        ON CONFLICT (id) DO UPDATE SET seq = ${seq}
      `

    const loadAllFacts = Effect.fn(function* () {
      const rows = yield* sql<{
        e: string
        a: string
        v: string
        op: string
        cs: string
        commit_tx: string
        member_tx: string
        commit_seq: unknown
      }>`
        SELECT e, a, v, op, cs, commit_tx, member_tx, commit_seq
        FROM projected_facts
      `
      return rows.map(readFact)
    })

    const loadFactsFor = (entity: string, attribute: string) =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          e: string
          a: string
          v: string
          op: string
          cs: string
          commit_tx: string
          member_tx: string
          commit_seq: unknown
        }>`
          SELECT e, a, v, op, cs, commit_tx, member_tx, commit_seq
          FROM projected_facts
          WHERE e = ${entity} AND a = ${attribute}
        `
        return rows.map(readFact)
      })

    const loadStatuses = Effect.fn(function* () {
      const rows = yield* sql<{
        cs: string
        status: string
        commit_tx: string | null
        basis: unknown
        actor: string
      }>`SELECT cs, status, commit_tx, basis, actor FROM changeset_status`
      return rows.map(
        (row): StatusRow => ({
          cs: row.cs,
          status: row.status as ChangesetStatusName,
          commitTx: row.commit_tx,
          basis: row.basis == null ? null : asSeq(row.basis),
          actor: row.actor,
        }),
      )
    })

    const loadOpen = Effect.fn(function* () {
      const rows = yield* sql<{ cs: string }>`
        SELECT cs FROM changeset_status WHERE status = 'open'
      `
      return rows.map((row) => row.cs)
    })

    const loadStatus = (cs: string) =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          cs: string
          status: string
          commit_tx: string | null
          basis: unknown
          actor: string
        }>`
          SELECT cs, status, commit_tx, basis, actor
          FROM changeset_status WHERE cs = ${cs}
        `
        const row = rows[0]
        if (!row) return null
        return {
          cs: row.cs,
          status: row.status as ChangesetStatusName,
          commitTx: row.commit_tx,
          basis: row.basis == null ? null : asSeq(row.basis),
          actor: row.actor,
        } satisfies StatusRow
      })

    const upsertStatus = (row: StatusRow) =>
      sql`
        INSERT INTO changeset_status (cs, status, commit_tx, basis, actor)
        VALUES (
          ${row.cs},
          ${row.status},
          ${row.commitTx},
          ${row.basis},
          ${row.actor}
        )
        ON CONFLICT (cs) DO UPDATE SET
          status = ${row.status},
          commit_tx = ${row.commitTx},
          basis = ${row.basis},
          actor = ${row.actor}
      `

    const loadEnvelopeActor = (cs: string) =>
      Effect.gen(function* () {
        const rows = yield* sql<{ actor: string }>`
          SELECT actor FROM changesets WHERE cs = ${cs}
        `
        return rows[0]?.actor ?? 'unknown'
      })

    const loadDatomsForCs = (cs: string) =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          seq: unknown
          e: string
          a: string
          v: string
          tx: string
          op: string
          cs: string
        }>`
          SELECT seq, e, a, v, tx, op, cs FROM datoms WHERE cs = ${cs} ORDER BY tx
        `
        return rows.map(
          (row): StoredDatom => ({
            seq: asSeq(row.seq),
            e: row.e,
            a: row.a,
            v: row.v,
            tx: row.tx as StoredDatom['tx'],
            op: row.op === 'retract' ? 'retract' : 'assert',
            cs: row.cs,
          }),
        )
      })

    const loadConflicts = Effect.fn(function* () {
      const rows = yield* sql<{
        e: string
        a: string
        payload: string
        tx: string
        cs: string
      }>`SELECT e, a, payload, tx, cs FROM projection_conflicts`
      return rows
    })

    const insertFact = (fact: StoredFact) =>
      sql`
        INSERT INTO projected_facts (
          e, a, v, op, cs, commit_tx, member_tx, commit_seq
        ) VALUES (
          ${fact.e},
          ${fact.a},
          ${fact.v},
          ${fact.op},
          ${fact.cs},
          ${fact.commitTx},
          ${fact.memberTx},
          ${fact.commitSeq}
        )
        ON CONFLICT (e, a, v, cs) DO NOTHING
      `

    const insertConflict = (row: ConflictRow) =>
      sql`
        INSERT INTO projection_conflicts (e, a, payload, tx, cs)
        VALUES (${row.e}, ${row.a}, ${row.payload}, ${row.tx}, ${row.cs})
        ON CONFLICT (e, a, tx) DO NOTHING
      `

    const clearReadModels = Effect.gen(function* () {
      yield* sql`DELETE FROM projected_facts`
      yield* sql`DELETE FROM projection_conflicts`
      yield* sql`DELETE FROM changeset_status`
      yield* sql`DELETE FROM projection_cursor`
    })

    type Ready = {
      readonly cs: string
      readonly actor: string
      readonly members: ReadonlyArray<StoredDatom>
      readonly commitTx: string
      readonly commitSeq: number
      readonly basis: number
    }

    type Evaluated =
      | { readonly kind: 'open'; readonly actor: string }
      | { readonly kind: 'aborted'; readonly actor: string; readonly commitTx: string }
      | { readonly kind: 'expired'; readonly actor: string }
      | { readonly kind: 'rejected'; readonly actor: string }
      | { readonly kind: 'ready'; readonly ready: Ready }

    const evaluate = (
      cs: string,
      datoms: ReadonlyArray<StoredDatom>,
      actor: string,
    ): Effect.Effect<Evaluated, SqlError> =>
      Effect.gen(function* () {
        const members = changesetMembers(datoms) as ReadonlyArray<StoredDatom>
        const commitDatom = datoms.find((datom) => datom.a === Attr.changesetCommit)
        const abortDatom = datoms.find((datom) => datom.a === Attr.changesetAbort)
        const now = clock.wallMs()
        const firstPt = earliestPt(members.length > 0 ? members : datoms)
        const expiredByClock =
          Number.isFinite(firstPt) && now > firstPt + CHANGESET_TTL_MS

        if (abortDatom && commitDatom) {
          if (abortDatom.tx < commitDatom.tx) {
            return { kind: 'aborted', actor, commitTx: abortDatom.tx }
          }
        } else if (abortDatom && !commitDatom) {
          return { kind: 'aborted', actor, commitTx: abortDatom.tx }
        }

        const selfCommitted =
          members.length === 1 &&
          members[0] !== undefined &&
          members[0].cs === members[0].tx &&
          !commitDatom

        if (selfCommitted && members[0]) {
          return {
            kind: 'ready',
            ready: {
              cs,
              actor,
              members,
              commitTx: members[0].tx,
              commitSeq: members[0].seq,
              basis: Math.max(0, members[0].seq - 1),
            },
          }
        }

        if (commitDatom) {
          if (ptOf(commitDatom.tx) > firstPt + CHANGESET_TTL_MS) {
            return { kind: 'expired', actor }
          }
          const manifest: CommitManifest | null = decodeCommit(commitDatom.v)
          if (!manifest) return { kind: 'rejected', actor }
          if (members.length !== manifest.n) {
            return expiredByClock
              ? { kind: 'expired', actor }
              : { kind: 'open', actor }
          }
          const hashed = yield* hashMembers(members).pipe(Effect.result)
          if (hashed._tag === 'Failure') return { kind: 'rejected', actor }
          if (hashed.success !== manifest.hash) return { kind: 'rejected', actor }
          return {
            kind: 'ready',
            ready: {
              cs,
              actor,
              members,
              commitTx: commitDatom.tx,
              commitSeq: commitDatom.seq,
              basis: manifest.basis,
            },
          }
        }

        if (expiredByClock) return { kind: 'expired', actor }
        return { kind: 'open', actor }
      })

    const applyReady = (ready: Ready) =>
      Effect.gen(function* () {
        const touchedEntities: string[] = []
        const touchedAttrs: string[] = []
        const conflicts: ConflictRow[] = []
        const all = yield* loadAllFacts()
        const reduced = reduceAll(all, catalog)

        for (const member of ready.members) {
          const lookup = indexed.byAttr.get(member.a)
          if (!lookup) return 'rejected' as const
          touchedEntities.push(member.e)
          touchedAttrs.push(member.a)

          const existing = yield* loadFactsFor(member.e, member.a)
          const other = existing.filter((fact) => fact.cs !== ready.cs)
          const afterBasis = other.filter((fact) => fact.commitSeq > ready.basis)

          if (lookup.spec.policy === 'write-once' && other.length > 0) {
            return 'rejected' as const
          }
          if (lookup.spec.policy === 'human-conflict' && afterBasis.length > 0) {
            conflicts.push({
              e: member.e,
              a: member.a,
              tx: ready.commitTx,
              cs: ready.cs,
              payload: encodeConflict({
                e: member.e,
                a: member.a,
                kind: 'concurrent',
                values: [
                  ...afterBasis.map((fact) => ({
                    v: fact.v,
                    cs: fact.cs,
                    commitTx: fact.commitTx,
                  })),
                  {
                    v: member.v,
                    cs: member.cs,
                    commitTx: ready.commitTx,
                  },
                ],
                owner: null,
              }),
            })
          }

          if (lookup.type.userContent) {
            const owner: string | null =
              lookup.type.composition === 'prefix'
                ? parentId(member.e)
                : lookup.type.ownerAttribute &&
                    member.a === lookup.type.ownerAttribute
                  ? member.v
                  : lookup.type.ownerAttribute
                    ? (ready.members.find(
                        (row) => row.a === lookup.type.ownerAttribute,
                      )?.v ??
                      (yield* loadFactsFor(
                        member.e,
                        lookup.type.ownerAttribute,
                      ))
                        .filter((fact) => fact.op === 'assert')
                        .sort((left, right) =>
                          left.commitTx < right.commitTx ? 1 : -1,
                        )[0]?.v ??
                      parentId(member.e))
                    : parentId(member.e)
            if (owner && !isVisible(owner, reduced, catalog)) {
              conflicts.push({
                e: member.e,
                a: lookup.type.ownerAttribute ?? Attr.evidenceOwner,
                tx: ready.commitTx,
                cs: ready.cs,
                payload: encodeConflict({
                  e: member.e,
                  a: lookup.type.ownerAttribute ?? Attr.evidenceOwner,
                  kind: 'orphan',
                  values: [
                    { v: owner, cs: ready.cs, commitTx: ready.commitTx },
                  ],
                  owner,
                }),
              })
            }
          }
        }

        for (const row of conflicts) {
          yield* insertConflict(row)
        }
        for (const member of ready.members) {
          yield* insertFact({
            e: member.e,
            a: member.a,
            v: member.v,
            op: member.op,
            cs: ready.cs,
            commitTx: ready.commitTx,
            memberTx: member.tx,
            commitSeq: ready.commitSeq,
          })
        }
        return { touchedEntities, touchedAttrs }
      })

    const project = Effect.fn('Projector.project')(function* () {
      const cursor = yield* loadCursor()
      const incoming = yield* store.streamFrom(cursor)
      const csIds = new Set<string>(incoming.map((row) => row.cs))
      for (const cs of yield* loadOpen()) csIds.add(cs)
      let maxSeq = cursor
      for (const row of incoming) {
        if (row.seq > maxSeq) maxSeq = row.seq
      }

      const counts = {
        applied: 0,
        open: 0,
        rejected: 0,
        expired: 0,
        aborted: 0,
      }
      const readyList: Ready[] = []
      const entities: string[] = []
      const attributes: string[] = []

      for (const cs of csIds) {
        const current = yield* loadStatus(cs)
        if (
          current &&
          current.status !== 'open' &&
          incoming.every((row) => row.cs !== cs)
        ) {
          continue
        }
        if (
          current &&
          (current.status === 'committed' ||
            current.status === 'aborted' ||
            current.status === 'expired' ||
            current.status === 'rejected')
        ) {
          continue
        }
        const datoms = yield* loadDatomsForCs(cs)
        if (datoms.length === 0) continue
        const actor = current?.actor ?? (yield* loadEnvelopeActor(cs))
        const evaluated = yield* evaluate(cs, datoms, actor)
        if (evaluated.kind === 'ready') {
          readyList.push(evaluated.ready)
        } else {
          yield* upsertStatus({
            cs,
            status:
              evaluated.kind === 'open'
                ? 'open'
                : evaluated.kind === 'aborted'
                  ? 'aborted'
                  : evaluated.kind === 'expired'
                    ? 'expired'
                    : 'rejected',
            commitTx:
              evaluated.kind === 'aborted' ? evaluated.commitTx : null,
            basis: null,
            actor: evaluated.actor,
          })
          counts[evaluated.kind === 'open' ? 'open' : evaluated.kind] += 1
          for (const datom of datoms) {
            if (!isSystemAttr(datom.a)) {
              entities.push(datom.e)
              attributes.push(datom.a)
            }
          }
        }
      }

      readyList.sort((left, right) =>
        left.commitTx < right.commitTx
          ? -1
          : left.commitTx > right.commitTx
            ? 1
            : 0,
      )

      yield* sql.withTransaction(
        Effect.gen(function* () {
          for (const ready of readyList) {
            const applied = yield* applyReady(ready)
            if (applied === 'rejected') {
              yield* upsertStatus({
                cs: ready.cs,
                status: 'rejected',
                commitTx: ready.commitTx,
                basis: ready.basis,
                actor: ready.actor,
              })
              counts.rejected += 1
              continue
            }
            yield* upsertStatus({
              cs: ready.cs,
              status: 'committed',
              commitTx: ready.commitTx,
              basis: ready.basis,
              actor: ready.actor,
            })
            counts.applied += 1
            entities.push(...applied.touchedEntities)
            attributes.push(...applied.touchedAttrs)
          }
          yield* saveCursor(maxSeq)
        }),
      )

      lastKeys = keysFor(unique(entities), unique(attributes))
      if (lastKeys.length > 0) {
        yield* reactivity.invalidate(lastKeys)
      }
      return { ...counts, keys: lastKeys } satisfies ProjectResult
    })

    const rebuild = Effect.fn('Projector.rebuild')(function* () {
      yield* clearReadModels
      lastKeys = []
      return yield* project()
    })

    const facts = Effect.fn('Projector.facts')(function* (query: FactQuery) {
      const committed = yield* loadAllFacts()
      const raw =
        query.view === 'draft' && query.actor
          ? yield* Effect.gen(function* () {
              const statuses = yield* loadStatuses()
              const mine = statuses.filter(
                (row) => row.status === 'open' && row.actor === query.actor,
              )
              const members: Datom[] = []
              for (const row of mine) {
                const datoms = yield* loadDatomsForCs(row.cs)
                members.push(...changesetMembers(datoms))
              }
              return overlayDraft(committed, members, catalog)
            })
          : committed
      const visible = visibleFacts(raw, catalog)
      const prefix = query.prefix
      if (!prefix) return visible
      return visible.filter((fact) => underPrefix(fact.e, prefix))
    })

    const snapshot = Effect.fn(function* () {
      return canonicalSnapshot(
        yield* loadAllFacts(),
        yield* loadConflicts(),
        yield* loadStatuses(),
      )
    })

    return Projector.of({
      project,
      rebuild,
      facts,
      conflicts: loadConflicts,
      statuses: loadStatuses,
      snapshot,
      lastKeys: () => lastKeys,
    })
  })

export const projectorLayer = (
  catalog: Catalog,
): Layer.Layer<
  Projector,
  SqlError,
  SqlClient.SqlClient | LogStore | Reactivity.Reactivity | HlcClock
> => Layer.effect(Projector, makeProjector(catalog))

export const projectorKeys = (
  entityIds: ReadonlyArray<string>,
  attributes: ReadonlyArray<string>,
): ReactivityKeys => keysFor(entityIds, attributes)

export const prefixesOf = ancestorPrefixes
