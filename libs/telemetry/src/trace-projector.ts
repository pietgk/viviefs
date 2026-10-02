/**
 * Trace projector (D32, P10). Reads the log from its trace cursor, derives
 * durable spans from the end facts it finds, sends them to the trace sink,
 * and advances the cursor only after the sink acknowledged (acknowledged
 * cursor).
 *
 * The trace cursor is the log store's acknowledged cursor for the consumer
 * `trace/<sink>`, registered when the projector starts. Compaction never
 * removes a fact a registered trace cursor has not exported: a sink that
 * stays down holds compaction back and is named by `compact().heldBy`,
 * instead of losing spans. A disabled projector is still registered, so
 * enabling it later exports the whole backlog.
 *
 * Delivery is at least once: a kill between `send` and the cursor write
 * sends the same spans again with the same entity-keyed ids.
 */
import { LogStore, type Cursor, type EnvelopeType, type StoredDatomType } from '@viviefs/datom'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type { SqlError } from 'effect/sql/SqlError'
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
    /** One tick: read one batch from the cursor, derive, send, advance. */
    readonly exportOnce: Effect.Effect<ExportResult, SinkRejected | SqlError>
    readonly cursor: Effect.Effect<Cursor, SqlError>
  }
>()('viviefs/telemetry/TraceProjector') {}

/** The log store consumer id of a sink's trace cursor. */
export const traceConsumer = (sink: string): string => `trace/${sink}`

/** Log entries read per tick, so a long backlog never loads at once. */
export const DEFAULT_TRACE_BATCH = 1000

export const traceProjectorLayer = (options: {
  readonly enabled: boolean
  readonly batch?: number
}): Layer.Layer<TraceProjector, SqlError, LogStore | TraceSink> =>
  Layer.effect(
    TraceProjector,
    Effect.gen(function* () {
      const store = yield* LogStore
      const sink = yield* TraceSink
      const consumer = traceConsumer(sink.name)
      if ((yield* store.acknowledged(consumer)) === null) {
        yield* store.acknowledge(consumer, 0)
      }

      const cursor = store
        .acknowledged(consumer)
        .pipe(Effect.map((seq) => seq ?? 0))

      const advance = (seq: Cursor) => store.acknowledge(consumer, seq)

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
        const batch = yield* store.streamFrom(from, options.batch ?? DEFAULT_TRACE_BATCH)
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
