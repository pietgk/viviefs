/**
 * Every Mermaid edge survives rendering (D61).
 *
 * Mermaid renders **only the last self-transition on a node**. Give a node two
 * edges pointing at itself and the earlier ones vanish from the SVG, with no
 * warning and no parse error: the diagram renders, looks correct, and quietly
 * describes less than its source does.
 *
 * Measured in web-interview in a real browser against mermaid 11.15,
 * `securityLevel: 'strict'`:
 *
 * | source | rendered |
 * | --- | --- |
 * | `a-->a: ALPHA`, `a-->a: BETA` | BETA only |
 * | `a-->a: ALPHA`, `a-->a: BETA`, `a-->a: DELTA` | DELTA only |
 * | `a-->b: ALPHA`, `a-->b: BETA`, `a-->b: DELTA` | all three |
 *
 * So parallel edges between two different nodes are safe; self-loops are not.
 * The same holds for `flowchart` and `stateDiagram-v2`. Evidence notes, ADRs
 * and guides use Mermaid, and a diagram that silently drops an edge is worse
 * than none, because it is believed.
 *
 * The fix is never to delete an edge: merge the labels into one transition
 * where they are really one thing, or move the second onto a `note`.
 *
 * Adapted from web-interview `scripts/check-diagrams.ts`.
 */

// `.->` closes a labelled dotted edge: `A -. "why" .-> B`.
const ARROW = /-{2,3}>|-\.-+>|\.-+>|={2,3}>|-{2,3}[xo]\b/

/** Lines that are structure or prose, never an edge. */
const NOT_AN_EDGE =
  /^\s*(?:%%|direction\b|classDef\b|class\b|click\b|style\b|linkStyle\b|subgraph\b)/i

/**
 * A node reference reduced to the id Mermaid keys on, so `S["Screen state"]`
 * and a later bare `S` are the same node.
 */
const nodeId = (token: string): string | null => {
  const trimmed = token.trim()
  if (!trimmed || trimmed === '[*]') return null
  const [id] = /^[A-Za-z0-9_.-]+/.exec(trimmed) ?? []
  return id ?? null
}

export type Edge = { from: string; to: string; label: string }

export const parseEdge = (line: string): Edge | null => {
  if (NOT_AN_EDGE.test(line)) return null
  const arrow = ARROW.exec(line)
  if (!arrow) return null

  const head = line.slice(0, arrow.index)
  const from = nodeId(head)
  let rest = line.slice(arrow.index + arrow[0].length)
  // `A -- "label" --> B`, `A -. "label" .-> B`, `A == "label" ==> B`.
  let label = /\s(?:--|-\.|==)\s*"?([^"]*?)"?\s*$/.exec(head)?.[1]?.trim() ?? ''

  // `A -->|label| B`, the flowchart form.
  const piped = /^\s*\|([^|]*)\|/.exec(rest)
  if (piped) {
    label = (piped[1] ?? '').trim()
    rest = rest.slice(piped[0].length)
  }

  // `A --> B: label`, the state-diagram form. The label runs to end of line.
  const colon = rest.indexOf(':')
  if (colon !== -1) {
    if (!label) label = rest.slice(colon + 1).trim()
    rest = rest.slice(0, colon)
  }

  const to = nodeId(rest)
  if (!from || !to) return null
  return { from, to, label: label || '(unlabelled)' }
}

/** Maps a node id to the labels of its self-transitions in one diagram. */
export const selfTransitionsByNode = (source: string): Map<string, string[]> => {
  const found = new Map<string, string[]>()
  let insideNote = false

  for (const line of source.split('\n')) {
    // Note bodies are prose and may contain anything, including arrows.
    if (/^\s*note\b/i.test(line)) {
      insideNote = !/^\s*note\b.*:/i.test(line)
      continue
    }
    if (insideNote) {
      if (/^\s*end note\b/i.test(line)) insideNote = false
      continue
    }

    const edge = parseEdge(line)
    if (!edge || edge.from !== edge.to) continue
    found.set(edge.from, [...(found.get(edge.from) ?? []), edge.label])
  }

  return found
}

export type Finding = { diagram: number; node: string; labels: string[] }

/** Every node, in every fenced `mermaid` block, with more than one self-loop. */
export const findCollapsingSelfTransitions = (markdown: string): Finding[] =>
  [...markdown.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].flatMap((match, index) =>
    [...selfTransitionsByNode(match[1] ?? '')]
      .filter(([, labels]) => labels.length > 1)
      .map(([node, labels]) => ({ diagram: index + 1, node, labels })),
  )

export const countDiagrams = (markdown: string): number =>
  (markdown.match(/```mermaid\r?\n/g) ?? []).length

export const describeFinding = ({ diagram, node, labels }: Finding, path: string) =>
  `${path}: diagram ${diagram}, node "${node}" has ${labels.length} self-transitions. ` +
  `Mermaid renders only the last ("${labels.at(-1)}") and silently drops ` +
  `${labels
    .slice(0, -1)
    .map((label) => `"${label}"`)
    .join(', ')}. ` +
  'Merge them into one transition, or move one onto a note.'
