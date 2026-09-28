/**
 * Device sync: outbox up, organization cursor down.
 * Optimistic domain changesets are open locally until the server
 * acknowledges the commit. A typed rejection aborts the open
 * changeset, rebuilds read models, and leaves the rest of the
 * outbox to be pushed.
 *
 * P11: every call carries the sign-in session's access token. A
 * token or sign-in failure stops a push and keeps the outbox. A
 * lost membership rejects that organization's outbox, keeps the
 * rows, and makes the local copy read-only until a pull succeeds.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as Headers from 'effect/unstable/http/Headers'
import * as Reactivity from 'effect/unstable/reactivity/Reactivity'
import * as RpcClient from 'effect/unstable/rpc/RpcClient'
import type { RpcClientError } from 'effect/unstable/rpc/RpcClientError'
import * as RpcMiddleware from 'effect/unstable/rpc/RpcMiddleware'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import { blobHash } from '@viviefs/blobs'
import {
  Attr,
  Datom,
  Envelope,
  FutureSkew,
  HlcDevice,
  InvalidTx,
  LogStore,
  Projector,
  projectorLayer,
  type Catalog,
} from '@viviefs/datom'
import {
  CallerStatements,
  SignInSession,
  StatementUnavailable,
  type CallerStatement,
  type IdentityProviderUnreachable,
  type SignInNeeded,
  type TokenRejected,
} from '@viviefs/identity'
import {
  BearerAuthentication,
  MembershipMissing,
  Rejection,
  SyncRpcs,
  type AppendAck,
  type AppendRequest,
  type BlobHashMismatch,
  type PullPage,
} from '@viviefs/sync-protocol'

const withBearer = <R extends { readonly headers: Headers.Headers }>(
  request: R,
  token: string,
): R => ({
  ...request,
  headers: Headers.set(request.headers, 'authorization', `Bearer ${token}`),
})

/** Client half of bearer authentication: the current access token on every call. */
export const bearerAuthenticationClient = RpcMiddleware.layerClient(
  BearerAuthentication,
  ({ request, next }) =>
    Effect.gen(function* () {
      const session = yield* SignInSession
      const token = yield* session.accessToken
      return yield* next(withBearer(request, token))
    }),
)

/** Client half of bearer authentication with one given token. */
const bearerTokenClient = (token: string) =>
  RpcMiddleware.layerClient(BearerAuthentication, ({ request, next }) =>
    next(withBearer(request, token)),
  )

/**
 * The call never reached a handler: no valid token, no sign-in, or the
 * identity provider did not answer a refresh.
 */
export type Unauthenticated =
  | TokenRejected
  | SignInNeeded
  | IdentityProviderUnreachable

const Payload = Schema.Struct({
  basis: Schema.Number,
  envelope: Envelope,
  datoms: Schema.Array(Datom),
})
const PayloadJson = Schema.fromJsonString(Payload)

export type Outgoing = {
  readonly org: string
  readonly basis: number
  readonly envelope: typeof Envelope.Type
  readonly datoms: ReadonlyArray<typeof Datom.Type>
}

export type PushResult = {
  readonly acked: ReadonlyArray<string>
  readonly rejected: ReadonlyArray<{
    readonly cs: string
    readonly tag: string
  }>
  readonly waiting: ReadonlyArray<{
    readonly cs: string
    readonly hash: string
  }>
  readonly rebuilt: boolean
}

/**
 * Failures that decide nothing about a changeset: the call was not
 * authenticated, or it did not reach the server and back (`RpcClientError`,
 * for example offline). The outbox stays as it is; retry later (Q10).
 */
export type NotDelivered = Unauthenticated | RpcClientError

type RpcShape = {
  readonly Append: (
    request: AppendRequest,
  ) => Effect.Effect<AppendAck, Rejection | NotDelivered>
  readonly Pull: (request: {
    readonly org: string
    readonly cursor: number
  }) => Stream.Stream<PullPage, MembershipMissing | NotDelivered>
  readonly PutBlob: (request: {
    readonly org: string
    readonly hash: string
    readonly text: string
  }) => Effect.Effect<
    { readonly hash: string },
    BlobHashMismatch | MembershipMissing | NotDelivered
  >
  readonly Caller: () => Effect.Effect<CallerStatement, NotDelivered>
}

