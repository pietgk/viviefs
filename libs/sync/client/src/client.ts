/**
 * Device sync: outbox up, organization cursor down.
 * Optimistic domain changesets are open locally until the server
 * acknowledges the commit. A typed rejection aborts the open
 * changeset, rebuilds read models, and leaves the rest of the
 * outbox to be pushed.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as Reactivity from 'effect/unstable/reactivity/Reactivity'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import { blobHash } from '@viviefs/blobs'
import {
  Attr,
  Datom,
  Envelope,
  FutureSkew,
  InvalidTx,
  LogStore,
  Projector,
  projectorLayer,
  type Catalog,
} from '@viviefs/datom'
import {
  BlobHashMismatch,
  OrgMismatch,
  type AppendAck,
  type AppendRequest,
  type PullPage,
  type Rejection,
} from '@viviefs/sync-protocol'

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

type RpcShape = {
  readonly Append: (
    request: AppendRequest,
  ) => Effect.Effect<AppendAck, Rejection>
  readonly Pull: (request: {
    readonly org: string
    readonly cursor: number
  }) => Stream.Stream<PullPage, never>
  readonly PutBlob: (request: {
    readonly org: string
    readonly hash: string
    readonly text: string
  }) => Effect.Effect<
    { readonly hash: string },
    BlobHashMismatch | OrgMismatch
  >
}

export class SyncRpc extends Context.Service<
  SyncRpc,
  {
    readonly append: (
      request: AppendRequest,
    ) => Effect.Effect<AppendAck, Rejection>
    readonly pull: (request: {
      readonly org: string
      readonly cursor: number
    }) => Effect.Effect<PullPage>
    readonly putBlob: (request: {
      readonly org: string
      readonly hash: string
      readonly text: string
    }) => Effect.Effect<
      { readonly hash: string },
      BlobHashMismatch | OrgMismatch
    >
  }
>()('viviefs/sync/SyncRpc') {}

export const syncRpcLayer = (client: RpcShape): Layer.Layer<SyncRpc> =>
  Layer.succeed(
    SyncRpc,
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
    }),
  )

export class SyncClient extends Context.Service<
  SyncClient,
  {
    readonly submit: (
      changeset: Outgoing,
    ) => Effect.Effect<void, FutureSkew | InvalidTx | SqlError>
    readonly push: (
      org: string,
    ) => Effect.Effect<
      PushResult,
      FutureSkew | InvalidTx | SqlError | Rejection
    >
    readonly pull: (
      org: string,
    ) => Effect.Effect<number, FutureSkew | InvalidTx | SqlError>
    readonly upload: (
      org: string,
      text: string,
    ) => Effect.Effect<string, BlobHashMismatch | OrgMismatch>
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
  yield* migrate

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
    changeset: Outgoing,
  ) {
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
  })

  const pull = Effect.fn('SyncClient.pull')(function* (org: string) {
    const cursor = yield* readCursor(org)
    const page = yield* rpc.pull({ org, cursor })
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
    const rows = yield* sql<{
      cs: string
      payload: string
    }>`
      SELECT cs, payload FROM outbox
      WHERE org = ${org} AND state IN ('pending', 'waiting-file')
      ORDER BY id
    `
    const acked: string[] = []
    const rejected: Array<{ cs: string; tag: string }> = []
    const waiting: Array<{ cs: string; hash: string }> = []
    let rebuilt = false
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
          Effect.catch((error) =>
            Effect.succeed({ _tag: 'rejected' as const, tag: error._tag }),
          ),
        )
      if (outcome._tag === 'acked') {
        yield* sql`
          UPDATE outbox SET state = 'acked', rejection = ${null} WHERE cs = ${row.cs}
        `
        acked.push(row.cs)
        continue
      }
      if (outcome._tag === 'waiting') {
        yield* sql`
          UPDATE outbox SET state = 'waiting-file', rejection = ${outcome.hash}
          WHERE cs = ${row.cs}
        `
        waiting.push({ cs: row.cs, hash: outcome.hash })
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
    }
    yield* pull(org)
    return { acked, rejected, waiting, rebuilt } satisfies PushResult
  })

  const upload = Effect.fn('SyncClient.upload')(function* (
    org: string,
    text: string,
  ) {
    const hash = yield* blobHash(text)
    yield* rpc.putBlob({ org, hash, text })
    return hash
  })

  return SyncClient.of({ submit, push, pull, upload })
})

export const syncClientLayer = (catalog: Catalog) =>
  Layer.effect(SyncClient, makeClient).pipe(
    Layer.provideMerge(projectorLayer(catalog)),
    Layer.provideMerge(Reactivity.layer),
  )
