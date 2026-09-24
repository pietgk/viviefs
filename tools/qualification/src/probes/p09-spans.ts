import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Option from 'effect/Option'
import type * as Tracer from 'effect/Tracer'

const START = '<!-- span-review:start -->'
const END = '<!-- span-review:end -->'

const keep = (name: string) =>
  name.startsWith('P09 ') ||
  name.startsWith('SyncClient.') ||
  name.startsWith('SyncAuthority.') ||
  name.startsWith('SyncRpc.')

const text = (span: Tracer.Span, key: string): string | undefined => {
  const value = span.attributes.get(key)
  return typeof value === 'string' ? value : undefined
}

const ancestor = (span: Tracer.Span): Tracer.Span | undefined => {
  const seen = new Set<Tracer.AnySpan>()
  let current: Tracer.AnySpan = span
  while (!seen.has(current)) {
    seen.add(current)
    if (current._tag !== 'Span') return undefined
    const parent: Tracer.AnySpan | undefined = Option.getOrUndefined(current.parent)
    if (parent === undefined) return undefined
    if (parent._tag === 'Span' && keep(parent.name)) return parent
    current = parent
  }
  return undefined
}

const shortCommand = (value: string | undefined) => value?.split('.').at(-1)

const checksSource = join(
  dirname(fileURLToPath(import.meta.url)),
  'p09-checks.ts',
)
const CHECKS = '../../tools/qualification/src/probes/p09-checks.ts'

const checkNote = (fn: string): { readonly line: number; readonly text: string } => {
  const lines = readFileSync(checksSource, 'utf8').split('\n')
  const marker = lines.findIndex((line) => line.includes(`p09-check ${fn}`))
  if (marker < 0) return { line: 1, text: `missing note for ${fn}` }
  const body: Array<string> = []
  for (let index = marker + 1; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (line.trim() === '*/') break
    body.push(line.replace(/^\s*\*\s?/, ''))
  }
  return {
    line: marker + 1,
    text: body.join(' ').replaceAll(/\s+/g, ' ').trim(),
  }
}
const CLIENT = '../../libs/sync/client/src/client.ts'
const SERVER = '../../libs/sync/server/src/server.ts'

const lifeline = (device: string) => device.replaceAll(/[^A-Za-z0-9_]/g, '_')

/**
 * Mermaid drawn from the probe's Effect.fn spans. Span ids and timestamps
 * are left out so the picture stays stable across runs.
 */
export const spanReview = (spans: ReadonlyArray<Tracer.NativeSpan>): string => {
  const interesting = spans.filter((span) => keep(span.name))
  const children = new Map<Tracer.Span | undefined, Array<Tracer.Span>>()
  for (const span of interesting) {
    const parent = ancestor(span)
    const list = children.get(parent) ?? []
    list.push(span)
    children.set(parent, list)
  }

  const handler = (name: string) =>
    name === 'SyncRpc.Append' || name === 'SyncRpc.Pull' || name === 'SyncRpc.PutBlob'
  const charts: Array<string> = []
  for (const root of children.get(undefined) ?? []) {
    if (handler(root.name)) continue
    const steps = children.get(root) ?? []
    const actors: Array<string> = []
    const remember = (actor: string) => {
      if (!actors.includes(actor)) actors.push(actor)
    }
    const arrows: Array<readonly [string, string, string]> = []
    for (const step of steps) {
      if (step.name === 'SyncClient.outbox' || handler(step.name)) continue
      if (step.name === 'SyncClient.pull' && ancestor(step)?.name === 'SyncClient.push') {
        continue
      }
      const device = text(step, 'sync.device')
      const command = shortCommand(text(step, 'sync.command'))
      if (step.name === 'SyncAuthority.completeDeferred') {
        remember('server')
        arrows.push(['server', 'server', 'completeDeferred'])
        continue
      }
      if (device === undefined) continue
      const client = `${device} SyncClient`
      if (step.name === 'SyncRpc.append') {
        const rpc = `${device} SyncRpc`
        remember(rpc)
        remember('server')
        arrows.push([rpc, 'server', 'append'])
        continue
      }
      remember(client)
      if (step.name === 'SyncClient.submit') {
        arrows.push([client, client, `submit ${command ?? ''}`.trim()])
        continue
      }
      remember('server')
      if (step.name === 'SyncClient.push') {
        const outcomes = (children.get(step) ?? [])
          .filter((child) => child.name === 'SyncClient.outbox')
          .map((child) => {
            const childCommand = shortCommand(text(child, 'sync.command'))
            const state = text(child, 'outbox.state')
            return [childCommand, state].filter(Boolean).join(' ')
          })
        const detail = outcomes.length > 0 ? ` ${outcomes.join(', ')}` : ''
        arrows.push([client, 'server', `push${detail}`])
        continue
      }
      const verb = step.name.replace('SyncClient.', '')
      arrows.push([client, 'server', verb])
    }
    const lines = ['sequenceDiagram']
    for (const actor of actors) {
      lines.push(`  participant ${lifeline(actor)} as "${actor}"`)
    }
    for (const [from, to, message] of arrows) {
      lines.push(`  ${lifeline(from)}->>${lifeline(to)}: ${message}`)
    }
    const title = root.name.replace(/^P09 /, '')
    const fn = text(root, 'p09.fn') ?? title
    const note = checkNote(fn)
    const links = [
      `[${fn}](${CHECKS}#L${note.line})`,
      `[SyncClient](${CLIENT})`,
      actors.includes('server') ? `[server](${SERVER})` : undefined,
    ].filter(Boolean)
    charts.push(
      [
        `**${title}.** ${note.text} ${links.join(' · ')}`,
        '',
        '```mermaid',
        lines.join('\n'),
        '```',
      ].join('\n'),
    )
  }

  const edges = new Set<string>()
  const aliases = new Set<string>()
  const stateId = (value: string) => {
    if (!value.includes('-')) return value
    const id = value.replaceAll('-', '_')
    aliases.add(`  state "${value}" as ${id}`)
    return id
  }
  for (const span of interesting) {
    const from = text(span, 'outbox.from')
    const state = text(span, 'outbox.state')
    if (from !== undefined && state !== undefined) {
      edges.add(`  ${stateId(from)} --> ${stateId(state)}`)
    }
  }
  const states = [
    'stateDiagram-v2',
    ...[...aliases].sort(),
    ...[...edges].sort(),
  ]
  return [
    charts.join('\n\n'),
    '',
    '**Outbox.** The transitions recorded on `SyncClient.outbox` spans. [SyncClient](../../libs/sync/client/src/client.ts)',
    '',
    '```mermaid',
    states.join('\n'),
    '```',
  ].join('\n')
}

export const recordedSpanReview = (markdown: string): string | undefined => {
  const start = markdown.indexOf(START)
  const end = markdown.indexOf(END)
  if (start < 0 || end < 0 || end < start) return undefined
  return markdown.slice(start + START.length, end).trim()
}

export const spanReviewDrift = (
  spans: ReadonlyArray<Tracer.NativeSpan>,
  markdown: string,
): string | undefined => {
  const recorded = recordedSpanReview(markdown)
  const actual = spanReview(spans).trim()
  if (recorded === actual) return undefined
  return recorded === undefined
    ? `P09 span review markers missing. Insert this between ${START} and ${END}:\n${actual}`
    : `P09 span review drifted from the probe:\n${actual}`
}
