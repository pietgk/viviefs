import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import { HlcClock, HlcDevice, HlcEntropy } from './clock.ts'
import {
  compareHlc,
  correctedNow,
  decodeHlc,
  fingerprintDevice,
  mintHlc,
  receiveHlc,
  type BootSession,
  type Hlc,
  type Tx,
} from './hlc.ts'
import { migrateLogStore } from './migrate.ts'
import { DatomRow, SqlNumber, rowsOf } from './rows.ts'
import {
  FutureSkew,
  InvalidTx,
  type AppendResult,
  type CompactResult,
  type Cursor,
  type Datom,
  type Envelope,
  type StoredDatom,
} from './schema.ts'

// #region service
export class LogStore extends Context.Service<
  LogStore,
  {
    readonly mint: () => Effect.Effect<Tx, SqlError>
    readonly receive: (
      tx: string,
    ) => Effect.Effect<void, FutureSkew | InvalidTx | SqlError>
    readonly append: (
      datoms: ReadonlyArray<Datom>,
      envelope: Envelope,
    ) => Effect.Effect<
      AppendResult,
      FutureSkew | InvalidTx | SqlError
    >
    readonly envelope: (
      cs: string,
    ) => Effect.Effect<Envelope | null, SqlError>
    /** Facts after `cursor` in log order, at most `limit` when given. */
    readonly streamFrom: (
      cursor: Cursor,
      limit?: number,
    ) => Effect.Effect<ReadonlyArray<StoredDatom>, SqlError>
    readonly scanPrefix: (
      prefix: string,
    ) => Effect.Effect<ReadonlyArray<StoredDatom>, SqlError>
    /**
     * Record that a consumer has seen the log up to `cursor`. A consumer is
     * a device, or a trace sink (`trace/<sink>`); compaction never removes
     * a fact some registered consumer has not acknowledged.
     */
    readonly acknowledge: (
      consumer: string,
      cursor: Cursor,
    ) => Effect.Effect<void, SqlError>
    /** A consumer's acknowledged cursor, or null when it is not registered. */
    readonly acknowledged: (
      consumer: string,
    ) => Effect.Effect<Cursor | null, SqlError>
    readonly horizon: () => Effect.Effect<Cursor, SqlError>
    readonly compact: () => Effect.Effect<CompactResult, SqlError>
  }
>()('viviefs/datom/LogStore') {}
// #endregion service

type PersistedHlc = {
  last: Hlc | null
  offsetMs: number
}

const asSeq = (value: unknown): number => Number(value)

const HlcStateRow = Schema.Struct({
  last_pt: SqlNumber,
  last_c: SqlNumber,
  last_tx: Schema.String,
  offset_ms: SqlNumber,
})

const SeqRow = Schema.Struct({ seq: SqlNumber })

const ChangesetRow = Schema.Struct({
  cs: Schema.String,
  actor: Schema.String,
  device: Schema.String,
  lease_epoch: Schema.NullOr(SqlNumber),
  trace_id: Schema.String,
  span_id: Schema.String,
  sampled: SqlNumber,
  command: Schema.String,
  accepted_at: Schema.NullOr(SqlNumber),
})

const DeviceRow = Schema.Struct({ device: Schema.String })

const HorizonRow = Schema.Struct({ horizon: Schema.NullOr(SqlNumber) })

const ChangesRow = Schema.Struct({ n: SqlNumber })

const escapeLike = (value: string): string =>
  value.replace(/!/g, '!!').replace(/%/g, '!%').replace(/_/g, '!_')

const readStored = (row: typeof DatomRow.Type): StoredDatom => ({
  seq: asSeq(row.seq),
  e: row.e,
  a: row.a,
  v: row.v,
  tx: row.tx as StoredDatom['tx'],
  op: row.op,
  cs: row.cs,
})

