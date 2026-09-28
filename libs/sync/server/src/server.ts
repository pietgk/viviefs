/**
 * Server authority for P09, authenticated since P11. Validates a changeset,
 * then appends it. The server stores datoms. It does not run device workflow
 * code.
 */
import * as Clock from 'effect/Clock'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Semaphore from 'effect/Semaphore'
import * as Stream from 'effect/Stream'
import * as Headers from 'effect/unstable/http/Headers'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import { BlobStore } from '@viviefs/blobs'
import {
  Attr,
  FutureSkew,
  InvalidTx,
  LogStore,
  accountId,
  changesetMembers,
  decodeCommit,
  deferredId,
  encodeCommit,
  hashMembers,
  identityCatalog,
  indexCatalog,
  isSystemAttr,
  membershipId,
  orgId,
  underPrefix,
  type Catalog,
  type Datom,
  type EnvelopeType,
} from '@viviefs/datom'
import {
  Caller,
  TokenVerifier,
  type ProviderAccount,
} from '@viviefs/identity'
import { decodeLease } from '@viviefs/workflow-engine'
import {
  ActorMismatch,
  BasisRejected,
  BearerAuthentication,
  BlobHashMismatch,
  FileMissing,
  ManifestRejected,
  MembershipMissing,
  OrgMismatch,
  Rejection,
  ServerOnlyAttribute,
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

const serverEnvelope = (
  cs: string,
  command: string,
  acceptedAt: number,
): EnvelopeType => ({
  cs,
  actor: 'server',
  device: 'server',
  leaseEpoch: null,
  traceId: '00000000000000000000000000000000',
  spanId: '0000000000000000',
  sampled: false,
  command,
  acceptedAt,
})

/**
 * Who is a member of what (P11, ADR-0022). Reads the account entity and
 * membership datoms from the log; `grant` and `revoke` are the operator's
 * commands and the only writers. `grant` is the only place a person is
 * minted. Writes are serialized, so one account never gets two people.
 */
export class Memberships extends Context.Service<
  Memberships,
  {
    readonly personOf: (
      account: ProviderAccount,
    ) => Effect.Effect<string | null, SqlError>
    readonly isMember: (
      person: string,
      org: string,
    ) => Effect.Effect<boolean, SqlError>
    readonly organizationsOf: (
      person: string,
    ) => Effect.Effect<ReadonlyArray<string>, SqlError>
    readonly grant: (
      org: string,
      account: ProviderAccount,
    ) => Effect.Effect<string, FutureSkew | InvalidTx | SqlError>
    readonly revoke: (
      org: string,
      account: ProviderAccount,
    ) => Effect.Effect<void, FutureSkew | InvalidTx | SqlError>
  }
>()('viviefs/sync/Memberships') {}

const membershipsLayer: Layer.Layer<
  Memberships,
  never,
  LogStore | SqlClient.SqlClient
> = Layer.effect(
  Memberships,
  Effect.gen(function* () {
    const store = yield* LogStore
    const sql = yield* SqlClient.SqlClient
    const writes = yield* Semaphore.make(1)

    const personOf = Effect.fnUntraced(function* (
      account: ProviderAccount,
    ) {
      const entity = yield* accountId(account).pipe(Effect.orDie)
      const rows = yield* sql<{ v: string }>`
        SELECT v FROM datoms
        WHERE e = ${entity} AND a = ${Attr.accountPerson} AND op = 'assert'
        ORDER BY seq
        LIMIT 1
      `
      return rows[0]?.v ?? null
    })

    const isMember = Effect.fnUntraced(function* (
      person: string,
      org: string,
    ) {
      const rows = yield* sql<{ op: string }>`
        SELECT op FROM datoms
        WHERE e = ${membershipId(org, person)} AND a = ${Attr.membershipGranted}
        ORDER BY seq DESC
        LIMIT 1
      `
      return rows[0]?.op === 'assert'
    })

    // Latest membership fact per organization, in log order.
    const organizationsOf = Effect.fnUntraced(function* (person: string) {
      const rows = yield* sql<{ e: string; op: string }>`
        SELECT e, op FROM datoms
        WHERE a = ${Attr.membershipGranted} AND v = ${person}
        ORDER BY seq
      `
      const suffix = `/M${person}`
      const latest = new Map<string, string>()
      for (const row of rows) {
        if (row.e.startsWith('O') && row.e.endsWith(suffix)) {
          latest.set(row.e.slice(1, row.e.length - suffix.length), row.op)
        }
      }
      return [...latest]
        .filter(([, op]) => op === 'assert')
        .map(([org]) => org)
        .sort()
    })

    // The account entity goes in a changeset of its own: Pull sends every
    // member of a changeset that touches an organization (ADR-0010).
    const mintPerson = (account: ProviderAccount) =>
      Effect.gen(function* () {
        const person = yield* store.mint()
        const entity = yield* accountId(account).pipe(Effect.orDie)
        const cs = yield* store.mint()
        const member = (a: string, v: string) =>
          Effect.map(store.mint(), (tx): Datom => ({
            e: entity,
            a,
            v,
            tx,
            op: 'assert',
            cs,
          }))
        const members = [
          yield* member(Attr.accountPerson, person),
          yield* member(Attr.accountIssuer, account.issuer),
          yield* member(Attr.accountSubject, account.subject),
        ]
        const hash = yield* hashMembers(members).pipe(Effect.orDie)
        const commit: Datom = {
          e: cs,
          a: Attr.changesetCommit,
          v: encodeCommit({ n: members.length, hash, basis: 0, files: [] }),
          tx: yield* store.mint(),
          op: 'assert',
          cs,
        }
        const now = yield* Clock.currentTimeMillis
        yield* store.append(
          [...members, commit],
          serverEnvelope(cs, 'server.linkAccount', now),
        )
        return person
      })

    const writeMembership = (
      org: string,
      person: string,
      op: 'assert' | 'retract',
      command: string,
    ) =>
      Effect.gen(function* () {
        const tx = yield* store.mint()
        const now = yield* Clock.currentTimeMillis
        yield* store.append(
          [
            {
              e: membershipId(org, person),
              a: Attr.membershipGranted,
              v: person,
              tx,
              op,
              cs: tx,
            },
          ],
          serverEnvelope(tx, command, now),
        )
      })

    const grant = Effect.fn('Memberships.grant')(function* (
      org: string,
      account: ProviderAccount,
    ) {
      return yield* writes.withPermits(1)(
        Effect.gen(function* () {
          const person = (yield* personOf(account)) ?? (yield* mintPerson(account))
          if (!(yield* isMember(person, org))) {
            yield* writeMembership(org, person, 'assert', 'server.grantMembership')
          }
          return person
        }),
      )
    })

    const revoke = Effect.fn('Memberships.revoke')(function* (
      org: string,
      account: ProviderAccount,
    ) {
      yield* writes.withPermits(1)(
        Effect.gen(function* () {
          const person = yield* personOf(account)
          if (person !== null && (yield* isMember(person, org))) {
            yield* writeMembership(org, person, 'retract', 'server.revokeMembership')
          }
        }),
      )
    })

    return Memberships.of({ personOf, isMember, organizationsOf, grant, revoke })
  }),
)

/**
 * Server half of bearer authentication: verify the token, find the person,
 * provide the caller. A missing or bad token never reaches a handler.
 */
const bearerAuthenticationLayer: Layer.Layer<
  BearerAuthentication,
  never,
  TokenVerifier | Memberships
> = Layer.effect(
  BearerAuthentication,
  Effect.gen(function* () {
    const verifier = yield* TokenVerifier
    const memberships = yield* Memberships
    return BearerAuthentication.of((handler, { headers }) =>
      Effect.gen(function* () {
        const header = Option.getOrElse(
          Headers.get(headers, 'authorization'),
          () => '',
        )
        const token = header.startsWith('Bearer ') ? header.slice(7) : ''
        const verified = yield* verifier.verify(token)
        const person = yield* memberships
          .personOf(verified.account)
          .pipe(Effect.orDie)
        return yield* Effect.provideService(
          handler,
          Caller,
          Caller.of({
            person,
            account: verified.account,
            roles: verified.roles,
          }),
        )
      }),
    )
  }),
)

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
            const now = yield* Clock.currentTimeMillis
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
              serverEnvelope(tx, 'server.deferred', now),
            )
          },
        ),
      })
    }),
  )

