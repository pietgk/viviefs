/**
 * Server authority for P09. Validates a changeset, then appends it.
 * The server stores datoms. It does not run device workflow code.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import { BlobStore } from '@viviefs/blobs'
import {
  Attr,
  FutureSkew,
  InvalidTx,
  LogStore,
  changesetMembers,
  decodeCommit,
  deferredId,
  hashMembers,
  indexCatalog,
  isSystemAttr,
  orgId,
  underPrefix,
  type Catalog,
  type Datom,
  type Envelope,
} from '@viviefs/datom'
import { decodeLease } from '@viviefs/workflow-engine'
import {
  BasisRejected,
  BlobHashMismatch,
  FileMissing,
  ManifestRejected,
  OrgMismatch,
  Rejection,
  StaleLease,
  SyncRpcs,
  UnknownAttribute,
  type AppendRequest,
} from '@viviefs/sync-protocol'

const JOURNAL = new Set<string>([
  Attr.workflowStarted,
  Attr.workflowResult,
  Attr.activityExit,
  Attr.deferredExit,
  Attr.clockWakeAt,
])

const WRITE_ONCE = new Set<string>([
  Attr.workflowStarted,
  Attr.workflowResult,
  Attr.activityExit,
  Attr.deferredExit,
  Attr.clockWakeAt,
])

const asSeq = (value: unknown): number => Number(value)

const executionOf = (entity: string, org: string): string | null => {
  const root = `${orgId(org)}/W`
  if (!entity.startsWith(root)) return null
  const rest = entity.slice(root.length)
  const slash = rest.indexOf('/')
  const segment = slash === -1 ? rest : rest.slice(0, slash)
  if (segment.length === 0) return null
  return `${root}${segment}`
}

const inOrg = (entity: string, org: string): boolean =>
  underPrefix(entity, orgId(org))

type Sql = SqlClient.SqlClient

const cursorOf = (sql: Sql) =>
  Effect.gen(function* () {
    const rows = yield* sql<{ seq: unknown }>`
      SELECT COALESCE(MAX(seq), 0) AS seq FROM datoms
    `
    return asSeq(rows[0]?.seq ?? 0)
  })

const txExists = (sql: Sql, tx: string) =>
  Effect.gen(function* () {
    const rows = yield* sql<{ tx: string }>`
      SELECT tx FROM datoms WHERE tx = ${tx}
    `
    return rows.length > 0
  })

const factExists = (sql: Sql, entity: string, attribute: string) =>
  Effect.gen(function* () {
    const rows = yield* sql<{ tx: string }>`
      SELECT tx FROM datoms WHERE e = ${entity} AND a = ${attribute} LIMIT 1
    `
    return rows.length > 0
  })

const storedLease = (sql: Sql, entity: string) =>
  Effect.gen(function* () {
    const rows = yield* sql<{ v: string }>`
      SELECT v FROM datoms
      WHERE e = ${entity} AND a = ${Attr.leaseHolder}
      ORDER BY seq DESC
      LIMIT 1
    `
    const value = rows[0]?.v
    if (!value) return null
    return decodeLease(value)
  })

const readEnvelope = (sql: Sql, cs: string) =>
  Effect.gen(function* () {
    const rows = yield* sql<{
      cs: string
      actor: string
      device: string
      lease_epoch: unknown
      trace_id: string
      span_id: string
      sampled: unknown
      command: string
    }>`
      SELECT cs, actor, device, lease_epoch, trace_id, span_id, sampled, command
      FROM changesets
      WHERE cs = ${cs}
    `
    const row = rows[0]
    if (!row) return null
    const envelope: Envelope = {
      cs: row.cs,
      actor: row.actor,
      device: row.device,
      leaseEpoch: row.lease_epoch == null ? null : asSeq(row.lease_epoch),
      traceId: row.trace_id,
      spanId: row.span_id,
      sampled: asSeq(row.sampled) === 1,
      command: row.command,
    }
    return envelope
  })

export class SyncAuthority extends Context.Service<
  SyncAuthority,
  {
    readonly completeDeferred: (options: {
      readonly org: string
      readonly executionId: string
      readonly deferredName: string
      readonly exit: string
    }) => Effect.Effect<void, FutureSkew | InvalidTx | SqlError>
  }
>()('viviefs/sync/SyncAuthority') {}

const authorityLayer: Layer.Layer<SyncAuthority, never, LogStore> =
  Layer.effect(
    SyncAuthority,
    Effect.gen(function* () {
      const store = yield* LogStore
      return SyncAuthority.of({
        completeDeferred: Effect.fn('SyncAuthority.completeDeferred')(
          function* (options: {
            readonly org: string
            readonly executionId: string
            readonly deferredName: string
            readonly exit: string
          }) {
            const tx = yield* store.mint()
            const entity = deferredId(
              options.org,
              options.executionId,
              options.deferredName,
            )
            yield* store.append(
              [
                {
                  e: entity,
                  a: Attr.deferredExit,
                  v: options.exit,
                  tx,
                  op: 'assert',
                  cs: tx,
                },
              ],
              {
                cs: tx,
                actor: 'server',
                device: 'server',
                leaseEpoch: null,
                traceId: '00000000000000000000000000000000',
                spanId: '0000000000000000',
                sampled: false,
                command: 'server.deferred',
              },
            )
          },
        ),
      })
    }),
  )

const accept = (
  catalog: Catalog,
  request: AppendRequest,
  services: {
    readonly store: LogStore['Service']
    readonly sql: Sql
    readonly blobs: BlobStore['Service']
  },
): Effect.Effect<
  { readonly cursor: number },
  Rejection | FutureSkew | InvalidTx | SqlError
> =>
  Effect.gen(function* () {
    const { store, sql, blobs } = services
    const indexed = indexCatalog(catalog)
    const { org, envelope, datoms } = request

    if (datoms.length === 0) {
      return yield* new ManifestRejected({
        cs: envelope.cs,
        reason: 'empty',
      })
    }
    let seen = 0
    for (const datom of datoms) {
      if ((yield* txExists(sql, datom.tx)) === true) seen += 1
    }
    if (seen === datoms.length) {
      return { cursor: yield* cursorOf(sql) }
    }
    if (seen > 0) {
      return yield* new ManifestRejected({
        cs: envelope.cs,
        reason: 'partial',
      })
    }

    for (const datom of datoms) {
      if (datom.cs !== envelope.cs) {
        return yield* new ManifestRejected({
          cs: envelope.cs,
          reason: 'cs',
        })
      }
    }

    const commit = datoms.find((datom) => datom.a === Attr.changesetCommit)
    const selfCommitted =
      !commit && datoms.length === 1 && datoms[0]?.cs === datoms[0]?.tx
    if (!commit && !selfCommitted) {
      return yield* new ManifestRejected({
        cs: envelope.cs,
        reason: 'open',
      })
    }

    for (const datom of datoms) {
      if (
        datom.a === Attr.changesetCommit ||
        datom.a === Attr.changesetAbort
      ) {
        continue
      }
      if (!inOrg(datom.e, org)) {
        return yield* new OrgMismatch({ org, entity: datom.e })
      }
      if (!isSystemAttr(datom.a) && !indexed.byAttr.has(datom.a)) {
        return yield* new UnknownAttribute({ attribute: datom.a })
      }
    }

    if (commit) {
      const manifest = decodeCommit(commit.v)
      if (!manifest) {
        return yield* new ManifestRejected({
          cs: envelope.cs,
          reason: 'manifest',
        })
      }
      const members = changesetMembers(datoms)
      if (members.length !== manifest.n) {
        return yield* new ManifestRejected({
          cs: envelope.cs,
          reason: 'count',
        })
      }
      const hashed = yield* hashMembers(members).pipe(Effect.orDie)
      if (hashed !== manifest.hash) {
        return yield* new ManifestRejected({
          cs: envelope.cs,
          reason: 'hash',
        })
      }
      for (const hash of manifest.files) {
        if ((yield* blobs.has(hash)) === false) {
          return yield* new FileMissing({ hash })
        }
      }
    }

    const proposed = new Map<
      string,
      { readonly device: string; readonly epoch: number }
    >()
    for (const datom of datoms) {
      if (datom.a !== Attr.leaseHolder) continue
      const value = decodeLease(datom.v)
      if (!value) {
        return yield* new ManifestRejected({
          cs: envelope.cs,
          reason: 'lease',
        })
      }
      const stored = yield* storedLease(sql, datom.e)
      if (stored && value.epoch < stored.epoch) {
        return yield* new StaleLease({
          execution: datom.e,
          epoch: value.epoch,
          holderEpoch: stored.epoch,
        })
      }
      if (
        stored &&
        value.epoch === stored.epoch &&
        value.device !== stored.device
      ) {
        return yield* new StaleLease({
          execution: datom.e,
          epoch: value.epoch,
          holderEpoch: stored.epoch,
        })
      }
      proposed.set(datom.e, value)
    }

    for (const datom of datoms) {
      if (!JOURNAL.has(datom.a)) continue
      const execution = executionOf(datom.e, org)
      if (!execution) {
        return yield* new OrgMismatch({ org, entity: datom.e })
      }
      const next = proposed.get(execution) ?? (yield* storedLease(sql, execution))
      const epoch = envelope.leaseEpoch ?? 0
      if (!next || epoch !== next.epoch || envelope.device !== next.device) {
        return yield* new StaleLease({
          execution,
          epoch,
          holderEpoch: next?.epoch ?? 0,
        })
      }
    }

    for (const datom of datoms) {
      if (
        datom.a === Attr.changesetCommit ||
        datom.a === Attr.changesetAbort ||
        datom.a === Attr.leaseHolder
      ) {
        continue
      }
      const lookup = indexed.byAttr.get(datom.a)
      const writeOnce =
        WRITE_ONCE.has(datom.a) || lookup?.spec.policy === 'write-once'
      if (!writeOnce) continue
      if ((yield* factExists(sql, datom.e, datom.a)) === true) {
        return yield* new BasisRejected({
          entity: datom.e,
          attribute: datom.a,
          basis: request.basis,
        })
      }
    }

    yield* store.append(datoms as ReadonlyArray<Datom>, envelope)
    return { cursor: yield* cursorOf(sql) }
  })

const asRpcError = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.catch((error) =>
      Schema.is(Rejection)(error) ? Effect.fail(error) : Effect.die(error),
    ),
  )

const handlerLayer = (catalog: Catalog) =>
  SyncRpcs.toLayer(
    Effect.gen(function* () {
      const store = yield* LogStore
      const sql = yield* SqlClient.SqlClient
      const blobs = yield* BlobStore
      return {
        Append: (request: AppendRequest) =>
          asRpcError(accept(catalog, request, { store, sql, blobs })),
        Pull: (request: { readonly org: string; readonly cursor: number }) =>
          Stream.fromEffect(
            Effect.orDie(Effect.gen(function* () {
              const rows = yield* store.streamFrom(request.cursor)
              const end = rows.at(-1)?.seq ?? request.cursor
              const csInOrg = new Set<string>()
              for (const row of rows) {
                if (
                  row.a !== Attr.changesetCommit &&
                  row.a !== Attr.changesetAbort &&
                  inOrg(row.e, request.org)
                ) {
                  csInOrg.add(row.cs)
                }
              }
              const mine = rows.filter((row) => csInOrg.has(row.cs))
              const envelopes = []
              const seen = new Set<string>()
              for (const row of mine) {
                if (seen.has(row.cs)) continue
                seen.add(row.cs)
                const envelope = yield* readEnvelope(sql, row.cs)
                if (envelope) envelopes.push(envelope)
              }
              return {
                cursor: end,
                datoms: [...mine],
                envelopes,
              }
            })),
          ),
        PutBlob: (request: {
          readonly org: string
          readonly hash: string
          readonly text: string
        }) =>
          Effect.gen(function* () {
            if (request.org.length === 0) {
              return yield* new OrgMismatch({
                org: request.org,
                entity: request.hash,
              })
            }
            yield* blobs.put(request.hash, request.text).pipe(
              Effect.mapError(
                (error) => new BlobHashMismatch({ hash: error.hash }),
              ),
            )
            return { hash: request.hash }
          }),
      }
    }),
  )

export const syncServerLayer = (catalog: Catalog) =>
  Layer.mergeAll(handlerLayer(catalog), authorityLayer)
