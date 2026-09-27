import { describe, expect, it } from '@effect/vitest'
import * as Exit from 'effect/Exit'
import {
  activityId,
  Attr,
  clockId,
  deferredId,
  encodeHlc,
  executionId,
  type EnvelopeType,
  type StoredDatomType,
} from '@viviefs/datom'
import {
  encodeActivityStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
  spanIdFor,
  traceIdFor,
} from '@viviefs/workflow-engine'
import { executionEntityOf, spanForEndFact } from './durable-spans.ts'
import { toOtlpSpan } from './trace-sink.ts'

const T0 = 1_700_000_000_000
const EXEC = executionId('acme', 'e1')
const STEP1 = activityId('acme', 'e1', 'step-one', 1)
const FETCH1 = activityId('acme', 'e1', 'fetch', 1)
const FETCH2 = activityId('acme', 'e1', 'fetch', 2)
const APPROVAL = deferredId('acme', 'e1', 'approval')
const CLOCK = clockId('acme', 'e1', 'wait')
const CLOCK_DEFERRED = deferredId('acme', 'e1', 'DurableClock/wait')
const CALLER = { traceId: 'c'.repeat(32), spanId: 'd'.repeat(16) }

let seq = 0
const fact = (e: string, a: string, v: string, atMs: number): StoredDatomType => {
  seq += 1
  const tx = encodeHlc(atMs, 0, 1, seq)
  return { seq, e, a, v, tx, op: 'assert', cs: tx }
}

const rows: Array<StoredDatomType> = [
  fact(EXEC, Attr.leaseHolder, encodeLease({ device: 'a', epoch: 1, expiresAtMs: null }), T0),
  fact(EXEC, Attr.workflowStarted, encodeStarted({ name: 'Probe.v1', payload: {} }), T0 + 1),
  fact(STEP1, Attr.activityStarted, encodeActivityStarted({ name: 'step-one', attempt: 1 }), T0 + 10),
  fact(STEP1, Attr.activityExit, encodeExit(Exit.succeed('one')), T0 + 90),
  fact(FETCH1, Attr.activityStarted, encodeActivityStarted({ name: 'fetch', attempt: 1 }), T0 + 100),
  fact(FETCH1, Attr.activityExit, encodeExit(Exit.fail('flaky')), T0 + 120),
  fact(FETCH2, Attr.activityStarted, encodeActivityStarted({ name: 'fetch', attempt: 2 }), T0 + 130),
  fact(FETCH2, Attr.activityExit, encodeExit(Exit.succeed('ok')), T0 + 150),
  fact(APPROVAL, Attr.deferredExit, encodeExit(Exit.void), T0 + 400),
  fact(CLOCK, Attr.clockWakeAt, encodeClock({ workflowName: 'Probe.v1', name: 'wait', deferredName: 'DurableClock/wait', wakeAtMs: T0 + 450 }), T0 + 401),
  fact(CLOCK_DEFERRED, Attr.deferredExit, encodeExit(Exit.void), T0 + 452),
  fact(EXEC, Attr.workflowResult, encodeExit(Exit.succeed('done')), T0 + 500),
]

const byEntity = (entity: string, attribute: string) => {
  const row = rows.find((candidate) => candidate.e === entity && candidate.a === attribute)
  if (!row) throw new Error(`no ${attribute} on ${entity}`)
  return row
}

const envelopes = new Map<string, EnvelopeType>()
const envelope = (cs: string, context: { traceId: string; spanId: string }): EnvelopeType => ({
  cs,
  actor: 'test',
  device: 'a',
  leaseEpoch: null,
  traceId: context.traceId,
  spanId: context.spanId,
  sampled: true,
  command: 'test.command',
  acceptedAt: null,
})
envelopes.set(byEntity(EXEC, Attr.workflowStarted).cs, envelope(byEntity(EXEC, Attr.workflowStarted).cs, CALLER))
envelopes.set(byEntity(APPROVAL, Attr.deferredExit).cs, envelope(byEntity(APPROVAL, Attr.deferredExit).cs, { traceId: 'e'.repeat(32), spanId: 'f'.repeat(16) }))
for (const entity of [STEP1, FETCH1, FETCH2]) {
  for (const attribute of [Attr.activityStarted, Attr.activityExit]) {
    const row = byEntity(entity, attribute)
    envelopes.set(row.cs, envelope(row.cs, { traceId: traceIdFor(EXEC), spanId: spanIdFor(entity) }))
  }
}

const journal = {
  executionEntity: EXEC,
  rows,
  envelope: (cs: string) => envelopes.get(cs),
}

const spanOf = (entity: string, attribute: string) => {
  const span = spanForEndFact(journal, byEntity(entity, attribute))
  if (!span) throw new Error(`no span for ${attribute} on ${entity}`)
  return span
}