const accept = (
  catalog: Catalog,
  request: AppendRequest,
  caller: Caller['Service'],
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
    const indexed = indexCatalog({
      types: [...catalog.types, ...identityCatalog.types],
    })
    const { org, envelope, datoms } = request

    if (envelope.actor !== caller.person) {
      return yield* new ActorMismatch({
        actor: envelope.actor,
        caller: caller.person,
      })
    }

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
      if (indexed.byAttr.get(datom.a)?.spec.authority === 'server') {
        return yield* new ServerOnlyAttribute({ attribute: datom.a })
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
        if ((yield* blobs.has(org, hash)) === false) {
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

    const acceptedAt = yield* Clock.currentTimeMillis
    yield* store.append(datoms as ReadonlyArray<Datom>, {
      ...envelope,
      acceptedAt,
    })
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
      const memberships = yield* Memberships
      const authority = yield* SyncAuthority

      // Membership comes first: a non-member learns nothing, not even
      // whether a changeset it names already exists.
      const requireMembership = (org: string) =>
        Effect.gen(function* () {
          const caller = yield* Caller
          const member =
            caller.person !== null &&
            (yield* memberships
              .isMember(caller.person, org)
              .pipe(Effect.orDie))
          if (!member) return yield* new MembershipMissing({ org })
          return caller
        })

      const pageOf = (request: {
        readonly org: string
        readonly cursor: number
      }) =>
        Effect.gen(function* () {
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
            const envelope = yield* store.envelope(row.cs)
            if (envelope) envelopes.push(envelope)
          }
          return {
            cursor: end,
            datoms: [...mine],
            envelopes,
          }
        })

      return {
        Append: (request: AppendRequest) =>
          asRpcError(
            Effect.gen(function* () {
              const caller = yield* requireMembership(request.org)
              return yield* accept(catalog, request, caller, {
                store,
                sql,
                blobs,
              })
            }),
          ).pipe(Effect.withSpan('SyncRpc.Append')),
        Pull: (request: { readonly org: string; readonly cursor: number }) =>
          Stream.fromEffect(
            Effect.gen(function* () {
              yield* requireMembership(request.org)
              return yield* Effect.orDie(pageOf(request))
            }).pipe(Effect.withSpan('SyncRpc.Pull')),
          ),
        PutBlob: (request: {
          readonly org: string
          readonly hash: string
          readonly text: string
        }) =>
          Effect.gen(function* () {
            yield* requireMembership(request.org)
            yield* blobs.put(request.org, request.hash, request.text).pipe(
              Effect.mapError(
                (error) => new BlobHashMismatch({ hash: error.hash }),
              ),
            )
            return { hash: request.hash }
          }).pipe(Effect.withSpan('SyncRpc.PutBlob')),
        CompleteDeferred: (request: {
          readonly org: string
          readonly executionId: string
          readonly deferredName: string
          readonly exit: string
        }) =>
          Effect.gen(function* () {
            yield* requireMembership(request.org)
            yield* authority.completeDeferred(request).pipe(Effect.orDie)
          }).pipe(Effect.withSpan('SyncRpc.CompleteDeferred')),
        Caller: () =>
          Effect.gen(function* () {
            const caller = yield* Caller
            const organizations =
              caller.person === null
                ? []
                : yield* memberships
                    .organizationsOf(caller.person)
                    .pipe(Effect.orDie)
            return {
              person: caller.person,
              account: caller.account,
              roles: [...caller.roles],
              organizations: [...organizations],
            }
          }).pipe(Effect.withSpan('SyncRpc.Caller')),
      }
    }),
  )

/**
 * The sync server: authenticated handlers, the server authority, and the
 * operator's membership commands. Needs a log store, its SQL client, a blob
 * store and a token verifier.
 */
export const syncServerLayer = (catalog: Catalog) =>
  Layer.mergeAll(handlerLayer(catalog), bearerAuthenticationLayer).pipe(
    Layer.provideMerge(authorityLayer),
    Layer.provideMerge(membershipsLayer),
  )
