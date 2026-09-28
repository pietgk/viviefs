/**
 * The P11 review picture: one sequence diagram per Node check, drawn from
 * the probe's spans, and the outbox transitions they recorded. Span ids,
 * person ids and times are left out so the picture is stable across runs.
 *
 * Lifelines: `<device> SyncClient`, `<device> SyncRpc` when the probe calls
 * an RPC itself, `server`, and `operator` for `grantMembership` /
 * `revokeMembership` once a check is under way (the grants that set a check
 * up are in its paragraph). An arrow carries the refusal it met; a call that
 * no server span continued never reached the server and stays on the device.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Option from 'effect/Option'
import type * as Tracer from 'effect/Tracer'
import { checkNote, spanReviewDrift as drift } from './span-review.ts'

const text = (span: Tracer.Span, key: string): string | undefined => {
  const value = span.attributes.get(key)
  return typeof value === 'string' ? value : undefined
}

const deviceOf = (span: Tracer.Span) => text(span, 'sync.device')

// Server-side handler spans (`SyncRpc.Append`) carry no device and stay out.
const keep = (span: Tracer.Span) =>
  span.name.startsWith('P11 ') ||
  span.name.startsWith('Memberships.') ||
  (span.name.startsWith('SyncClient.') && deviceOf(span) !== undefined) ||
  (span.name.startsWith('SyncRpc.') && deviceOf(span) !== undefined)

const parentOf = (span: Tracer.Span): Tracer.Span | undefined => {
  const parent = Option.getOrUndefined(span.parent)
  return parent?._tag === 'Span' ? parent : undefined
}

/** The nearest kept span above `span`. */
const ancestor = (span: Tracer.Span): Tracer.Span | undefined => {
  for (let parent = parentOf(span); parent !== undefined; parent = parentOf(parent)) {
    if (keep(parent)) return parent
  }
  return undefined
}

const below = (span: Tracer.Span, root: Tracer.Span) => {
  for (let parent = parentOf(span); parent !== undefined; parent = parentOf(parent)) {
    if (parent === root) return true
  }
  return false
}

/** The error a span ended with: its tag, and its reason when it has one. */
const refusal = (span: Tracer.NativeSpan): string | undefined => {
  if (span.status._tag !== 'Ended' || span.status.exit._tag !== 'Failure') return undefined
  const failure = span.status.exit.cause.reasons.find((reason) => reason._tag === 'Fail')
  if (failure?._tag !== 'Fail') return 'defect'
  const error = failure.error as { readonly _tag?: unknown; readonly reason?: unknown }
  const tag = typeof error._tag === 'string' ? error._tag : String(failure.error)
  return typeof error.reason === 'string' ? `${tag} ${error.reason}` : tag
}

const shortCommand = (value: string | undefined) => value?.split('.').at(-1)

const lifeline = (name: string) => name.replaceAll(/[^A-Za-z0-9_]/g, '_')

const CHECKS_SOURCE = join(dirname(fileURLToPath(import.meta.url)), 'p11-checks.ts')
const CHECKS = '../../tools/qualification/src/probes/p11-checks.ts'
const CLIENT = '../../libs/sync/client/src/client.ts'
const SERVER = '../../libs/sync/server/src/server.ts'

type Arrow = readonly [from: string, to: string, message: string]