export class SyncRpc extends Context.Service<
  SyncRpc,
  {
    readonly append: (
      request: AppendRequest,
    ) => Effect.Effect<AppendAck, Rejection | NotDelivered>
    readonly pull: (request: {
      readonly org: string
      readonly cursor: number
    }) => Effect.Effect<PullPage, MembershipMissing | NotDelivered>
    readonly putBlob: (request: {
      readonly org: string
      readonly hash: string
      readonly text: string
    }) => Effect.Effect<
      { readonly hash: string },
      BlobHashMismatch | MembershipMissing | NotDelivered
    >
    /** The server's statement about the signed-in provider account (Q22). */
    readonly caller: Effect.Effect<CallerStatement, NotDelivered>
  }
>()('viviefs/sync/SyncRpc') {}

const makeSyncRpc = (client: RpcShape) =>
  SyncRpc.of({
    append: (request) =>
      client.Append({
        org: request.org,
        basis: request.basis,
        envelope: request.envelope,
        datoms: [...request.datoms],
      }),
    pull: (request) =>
      Stream.runCollect(client.Pull(request)).pipe(
        Effect.map((pages) => {
          const page = pages[0]
          return (
            page ?? {
              cursor: request.cursor,
              datoms: [],
              envelopes: [],
            }
          )
        }),
      ),
    putBlob: (request) => client.PutBlob(request),
    caller: Effect.suspend(() => client.Caller()),
  })

export const syncRpcLayer = (client: RpcShape): Layer.Layer<SyncRpc> =>
  Layer.succeed(SyncRpc, makeSyncRpc(client))

/**
 * `SyncRpc` over an RPC protocol (on a device: HTTP), every call carrying
 * the sign-in session's access token.
 */
export const syncRpcClientLayer: Layer.Layer<
  SyncRpc,
  never,
  RpcClient.Protocol | SignInSession
> = Layer.effect(SyncRpc, Effect.map(RpcClient.make(SyncRpcs), makeSyncRpc)).pipe(
  Layer.provide(bearerAuthenticationClient),
)

/**
 * The server's statement for one given access token, the port a sign-in
 * session asks right after the identity provider issued that token (Q22).
 * A short-lived client carries exactly that token, so the statement belongs
 * to the sign-in that asked for it.
 */
export const callerStatementsLayer: Layer.Layer<
  CallerStatements,
  never,
  RpcClient.Protocol
> = Layer.effect(
  CallerStatements,
  Effect.gen(function* () {
    const protocol = yield* RpcClient.Protocol
    return CallerStatements.of({
      fetch: (accessToken) =>
        Effect.scoped(
          Effect.flatMap(RpcClient.make(SyncRpcs), (client) => client.Caller()),
        ).pipe(
          Effect.provide(bearerTokenClient(accessToken)),
          Effect.provideService(RpcClient.Protocol, protocol),
          Effect.mapError(
            (error) =>
              new StatementUnavailable({
                reason: `${error._tag}: ${error.message}`,
              }),
          ),
        ),
    })
  }),
)

export class SyncClient extends Context.Service<
  SyncClient,
  {
    readonly submit: (
      changeset: Outgoing,
    ) => Effect.Effect<
      void,
      FutureSkew | InvalidTx | SqlError | MembershipMissing
    >
    readonly push: (
      org: string,
    ) => Effect.Effect<
      PushResult,
      FutureSkew | InvalidTx | SqlError | Rejection | NotDelivered
    >
    readonly pull: (
      org: string,
    ) => Effect.Effect<
      number,
      FutureSkew | InvalidTx | SqlError | MembershipMissing | NotDelivered
    >
    readonly upload: (
      org: string,
      text: string,
    ) => Effect.Effect<
      string,
      BlobHashMismatch | MembershipMissing | NotDelivered
    >
  }
>()('viviefs/sync/SyncClient') {}

const migrateSqlite = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cs TEXT NOT NULL UNIQUE,
    org TEXT NOT NULL,
    state TEXT NOT NULL,
    rejection TEXT,
    payload TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS sync_cursor (
    org TEXT PRIMARY KEY,
    cursor INTEGER NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS sync_revoked (
    org TEXT PRIMARY KEY
  )`
})

const migratePg = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE IF NOT EXISTS outbox (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cs TEXT NOT NULL UNIQUE,
    org TEXT NOT NULL,
    state TEXT NOT NULL,
    rejection TEXT,
    payload TEXT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS sync_cursor (
    org TEXT PRIMARY KEY,
    cursor BIGINT NOT NULL
  )`
  yield* sql`CREATE TABLE IF NOT EXISTS sync_revoked (
    org TEXT PRIMARY KEY
  )`
})

