/**
 * Trace projector (D32, P10). Reads the log from its trace cursor, derives
 * durable spans from the end facts it finds, sends them to the trace sink,
 * and advances the cursor only after the sink acknowledged (acknowledged
 * cursor). One cursor per sink name, in `trace_cursors` next to the log.
 *
 * Delivery is at least once: a kill between `send` and the cursor write
 * sends the same spans again with the same entity-keyed ids.
 *
 * A disabled projector leaves its cursor where it is. The facts stay in the
 * log, so enabling it later exports the backlog.
 */
import { LogStore, type Cursor, type EnvelopeType, type StoredDatomType } from '@viviefs/datom'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import {
  END_ATTRIBUTES,
  executionEntityOf,
  spanForEndFact,
  type DurableSpan,
} from './durable-spans.ts'
import { TraceSink, type SinkRejected } from './trace-sink.ts'

export type ExportResult = {
  readonly enabled: boolean
  /** Durable spans the sink acknowledged in this tick. */
  readonly spans: ReadonlyArray<DurableSpan>
  readonly cursor: Cursor
}

export class TraceProjector extends Context.Service<
  TraceProjector,
  {
    /** One tick: read from the cursor, derive, send, advance. */
    readonly exportOnce: Effect.Effect<ExportResult, SinkRejected | SqlError>
    readonly cursor: Effect.Effect<Cursor, SqlError>
  }
>()('viviefs/telemetry/TraceProjector') {}

const migrate = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.onDialectOrElse({
    pg: () => sql`CREATE TABLE IF NOT EXISTS trace_cursors (
      sink TEXT PRIMARY KEY,
      seq BIGINT NOT NULL
    )`,
    orElse: () => sql`CREATE TABLE IF NOT EXISTS trace_cursors (
      sink TEXT PRIMARY KEY,
      seq INTEGER NOT NULL
    )`,
  })
})

export const traceProjectorLayer = (options: {
  readonly enabled: boolean
}): Layer.Layer<
  TraceProjector,
  SqlError,
  LogStore | SqlClient.SqlClient | TraceSink
> =>
  Layer.effect(
    TraceProjector,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const store = yield* LogStore
      const sink = yield* TraceSink
      yield* migrate

      const cursor = Effect.gen(function* () {
        const rows = yield* sql<{ seq: unknown }>`
          SELECT seq FROM trace_cursors WHERE sink = ${sink.name}
        `
        return Number(rows[0]?.seq ?? 0)
      })

      const advance = (seq: Cursor) =>
        sql`
          INSERT INTO trace_cursors (sink, seq) VALUES (${sink.name}, ${seq})
          ON CONFLICT (sink) DO UPDATE SET seq = ${seq}
        `

      const derive = (batch: ReadonlyArray<StoredDatomType>) =>
        Effect.gen(function* () {
          const ends = new Map<string, Array<StoredDatomType>>()
          for (const row of batch) {
            if (!END_ATTRIBUTES.has(row.a)) continue
            const execution = executionEntityOf(row.e)
            if (!execution) continue
            const list = ends.get(execution) ?? []
            list.push(row)
            ends.set(execution, list)
          }
          const spans: Array<DurableSpan> = []
          for (const [execution, endRows] of ends) {
            const rows = yield* store.scanPrefix(execution)
            const envelopes = new Map<string, EnvelopeType | null>()
            for (const row of rows) {
              if (!envelopes.has(row.cs)) {
                envelopes.set(row.cs, yield* store.envelope(row.cs))
              }
            }
            const journal = {
              executionEntity: execution,
              rows,
              envelope: (cs: string) => envelopes.get(cs) ?? undefined,
            }
            for (const end of endRows) {
              const span = spanForEndFact(journal, end)
              if (span) spans.push(span)
            }
          }
          return spans
        })

      const exportOnce = Effect.gen(function* () {
        const from = yield* cursor
        if (!options.enabled) {
          return { enabled: false, spans: [], cursor: from } satisfies ExportResult
        }
        const batch = yield* store.streamFrom(from)
        const last = batch.at(-1)
        if (!last) return { enabled: true, spans: [], cursor: from } satisfies ExportResult
        const spans = yield* derive(batch)
        if (spans.length > 0) yield* sink.send(spans)
        yield* advance(last.seq)
        return { enabled: true, spans, cursor: last.seq } satisfies ExportResult
      }).pipe(Effect.withSpan('TraceProjector.exportOnce'))

      return TraceProjector.of({ exportOnce, cursor })
    }),
  )