const arrowsOf = (
  steps: ReadonlyArray<Tracer.NativeSpan>,
  spans: ReadonlyArray<Tracer.NativeSpan>,
): ReadonlyArray<Arrow> => {
  const arrows: Array<Arrow> = []
  const underway = () => arrows.length > 0
  // A request reached the server when a server span continues its trace.
  const served = new Set(
    spans
      .filter((span) => span.name.startsWith('RpcServer.'))
      .map((span) => Option.getOrUndefined(span.parent)?.spanId),
  )
  const reachedServer = (step: Tracer.NativeSpan) =>
    spans.some(
      (span) =>
        span.name.startsWith('RpcClient.') && below(span, step) && served.has(span.spanId),
    )
  for (const step of steps) {
    const failed = refusal(step)
    const suffix = failed === undefined ? '' : ` ${failed}`
    if (step.name.startsWith('Memberships.')) {
      if (!underway()) continue
      const verb = step.name.replace('Memberships.', '')
      arrows.push(['operator', 'server', `${verb} ${text(step, 'membership.org') ?? ''}`.trim()])
      continue
    }
    const device = deviceOf(step) ?? 'device'
    if (step.name.startsWith('SyncRpc.')) {
      const call = step.name.replace('SyncRpc.', '')
      arrows.push([`${device} SyncRpc`, 'server', `${call}${suffix}`])
      continue
    }
    const client = `${device} SyncClient`
    if (step.name === 'SyncClient.submit') {
      const command = shortCommand(text(step, 'sync.command')) ?? ''
      arrows.push([client, client, `submit ${command}${suffix}`])
      continue
    }
    const verb = step.name.replace('SyncClient.', '')
    if (step.name === 'SyncClient.push') {
      const outcomes = spans
        .filter((span) => span.name === 'SyncClient.outbox' && ancestor(span) === step)
        .map((span) =>
          [
            shortCommand(text(span, 'sync.command')),
            text(span, 'outbox.state'),
            text(span, 'outbox.rejection'),
          ]
            .filter(Boolean)
            .join(' '),
        )
      const detail = outcomes.length > 0 ? ` ${outcomes.join(', ')}` : ''
      const to = reachedServer(step) ? 'server' : client
      arrows.push([client, to, `${verb}${detail}${suffix}`])
      continue
    }
    arrows.push([client, reachedServer(step) ? 'server' : client, `${verb}${suffix}`])
  }
  return arrows
}

const chart = (root: Tracer.NativeSpan, spans: ReadonlyArray<Tracer.NativeSpan>) => {
  const steps = spans.filter((span) => keep(span) && ancestor(span) === root)
  const arrows = arrowsOf(steps, spans)
  const actors: Array<string> = []
  for (const [from, to] of arrows) {
    if (!actors.includes(from)) actors.push(from)
    if (!actors.includes(to)) actors.push(to)
  }
  const lines = ['sequenceDiagram']
  for (const actor of actors) lines.push(`  participant ${lifeline(actor)} as "${actor}"`)
  for (const [from, to, message] of arrows) {
    lines.push(`  ${lifeline(from)}->>${lifeline(to)}: ${message}`)
  }
  const title = root.name.replace(/^P11 /, '')
  const fn = text(root, 'p11.fn') ?? title
  const note = checkNote(CHECKS_SOURCE, 'p11-check', fn)
  const links = [
    `[${fn}](${CHECKS}#L${note.line})`,
    `[SyncClient](${CLIENT})`,
    actors.includes('server') ? `[server](${SERVER})` : undefined,
  ].filter(Boolean)
  return [
    `**${title}.** ${note.text} ${links.join(' · ')}`,
    '',
    '```mermaid',
    lines.join('\n'),
    '```',
  ].join('\n')
}

const outboxDiagram = (spans: ReadonlyArray<Tracer.NativeSpan>) => {
  const edges = new Set<string>()
  const aliases = new Set<string>()
  const stateId = (value: string) => {
    if (!value.includes('-')) return value
    const id = value.replaceAll('-', '_')
    aliases.add(`  state "${value}" as ${id}`)
    return id
  }
  for (const span of spans) {
    if (span.name !== 'SyncClient.outbox') continue
    const from = text(span, 'outbox.from')
    const state = text(span, 'outbox.state')
    if (from !== undefined && state !== undefined) {
      edges.add(`  ${stateId(from)} --> ${stateId(state)}`)
    }
  }
  return ['stateDiagram-v2', ...[...aliases].sort(), ...[...edges].sort()].join('\n')
}

export const spanReview = (spans: ReadonlyArray<Tracer.NativeSpan>): string =>
  [
    spans
      .filter((span) => span.name.startsWith('P11 '))
      .map((root) => chart(root, spans))
      .join('\n\n'),
    '',
    `**Outbox.** The transitions recorded on \`SyncClient.outbox\` spans. [SyncClient](${CLIENT})`,
    '',
    '```mermaid',
    outboxDiagram(spans),
    '```',
  ].join('\n')

export const spanReviewDrift = (
  spans: ReadonlyArray<Tracer.NativeSpan>,
  markdown: string,
): string | undefined => drift('P11', spanReview(spans), markdown)
