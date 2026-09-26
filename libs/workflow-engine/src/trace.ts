/**
 * Entity-keyed ids for durable spans (D32). A journal entity id already
 * encodes the execution, the activity name and the attempt, so the span id
 * is a hash of that entity id. A replay, a relaunch or a second device
 * derives the same ids without reading anything but the id. One trace per
 * execution: the trace id is a hash of the execution entity id.
 *
 * Hashing is synchronous (`@noble/hashes`): `crypto.subtle.digest` does not
 * complete inside an activity fiber (P06) and is a polyfill on Hermes.
 */
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'

export type TraceContext = {
  readonly traceId: string
  readonly spanId: string
  readonly sampled: boolean
}

const TRACE_ID = /^[0-9a-f]{32}$/
const SPAN_ID = /^[0-9a-f]{16}$/

/** Ids of all zeros are invalid in W3C trace context and OTLP. */
const nonZero = (hex: string): string =>
  /^0+$/.test(hex) ? `${hex.slice(0, -1)}1` : hex

const digest = (domain: string, value: string): string =>
  bytesToHex(sha256(utf8ToBytes(`${domain}\u0000${value}`)))

export const traceIdFor = (executionEntity: string): string =>
  nonZero(digest('viviefs/trace', executionEntity).slice(0, 32))

export const spanIdFor = (entity: string): string =>
  nonZero(digest('viviefs/span', entity).slice(0, 16))

/** The durable span that a journal entity belongs to. */
export const durableContext = (
  executionEntity: string,
  entity: string,
): TraceContext => ({
  traceId: traceIdFor(executionEntity),
  spanId: spanIdFor(entity),
  sampled: true,
})

/** True when an envelope carries a real span context, not a placeholder. */
export const isRecordedContext = (context: {
  readonly traceId: string
  readonly spanId: string
}): boolean =>
  TRACE_ID.test(context.traceId) &&
  SPAN_ID.test(context.spanId) &&
  !/^0+$/.test(context.traceId) &&
  !/^0+$/.test(context.spanId)

/**
 * The causing span of a write an outside caller asked for: the caller's
 * live span when there is one to record. Noop spans (tracer disabled) and
 * placeholder ids fall back to `fallback`, the durable span.
 */
export const callerContext = (
  fallback: TraceContext,
): Effect.Effect<TraceContext> =>
  Effect.option(Effect.currentParentSpan).pipe(
    Effect.map((span) => {
      if (Option.isNone(span)) return fallback
      const context = {
        traceId: span.value.traceId,
        spanId: span.value.spanId,
        sampled: span.value.sampled,
      }
      return isRecordedContext(context) ? context : fallback
    }),
  )
