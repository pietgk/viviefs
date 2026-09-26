/**
 * Durable spans derived from journal facts (D32). Pure: the trace projector
 * loads an execution's journal and envelopes, and this module decides which
 * spans the end facts in a batch produce. See the P10 design review,
 * section 3, for the mapping.
 *
 * - `workflow/result` ends the workflow span, started by `workflow/started`.
 * - `activity/exit` ends an activity attempt span, started by
 *   `activity/started`. Attempt n links attempt n - 1.
 * - `deferred/exit` fired by a clock ends the clock span, started by
 *   `clock/wake-at`. Any other `deferred/exit` is a zero-length deferred
 *   span: nothing journals when the body started waiting.
 * - Lease holder facts are events on the workflow span.
 *
 * A span links its causing span when the envelope names a caller's live
 * span rather than the span itself.
 */
import {
  Attr,
  decodeHlc,
  decodeIdSegment,
  encodeIdSegment,
  type EnvelopeType,
  type StoredDatomType,
} from '@viviefs/datom'
import {
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  isRecordedContext,
  spanIdFor,
  traceIdFor,
} from '@viviefs/workflow-engine'
import * as Cause from 'effect/Cause'

export type AttributeValue = string | number | boolean

export type DurableSpan = {
  readonly traceId: string
  readonly spanId: string
  readonly parentSpanId: string | undefined
  readonly name: string
  readonly startMs: number
  readonly endMs: number
  readonly status: 'ok' | 'error'
  readonly statusMessage: string | undefined
  readonly attributes: Readonly<Record<string, AttributeValue>>
  readonly links: ReadonlyArray<{
    readonly traceId: string
    readonly spanId: string
    readonly attributes: Readonly<Record<string, AttributeValue>>
  }>
  readonly events: ReadonlyArray<{
    readonly name: string
    readonly timeMs: number
    readonly attributes: Readonly<Record<string, AttributeValue>>
  }>
}

/** The facts whose arrival ends a durable span. */
export const END_ATTRIBUTES: ReadonlySet<string> = new Set([
  Attr.workflowResult,
  Attr.activityExit,
  Attr.deferredExit,
])

const EXECUTION = /^(O[^/]+\/W[^/]+)(?:\/|$)/

/** `O{org}/W{exec}` for any journal entity, or null for other entities. */
export const executionEntityOf = (entity: string): string | null =>
  entity.match(EXECUTION)?.[1] ?? null

export type ExecutionJournal = {
  readonly executionEntity: string
  /** Every fact under the execution prefix. */
  readonly rows: ReadonlyArray<StoredDatomType>
  readonly envelope: (cs: string) => EnvelopeType | undefined
}

const timeOf = (row: StoredDatomType): number => decodeHlc(row.tx)?.pt ?? 0

const exitStatus = (
  value: string,
): { readonly status: 'ok' | 'error'; readonly message: string | undefined } => {
  const exit = decodeExit(value)
  if (!exit || exit._tag === 'Success') return { status: 'ok', message: undefined }
  const error = Cause.squash(exit.cause)
  return { status: 'error', message: typeof error === 'string' ? error : String(error) }
}

const causeLink = (
  journal: ExecutionJournal,
  row: StoredDatomType | undefined,
  ownSpanId: string,
): DurableSpan['links'] => {
  if (!row) return []
  const envelope = journal.envelope(row.cs)
  if (!envelope || !isRecordedContext(envelope)) return []
  if (envelope.spanId === ownSpanId) return []
  return [
    {
      traceId: envelope.traceId,
      spanId: envelope.spanId,
      attributes: { 'viviefs.link': 'caused-by', 'viviefs.command': envelope.command },
    },
  ]
}

const firstOf = (
  rows: ReadonlyArray<StoredDatomType>,
  entity: string,
  attribute: string,
): StoredDatomType | undefined => {
  let found: StoredDatomType | undefined
  for (const row of rows) {
    if (row.e !== entity || row.a !== attribute) continue
    if (!found || row.seq < found.seq) found = row
  }
  return found
}

const segmentAfter = (entity: string, execution: string, tag: string) => {
  const prefix = `${execution}/${tag}`
  return entity.startsWith(prefix) ? entity.slice(prefix.length) : null
}