export const layer = Layer.effect(
  LogStore,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const clock = yield* HlcClock
    const device = yield* HlcDevice
    const entropy = yield* HlcEntropy
    yield* migrateLogStore
    const deviceFp = fingerprintDevice(device.id)
    let boot: BootSession | null = null

    const load = (): Effect.Effect<PersistedHlc, SqlError> =>
      Effect.gen(function* () {
        const rows = yield* sql`SELECT last_pt, last_c, last_tx, offset_ms FROM hlc_state WHERE id = 1`.pipe(
          rowsOf(HlcStateRow),
        )
        const row = rows[0]
        if (!row) return { last: null, offsetMs: 0 }
        const tx = row.last_tx as Tx
        const parts = decodeHlc(tx)
        return {
          offsetMs: asSeq(row.offset_ms),
          last: parts
            ? { pt: parts.pt, c: parts.c, tx }
            : {
                pt: asSeq(row.last_pt),
                c: asSeq(row.last_c),
                tx,
              },
        }
      })

    const save = (state: PersistedHlc & { last: Hlc }) =>
      sql`
        INSERT INTO hlc_state (id, last_pt, last_c, last_tx, offset_ms)
        VALUES (1, ${state.last.pt}, ${state.last.c}, ${state.last.tx}, ${state.offsetMs})
        ON CONFLICT (id) DO UPDATE SET
          last_pt = ${state.last.pt},
          last_c = ${state.last.c},
          last_tx = ${state.last.tx},
          offset_ms = ${state.offsetMs}
      `

    const nowAndBoot = (state: PersistedHlc) => {
      const next = correctedNow({
        wallMs: clock.wallMs(),
        monotonicMs: clock.monotonicMs(),
        offsetMs: state.offsetMs,
        lastPt: state.last?.pt ?? 0,
        boot,
      })
      boot = next.boot
      return next.now
    }

    const mint = Effect.fn('LogStore.mint')(function* () {
      const state = yield* load()
      const now = nowAndBoot(state)
      const hlc = mintHlc({
        now,
        last: state.last,
        deviceFp,
        random: entropy.nextUint32(),
      })
      yield* save({ ...state, last: hlc })
      return hlc.tx
    })

    const applyRemote = (state: PersistedHlc, tx: string) => {
      const now = nowAndBoot(state)
      const received = receiveHlc({ last: state.last, remoteTx: tx, now })
      if (received._tag === 'invalid_tx') {
        return Effect.fail(new InvalidTx({ tx }))
      }
      if (received._tag === 'future_skew') {
        return Effect.fail(
          new FutureSkew({
            pt: received.pt,
            now: received.now,
            boundMs: received.boundMs,
          }),
        )
      }
      return Effect.succeed({ ...state, last: received.last })
    }

    const receive = Effect.fn('LogStore.receive')(function* (tx: string) {
      const state = yield* load()
      const next = yield* applyRemote(state, tx)
      if (next.last && (!state.last || compareHlc(next.last, state.last) !== 0)) {
        yield* save({ ...next, last: next.last })
      }
    })

    // #region append
    const append = Effect.fn('LogStore.append')(function* (
      datoms: ReadonlyArray<Datom>,
      envelope: Envelope,
    ) {
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          let state = yield* load()
          for (const datom of datoms) {
            const next = yield* applyRemote(state, datom.tx)
            state = next
          }
          if (state.last) yield* save({ ...state, last: state.last })

          yield* sql`
            INSERT INTO changesets (
              cs, actor, device, lease_epoch, trace_id, span_id, sampled, command,
              accepted_at
            ) VALUES (
              ${envelope.cs},
              ${envelope.actor},
              ${envelope.device},
              ${envelope.leaseEpoch},
              ${envelope.traceId},
              ${envelope.spanId},
              ${envelope.sampled ? 1 : 0},
              ${envelope.command},
              ${envelope.acceptedAt}
            )
            ON CONFLICT (cs) DO UPDATE SET accepted_at = excluded.accepted_at
            WHERE changesets.accepted_at IS NULL
          `

          let inserted = 0
          let duplicates = 0
          for (const datom of datoms) {
            const rows = yield* sql`
              INSERT INTO datoms (e, a, v, tx, op, cs)
              VALUES (
                ${datom.e},
                ${datom.a},
                ${datom.v},
                ${datom.tx},
                ${datom.op},
                ${datom.cs}
              )
              ON CONFLICT (tx) DO NOTHING
              RETURNING seq
            `.pipe(rowsOf(SeqRow))
            if (rows.length === 0) duplicates += 1
            else inserted += 1
          }
          return { inserted, duplicates } satisfies AppendResult
        }),
      )
    })
    // #endregion append

    const envelope = Effect.fn('LogStore.envelope')(function* (cs: string) {
      const rows = yield* sql`
        SELECT cs, actor, device, lease_epoch, trace_id, span_id, sampled, command,
          accepted_at
        FROM changesets
        WHERE cs = ${cs}
      `.pipe(rowsOf(ChangesetRow))
      const row = rows[0]
      if (!row) return null
      return {
        cs: row.cs,
        actor: row.actor,
        device: row.device,
        leaseEpoch: row.lease_epoch == null ? null : asSeq(row.lease_epoch),
        traceId: row.trace_id,
        spanId: row.span_id,
        sampled: asSeq(row.sampled) === 1,
        command: row.command,
        acceptedAt: row.accepted_at == null ? null : asSeq(row.accepted_at),
      } satisfies Envelope
    })

    // #region stream-from
    const streamFrom = Effect.fn('LogStore.streamFrom')(function* (
      cursor: Cursor,
      limit?: number,
    ) {
      const rows = yield* sql`
        SELECT seq, e, a, v, tx, op, cs
        FROM datoms
        WHERE seq > ${cursor}
        ORDER BY seq
        ${limit === undefined ? sql`` : sql`LIMIT ${limit}`}
      `.pipe(rowsOf(DatomRow))
      return rows.map(readStored)
    })
    // #endregion stream-from

    const scanPrefix = Effect.fn('LogStore.scanPrefix')(function* (
      prefix: string,
    ) {
      const pattern = `${escapeLike(prefix)}%`
      const rows = yield* sql`
        SELECT seq, e, a, v, tx, op, cs
        FROM datoms
        WHERE e LIKE ${pattern} ESCAPE '!'
        ORDER BY e, a, tx
      `.pipe(rowsOf(DatomRow))
      return rows.map(readStored)
    })

    const acknowledge = Effect.fn('LogStore.acknowledge')(function* (
      consumer: string,
      cursor: Cursor,
    ) {
      yield* sql`
        INSERT INTO device_cursors (device, seq)
        VALUES (${consumer}, ${cursor})
        ON CONFLICT (device) DO UPDATE SET seq = ${cursor}
      `
    })

    const acknowledged = Effect.fn('LogStore.acknowledged')(function* (
      consumer: string,
    ) {
      const rows = yield* sql`
        SELECT seq FROM device_cursors WHERE device = ${consumer}
      `.pipe(rowsOf(SeqRow))
      const value = rows[0]?.seq
      return value == null ? null : asSeq(value)
    })

    // #region compact
    const holder = Effect.gen(function* () {
      const rows = yield* sql`
        SELECT device FROM device_cursors ORDER BY seq ASC, device ASC LIMIT 1
      `.pipe(rowsOf(DeviceRow))
      return rows[0]?.device ?? null
    })

    const horizon = Effect.fn('LogStore.horizon')(function* () {
      const rows = yield* sql`
        SELECT MIN(seq) AS horizon FROM device_cursors
      `.pipe(rowsOf(HorizonRow))
      const value = rows[0]?.horizon
      return value == null ? 0 : asSeq(value)
    })

    const compact = Effect.fn('LogStore.compact')(function* () {
      const at = yield* horizon()
      const heldBy = yield* holder
      if (at === 0) return { removed: 0, horizon: at, heldBy } satisfies CompactResult
      const removed = yield* sql.onDialectOrElse({
        sqlite: () =>
          Effect.gen(function* () {
            yield* sql`DELETE FROM datoms WHERE seq <= ${at}`
            const rows = yield* sql`SELECT changes() AS n`.pipe(rowsOf(ChangesRow))
            return asSeq(rows[0]?.n ?? 0)
          }),
        pg: () =>
          Effect.gen(function* () {
            const rows = yield* sql`
              DELETE FROM datoms WHERE seq <= ${at} RETURNING seq
            `.pipe(rowsOf(SeqRow))
            return rows.length
          }),
        orElse: () =>
          Effect.gen(function* () {
            yield* sql`DELETE FROM datoms WHERE seq <= ${at}`
            const rows = yield* sql`SELECT changes() AS n`.pipe(rowsOf(ChangesRow))
            return asSeq(rows[0]?.n ?? 0)
          }),
      })
      return { removed, horizon: at, heldBy } satisfies CompactResult
    })
    // #endregion compact

    return LogStore.of({
      mint,
      receive,
      append,
      envelope,
      streamFrom,
      scanPrefix,
      acknowledge,
      acknowledged,
      horizon,
      compact,
    })
  }),
)
