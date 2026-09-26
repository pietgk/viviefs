import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Tracer from 'effect/Tracer'
import {
  callerContext,
  durableContext,
  isRecordedContext,
  spanIdFor,
  traceIdFor,
} from './trace.ts'

const EXECUTION = 'Oacme/Wabc123'
const ATTEMPT = `${EXECUTION}/Astep-one#1`

describe('entity-keyed ids', () => {
  it('derives the same ids from the same entity id', () => {
    expect(traceIdFor(EXECUTION)).toBe(traceIdFor(EXECUTION))
    expect(spanIdFor(ATTEMPT)).toBe(spanIdFor(ATTEMPT))
  })

  it('has OTLP shape and is never all zeros', () => {
    expect(traceIdFor(EXECUTION)).toMatch(/^[0-9a-f]{32}$/)
    expect(spanIdFor(ATTEMPT)).toMatch(/^[0-9a-f]{16}$/)
    expect(isRecordedContext(durableContext(EXECUTION, ATTEMPT))).toBe(true)
  })

  it('separates attempts, entities and the trace domain', () => {
    expect(spanIdFor(`${EXECUTION}/Astep-one#2`)).not.toBe(spanIdFor(ATTEMPT))
    expect(spanIdFor(EXECUTION)).not.toBe(traceIdFor(EXECUTION).slice(0, 16))
    expect(traceIdFor('Oother/Wabc123')).not.toBe(traceIdFor(EXECUTION))
  })

  it('puts every span of an execution in the execution trace', () => {
    const context = durableContext(EXECUTION, ATTEMPT)
    expect(context).toEqual({
      traceId: traceIdFor(EXECUTION),
      spanId: spanIdFor(ATTEMPT),
      sampled: true,
    })
  })

  it('rejects placeholder and malformed contexts', () => {
    expect(
      isRecordedContext({ traceId: '0'.repeat(32), spanId: '0'.repeat(16) }),
    ).toBe(false)
    expect(isRecordedContext({ traceId: 'noop', spanId: 'noop' })).toBe(false)
    expect(
      isRecordedContext({ traceId: 'A'.repeat(32), spanId: 'b'.repeat(16) }),
    ).toBe(false)
  })
})

describe('causing span of a caller write', () => {
  const fallback = durableContext(EXECUTION, EXECUTION)

  it.effect('is the durable span when there is no live span', () =>
    Effect.gen(function* () {
      expect(yield* callerContext(fallback)).toEqual(fallback)
    }),
  )

  it.effect('is the caller live span inside Effect.withSpan', () =>
    Effect.gen(function* () {
      const span = yield* Effect.currentSpan
      const context = yield* callerContext(fallback)
      expect(context).toEqual({
        traceId: span.traceId,
        spanId: span.spanId,
        sampled: span.sampled,
      })
    }).pipe(Effect.withSpan('caller')),
  )

  it.effect('falls back when live tracing is off', () =>
    Effect.gen(function* () {
      expect(yield* callerContext(fallback)).toEqual(fallback)
    }).pipe(Effect.withSpan('noop'), Effect.withTracerEnabled(false)),
  )

  it.effect('uses an external parent span', () =>
    Effect.gen(function* () {
      expect(yield* callerContext(fallback)).toEqual({
        traceId: 'c'.repeat(32),
        spanId: 'd'.repeat(16),
        sampled: true,
      })
    }).pipe(
      Effect.withParentSpan(
        Tracer.externalSpan({
          traceId: 'c'.repeat(32),
          spanId: 'd'.repeat(16),
          sampled: true,
        }),
      ),
    ),
  )
})
