/**
 * The P10 review picture: the durable span tree the trace projector derived
 * from the crash-and-resume journal, with its links and the live spans the
 * activity bodies emitted. Drawn from the run, without ids or times, so it
 * is stable across runs. The probe fails when the committed picture in the
 * evidence note differs from the run (the P09 span-review convention).
 */
import * as Option from 'effect/Option'
import type { DurableSpan } from '@viviefs/telemetry'
import { expectedSpanIds, type ProjectionRun } from '@viviefs/telemetry/suites'
import { spanReviewDrift as drift } from './span-review.ts'

const nodeId = (name: string) => name.replaceAll(/[^A-Za-z0-9]/g, '_')

const LINK_LABEL: Record<string, string> = {
  'previous-attempt': 'previous attempt',
  'caused-by': 'caused by',
}

export const spanReview = (p: ProjectionRun): string => {
  const order = [...expectedSpanIds(p.run).keys()]
  const spans = [...p.accepted.sent].sort(
    (left, right) => order.indexOf(left.spanId) - order.indexOf(right.spanId),
  )
  const byId = new Map(spans.map((span) => [span.spanId, span]))
  const liveName = new Map(p.run.liveSpans.map((span) => [span.spanId, span.name]))
  const label = (span: DurableSpan) => (span.status === 'error' ? `${span.name}<br/>error` : span.name)

  const lines = ['flowchart TD']
  const callers: Array<string> = []
  for (const span of spans) {
    lines.push(`  ${nodeId(span.name)}["${label(span)}"]`)
  }
  for (const span of spans) {
    const parent = span.parentSpanId ? byId.get(span.parentSpanId) : undefined
    if (parent) lines.push(`  ${nodeId(parent.name)} --> ${nodeId(span.name)}`)
  }
  for (const span of spans) {
    for (const link of span.links) {
      const kind = String(link.attributes['viviefs.link'] ?? 'link')
      const target = byId.get(link.spanId)
      if (target) {
        lines.push(`  ${nodeId(span.name)} -.->|${LINK_LABEL[kind] ?? kind}| ${nodeId(target.name)}`)
        continue
      }
      const caller = `caller_${nodeId(span.name)}`
      callers.push(`  ${caller}(["caller: ${liveName.get(link.spanId) ?? 'live span'}<br/>its own trace"])`)
      lines.push(`  ${nodeId(span.name)} -.->|${LINK_LABEL[kind] ?? kind}| ${caller}`)
    }
  }
  const live = new Map<string, { name: string; count: number }>()
  for (const span of p.run.liveSpans) {
    const parent = Option.getOrUndefined(span.parent)
    const durable = parent ? byId.get(parent.spanId) : undefined
    if (!durable) continue
    const key = `${durable.name}/${span.name}`
    const entry = live.get(key) ?? { name: span.name, count: 0 }
    live.set(key, { name: entry.name, count: entry.count + 1 })
  }
  for (const [key, { name, count }] of live) {
    const durableName = key.slice(0, key.length - name.length - 1)
    const node = `live_${nodeId(name)}`
    lines.push(`  ${node}["live ${name} x${count}"]`)
    lines.push(`  ${nodeId(durableName)} --> ${node}`)
  }
  return [
    '```mermaid',
    [...lines.slice(0, 1), ...callers, ...lines.slice(1)].join('\n'),
    '```',
  ].join('\n')
}

export const spanReviewDrift = (p: ProjectionRun, markdown: string): string | undefined =>
  drift('P10', spanReview(p), markdown)