describe('durable spans from journal facts', () => {
  it('finds the execution of any journal entity', () => {
    expect(executionEntityOf(FETCH2)).toBe(EXEC)
    expect(executionEntityOf(EXEC)).toBe(EXEC)
    expect(executionEntityOf('Oacme/Llist')).toBeNull()
  })

  it('ends the workflow span at the result, linked to the caller that started it', () => {
    const span = spanOf(EXEC, Attr.workflowResult)
    expect(span).toMatchObject({
      traceId: traceIdFor(EXEC),
      spanId: spanIdFor(EXEC),
      parentSpanId: undefined,
      name: 'workflow Probe.v1',
      startMs: T0 + 1,
      endMs: T0 + 500,
      status: 'ok',
    })
    expect(span.links).toEqual([
      { ...CALLER, attributes: { 'viviefs.link': 'caused-by', 'viviefs.command': 'test.command' } },
    ])
    expect(span.events).toEqual([
      { name: 'lease', timeMs: T0, attributes: { 'viviefs.lease.device': 'a', 'viviefs.lease.epoch': 1 } },
    ])
  })

  it('spans an activity attempt from its start fact to its exit', () => {
    const span = spanOf(STEP1, Attr.activityExit)
    expect(span).toMatchObject({
      traceId: traceIdFor(EXEC),
      spanId: spanIdFor(STEP1),
      parentSpanId: spanIdFor(EXEC),
      name: 'activity step-one #1',
      startMs: T0 + 10,
      endMs: T0 + 90,
      status: 'ok',
      links: [],
    })
  })

  it('marks a failed attempt with its typed error and links the retry to it', () => {
    expect(spanOf(FETCH1, Attr.activityExit)).toMatchObject({ status: 'error', statusMessage: 'flaky' })
    expect(spanOf(FETCH2, Attr.activityExit).links).toEqual([
      { traceId: traceIdFor(EXEC), spanId: spanIdFor(FETCH1), attributes: { 'viviefs.link': 'previous-attempt' } },
    ])
  })

  it('spans a clock from its wake-at fact to the deferred exit it fired', () => {
    expect(spanOf(CLOCK_DEFERRED, Attr.deferredExit)).toMatchObject({
      spanId: spanIdFor(CLOCK),
      parentSpanId: spanIdFor(EXEC),
      name: 'clock wait',
      startMs: T0 + 401,
      endMs: T0 + 452,
    })
  })

  it('makes a zero-length deferred span linked to whoever completed it', () => {
    const span = spanOf(APPROVAL, Attr.deferredExit)
    expect(span).toMatchObject({
      spanId: spanIdFor(APPROVAL),
      name: 'deferred approval',
      startMs: T0 + 400,
      endMs: T0 + 400,
    })
    expect(span.links.map((link) => link.spanId)).toEqual(['f'.repeat(16)])
  })

  it('makes no span from start facts, leases or clocks on their own', () => {
    for (const row of rows) {
      if (
        row.a === Attr.activityStarted ||
        row.a === Attr.workflowStarted ||
        row.a === Attr.leaseHolder ||
        row.a === Attr.clockWakeAt
      ) {
        expect(spanForEndFact(journal, row)).toBeNull()
      }
    }
  })

  it('keeps an end fact whose start fact is missing, and says so', () => {
    const without = { ...journal, rows: rows.filter((row) => row.a !== Attr.activityStarted) }
    const span = spanForEndFact(without, byEntity(STEP1, Attr.activityExit))
    expect(span).toMatchObject({ startMs: T0 + 90, endMs: T0 + 90 })
    expect(span?.attributes['viviefs.start.missing']).toBe(true)
  })

  it('derives the same spans from the same journal', () => {
    const ends = rows.filter((row) => row.a === Attr.activityExit || row.a === Attr.workflowResult)
    const first = ends.map((row) => spanForEndFact(journal, row))
    const second = ends.map((row) => spanForEndFact({ ...journal, rows: [...rows] }, row))
    expect(second).toEqual(first)
  })
})

describe('OTLP encoding of a durable span', () => {
  it('writes nanosecond times, status, parent and links', () => {
    const otlp = toOtlpSpan(spanOf(FETCH1, Attr.activityExit))
    expect(otlp).toMatchObject({
      traceId: traceIdFor(EXEC),
      spanId: spanIdFor(FETCH1),
      parentSpanId: spanIdFor(EXEC),
      startTimeUnixNano: `${T0 + 100}000000`,
      endTimeUnixNano: `${T0 + 120}000000`,
      status: { code: 2, message: 'flaky' },
    })
    expect(toOtlpSpan(spanOf(FETCH2, Attr.activityExit)).links[0]?.spanId).toBe(spanIdFor(FETCH1))
  })

  it('describes a structured typed error as JSON', () => {
    const tagged = { ...byEntity(FETCH1, Attr.activityExit), v: encodeExit(Exit.fail({ _tag: 'CheckFailed', reason: 'x' })) }
    expect(spanForEndFact(journal, tagged)?.statusMessage).toBe('{"_tag":"CheckFailed","reason":"x"}')
  })
})