const migrate = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.onDialectOrElse({
    sqlite: () => migrateSqlite,
    pg: () => migratePg,
    orElse: () => migrateSqlite,
  })
})

const makeClient = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const store = yield* LogStore
  const projector = yield* Projector
  const rpc = yield* SyncRpc
  const device = yield* HlcDevice
  yield* migrate
  const noteDevice = Effect.annotateCurrentSpan('sync.device', device.id)

  const readCursor = (org: string) =>
    Effect.gen(function* () {
      const rows = yield* sql<{ cursor: unknown }>`
        SELECT cursor FROM sync_cursor WHERE org = ${org}
      `
      return rows[0] ? Number(rows[0].cursor) : 0
    })

  const writeCursor = (org: string, cursor: number) =>
    sql`
      INSERT INTO sync_cursor (org, cursor) VALUES (${org}, ${cursor})
      ON CONFLICT (org) DO UPDATE SET cursor = ${cursor}
    `

  // Operational state of this replica (ADR-0006): the server said this
  // device's person is no longer a member of the organization.
  const isRevoked = (org: string) =>
    Effect.map(
      sql<{ org: string }>`SELECT org FROM sync_revoked WHERE org = ${org}`,
      (rows) => rows.length > 0,
    )

  const markRevoked = (org: string) =>
    Effect.asVoid(
      sql`INSERT INTO sync_revoked (org) VALUES (${org}) ON CONFLICT (org) DO NOTHING`,
    )

  const clearRevoked = (org: string) =>
    Effect.asVoid(sql`DELETE FROM sync_revoked WHERE org = ${org}`)

  const abortLocal = (
    changeset: { readonly envelope: typeof Envelope.Type },
    tag: string,
  ) =>
    Effect.gen(function* () {
      const tx = yield* store.mint()
      yield* store.append(
        [
          {
            e: changeset.envelope.cs,
            a: Attr.changesetAbort,
            v: tag,
            tx,
            op: 'assert',
            cs: changeset.envelope.cs,
          },
        ],
        changeset.envelope,
      )
    })

  const submit = Effect.fn('SyncClient.submit')(function* (
    submitted: Outgoing,
  ) {
    // Only the server says when it accepted a changeset. A value set here
    // would stick, because the acceptance time is set once.
    const changeset: Outgoing = {
      ...submitted,
      envelope: { ...submitted.envelope, acceptedAt: null },
    }
    yield* Effect.annotateCurrentSpan({
      'sync.device': changeset.envelope.device,
      'sync.command': changeset.envelope.command,
    })
    if (yield* isRevoked(changeset.org)) {
      return yield* new MembershipMissing({ org: changeset.org })
    }
    const self =
      changeset.datoms.length === 1 &&
      changeset.datoms[0]?.cs === changeset.datoms[0]?.tx
    if (!self) {
      const members = changeset.datoms.filter(
        (datom) =>
          datom.a !== Attr.changesetCommit &&
          datom.a !== Attr.changesetAbort,
      )
      if (members.length > 0) {
        yield* store.append(members, changeset.envelope)
        yield* projector.project()
      }
    }
    const payload = Schema.encodeSync(PayloadJson)({
      basis: changeset.basis,
      envelope: changeset.envelope,
      datoms: [...changeset.datoms],
    })
    yield* sql`
      INSERT INTO outbox (cs, org, state, rejection, payload)
      VALUES (
        ${changeset.envelope.cs},
        ${changeset.org},
        'pending',
        ${null},
        ${payload}
      )
    `
    yield* outboxTransition(
      'none',
      'pending',
      changeset.envelope.device,
      changeset.envelope.command,
    )
  })

  const pull = Effect.fn('SyncClient.pull')(function* (org: string) {
    yield* noteDevice
    const cursor = yield* readCursor(org)
    const page = yield* rpc.pull({ org, cursor }).pipe(
      Effect.tapError((error) =>
        error._tag === 'MembershipMissing' ? markRevoked(org) : Effect.void,
      ),
    )
    yield* clearRevoked(org)
    const byCs = new Map<string, Array<(typeof page.datoms)[number]>>()
    for (const datom of page.datoms) {
      const list = byCs.get(datom.cs) ?? []
      list.push(datom)
      byCs.set(datom.cs, list)
    }
    for (const envelope of page.envelopes) {
      const batch = (byCs.get(envelope.cs) ?? [])
        .slice()
        .sort((left, right) => left.seq - right.seq)
      if (batch.length === 0) continue
      yield* store.append(
        batch.map((datom) => ({
          e: datom.e,
          a: datom.a,
          v: datom.v,
          tx: datom.tx,
          op: datom.op,
          cs: datom.cs,
        })),
        envelope,
      )
    }
    yield* writeCursor(org, page.cursor)
    yield* projector.project()
    return page.cursor
  })

  const push = Effect.fn('SyncClient.push')(function* (org: string) {
    yield* noteDevice
    const rows = yield* sql<{
      cs: string
      state: string
      payload: string
    }>`
      SELECT cs, state, payload FROM outbox
      WHERE org = ${org} AND state IN ('pending', 'waiting-file')
      ORDER BY id
    `
    const acked: string[] = []
    const rejected: Array<{ cs: string; tag: string }> = []
    const waiting: Array<{ cs: string; hash: string }> = []
    let rebuilt = false
    let revoked = false
    for (const row of rows) {
      const decoded = Schema.decodeUnknownSync(PayloadJson)(row.payload)
      const outcome = yield* rpc
        .append({
          org,
          basis: decoded.basis,
          envelope: decoded.envelope,
          datoms: decoded.datoms,
        })
        .pipe(
          Effect.map((ack) => ({ _tag: 'acked' as const, cursor: ack.cursor })),
          Effect.catchTag('FileMissing', (error) =>
            Effect.succeed({ _tag: 'waiting' as const, hash: error.hash }),
          ),
          // A rejection judges this changeset. An authentication failure does
          // not: it stops the push and the outbox stays as it is.
          Effect.catchIf(Schema.is(Rejection), (error) =>
            Effect.succeed({ _tag: 'rejected' as const, tag: error._tag }),
          ),
        )
      if (outcome._tag === 'acked') {
        yield* sql`
          UPDATE outbox SET state = 'acked', rejection = ${null} WHERE cs = ${row.cs}
        `
        acked.push(row.cs)
        yield* outboxTransition(
          row.state,
          'acked',
          decoded.envelope.device,
          decoded.envelope.command,
        )
        continue
      }
      if (outcome._tag === 'waiting') {
        yield* sql`
          UPDATE outbox SET state = 'waiting-file', rejection = ${outcome.hash}
          WHERE cs = ${row.cs}
        `
        waiting.push({ cs: row.cs, hash: outcome.hash })
        yield* outboxTransition(
          row.state,
          'waiting-file',
          decoded.envelope.device,
          decoded.envelope.command,
        )
        continue
      }
      const opened = decoded.datoms.some((datom) => datom.cs !== datom.tx)
      if (opened) yield* abortLocal(decoded, outcome.tag)
      yield* sql`
        UPDATE outbox SET state = 'rejected', rejection = ${outcome.tag}
        WHERE cs = ${row.cs}
      `
      yield* projector.rebuild()
      rebuilt = true
      rejected.push({ cs: row.cs, tag: outcome.tag })
      yield* outboxTransition(
        row.state,
        'rejected',
        decoded.envelope.device,
        decoded.envelope.command,
      )
      if (outcome.tag === 'MembershipMissing') {
        yield* markRevoked(org)
        revoked = true
      }
    }
    if (!revoked) yield* pull(org)
    return { acked, rejected, waiting, rebuilt } satisfies PushResult
  })

  const upload = Effect.fn('SyncClient.upload')(function* (
    org: string,
    text: string,
  ) {
    yield* noteDevice
    const hash = yield* blobHash(text)
    yield* rpc.putBlob({ org, hash, text })
    return hash
  })

  return SyncClient.of({ submit, push, pull, upload })
})

const outboxTransition = (
  from: string,
  state: string,
  device: string,
  command: string,
) =>
  Effect.void.pipe(
    Effect.withSpan('SyncClient.outbox', {
      attributes: {
        'outbox.from': from,
        'outbox.state': state,
        'sync.device': device,
        'sync.command': command,
      },
    }),
  )

export const syncClientLayer = (catalog: Catalog) =>
  Layer.effect(SyncClient, makeClient).pipe(
    Layer.provideMerge(projectorLayer(catalog)),
    Layer.provideMerge(Reactivity.layer),
  )