const workflowSpan = (
  journal: ExecutionJournal,
  end: StoredDatomType,
): DurableSpan | null => {
  const execution = journal.executionEntity
  const started = firstOf(journal.rows, execution, Attr.workflowStarted)
  const name = started ? decodeStarted(started.v)?.name : undefined
  const spanId = spanIdFor(execution)
  const { status, message } = exitStatus(end.v)
  const events = journal.rows
    .filter((row) => row.e === execution && row.a === Attr.leaseHolder)
    .sort((left, right) => left.seq - right.seq)
    .flatMap((row) => {
      const lease = decodeLease(row.v)
      return lease
        ? [
            {
              name: 'lease',
              timeMs: timeOf(row),
              attributes: { 'viviefs.lease.device': lease.device, 'viviefs.lease.epoch': lease.epoch },
            },
          ]
        : []
    })
  return {
    traceId: traceIdFor(execution),
    spanId,
    parentSpanId: undefined,
    name: `workflow ${name ?? 'unknown'}`,
    startMs: started ? timeOf(started) : timeOf(end),
    endMs: timeOf(end),
    status,
    statusMessage: message,
    attributes: {
      'viviefs.span': 'workflow',
      'viviefs.entity': execution,
      'viviefs.workflow': name ?? 'unknown',
      ...(started ? {} : { 'viviefs.start.missing': true }),
    },
    links: causeLink(journal, started, spanId),
    events,
  }
}

const activitySpan = (
  journal: ExecutionJournal,
  end: StoredDatomType,
): DurableSpan | null => {
  const execution = journal.executionEntity
  const segment = segmentAfter(end.e, execution, 'A')
  if (segment === null) return null
  const hash = segment.lastIndexOf('#')
  const attempt = Number(segment.slice(hash + 1))
  if (hash < 0 || !Number.isInteger(attempt)) return null
  const name = decodeIdSegment(segment.slice(0, hash))
  const started = firstOf(journal.rows, end.e, Attr.activityStarted)
  const spanId = spanIdFor(end.e)
  const { status, message } = exitStatus(end.v)
  const previous =
    attempt > 1
      ? [
          {
            traceId: traceIdFor(execution),
            spanId: spanIdFor(`${execution}/A${encodeIdSegment(name)}#${attempt - 1}`),
            attributes: { 'viviefs.link': 'previous-attempt' },
          },
        ]
      : []
  return {
    traceId: traceIdFor(execution),
    spanId,
    parentSpanId: spanIdFor(execution),
    name: `activity ${name} #${attempt}`,
    startMs: started ? timeOf(started) : timeOf(end),
    endMs: timeOf(end),
    status,
    statusMessage: message,
    attributes: {
      'viviefs.span': 'activity',
      'viviefs.entity': end.e,
      'viviefs.activity': name,
      'viviefs.attempt': attempt,
      ...(started ? {} : { 'viviefs.start.missing': true }),
    },
    links: [...previous, ...causeLink(journal, started, spanId)],
    events: [],
  }
}

const deferredOrClockSpan = (
  journal: ExecutionJournal,
  end: StoredDatomType,
): DurableSpan | null => {
  const execution = journal.executionEntity
  const segment = segmentAfter(end.e, execution, 'D')
  if (segment === null) return null
  const deferredName = decodeIdSegment(segment)
  const { status, message } = exitStatus(end.v)
  const clockRow = journal.rows.find(
    (row) =>
      row.a === Attr.clockWakeAt &&
      decodeClock(row.v)?.deferredName === deferredName,
  )
  const clock = clockRow ? decodeClock(clockRow.v) : null
  if (clockRow && clock) {
    const spanId = spanIdFor(clockRow.e)
    return {
      traceId: traceIdFor(execution),
      spanId,
      parentSpanId: spanIdFor(execution),
      name: `clock ${clock.name}`,
      startMs: timeOf(clockRow),
      endMs: timeOf(end),
      status,
      statusMessage: message,
      attributes: {
        'viviefs.span': 'clock',
        'viviefs.entity': clockRow.e,
        'viviefs.clock': clock.name,
        'viviefs.clock.wake-at-ms': clock.wakeAtMs,
      },
      links: causeLink(journal, end, spanId),
      events: [],
    }
  }
  const spanId = spanIdFor(end.e)
  return {
    traceId: traceIdFor(execution),
    spanId,
    parentSpanId: spanIdFor(execution),
    name: `deferred ${deferredName}`,
    startMs: timeOf(end),
    endMs: timeOf(end),
    status,
    statusMessage: message,
    attributes: {
      'viviefs.span': 'deferred',
      'viviefs.entity': end.e,
      'viviefs.deferred': deferredName,
    },
    links: causeLink(journal, end, spanId),
    events: [],
  }
}

/** The durable span an end fact produces, or null when it is not one. */
export const spanForEndFact = (
  journal: ExecutionJournal,
  end: StoredDatomType,
): DurableSpan | null => {
  if (end.a === Attr.workflowResult && end.e === journal.executionEntity) {
    return workflowSpan(journal, end)
  }
  if (end.a === Attr.activityExit) return activitySpan(journal, end)
  if (end.a === Attr.deferredExit) return deferredOrClockSpan(journal, end)
  return null
}
