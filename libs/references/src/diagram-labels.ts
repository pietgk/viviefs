/**
 * Diagram labels are prose (D180). Every label of every Mermaid diagram in a
 * Markdown or MDX source, with its line, so the checks that read prose read
 * labels too: the site's references and paths, `pnpm refs`, and `verify`'s
 * retired words and named identifiers. A node id, an arrow and a style line
 * are the diagram's structure, not a label.
 */

export type DiagramLabel = {
  /** The source line, from 1. */
  readonly line: number
  /** The label as a reader sees it: a `<br/>` is a space. */
  readonly text: string
}

const FENCE = /^( {0,3})(`{3,}|~{3,})\s*mermaid\b/

/** Lines that are only structure. */
const STRUCTURE = /^\s*(?:%%|classDef\b|class\b|style\b|linkStyle\b|click\b|direction\b|end\b|autonumber\b|activate\b|deactivate\b|rect\b)/

/** A sequence diagram's block, whose title is a label: `loop Every minute`. */
const BLOCK = /^\s*(?:loop|alt|else|opt|par|and|critical|break|box)\s+(.+)$/

const plain = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/^"([\s\S]*)"$/, '$1')
    .replace(/\s+/g, ' ')
    .trim()

/** Shape openers after a node id, longest first, with their closers. */
const SHAPES: ReadonlyArray<readonly [string, string]> = [
  ['[(', ')]'],
  ['((', '))'],
  ['([', '])'],
  ['[[', ']]'],
  ['{{', '}}'],
  ['[', ']'],
  ['(', ')'],
  ['{', '}'],
  ['>', ']'],
]

type Found = { readonly at: number; readonly text: string }

/** A flowchart line: node shapes, edge text (`-- yes -->`), edge labels (`-->|x|`) and a subgraph title. */
const flowchartLabels = (line: string): ReadonlyArray<Found> => {
  const found: Found[] = []
  const subgraph = /^\s*subgraph\s+(.*)$/.exec(line)
  if (subgraph?.[1] !== undefined && !/^[\w-]+(?:\[|\(|\{)/.test(subgraph[1])) {
    return [{ at: line.indexOf(subgraph[1]), text: subgraph[1] }]
  }
  for (let index = 0; index < line.length; ) {
    const rest = line.slice(index)
    // A hyphen joins an id's words, so the `--` of an arrow is never an id.
    const id = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*/.exec(rest)?.[0]
    if (id !== undefined && (index === 0 || !/[\w-]/.test(line[index - 1] ?? ''))) {
      const after = index + id.length
      const shape = SHAPES.find(([open]) => line.startsWith(open, after))
      if (shape !== undefined) {
        const from = after + shape[0].length
        const quoted = line[from] === '"' ? line.indexOf('"', from + 1) : -1
        const close = line.indexOf(shape[1], quoted === -1 ? from : quoted)
        const to = close === -1 ? line.length : close
        found.push({ at: from, text: line.slice(from, to) })
        index = close === -1 ? line.length : close + shape[1].length
        continue
      }
      index = after
      continue
    }
    const pipe = /^\|([^|]*)\|/.exec(rest)
    if (pipe?.[1] !== undefined && index > 0 && /[->=.ox]\s*$/.test(line.slice(0, index))) {
      found.push({ at: index + 1, text: pipe[1] })
      index += pipe[0].length
      continue
    }
    const edge = /^(?:--|-\.|==)(?![->.=])\s*("[^"]*"|[^"\s][^>]*?)\s*(?:-->|\.->|==>|--[xo]\b|---)/.exec(rest)
    if (edge?.[1] !== undefined && (index === 0 || !/[-.=]/.test(line[index - 1] ?? ''))) {
      found.push({ at: index + edge[0].indexOf(edge[1]), text: edge[1] })
      index += edge[0].length
      continue
    }
    index += 1
  }
  return found
}

/** Where a `:` outside quotes starts a label, or -1. */
const colonAt = (line: string): number => {
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    if (line[index] === '"') quoted = !quoted
    else if (line[index] === ':' && !quoted) return index
  }
  return -1
}

const quotedLabels = (line: string): ReadonlyArray<Found> =>
  [...line.matchAll(/"([^"]*)"/g)].map((match) => ({ at: match.index + 1, text: match[1] ?? '' }))

/** A state or sequence diagram line: quoted names, an `as` name, and the text after `:`. */
const colonLabels = (line: string): ReadonlyArray<Found> => {
  const block = BLOCK.exec(line)
  if (block?.[1] !== undefined) return [{ at: line.indexOf(block[1]), text: block[1] }]
  const colon = colonAt(line)
  const head = colon === -1 ? line : line.slice(0, colon)
  const found: Found[] = [...quotedLabels(head)]
  const alias = /^\s*(?:participant|actor)\s+\S+\s+as\s+([^"].*)$/.exec(head)
  if (alias?.[1] !== undefined) found.push({ at: head.indexOf(alias[1]), text: alias[1] })
  if (colon !== -1) found.push({ at: colon + 1, text: line.slice(colon + 1) })
  return found
}

const KINDS: ReadonlyArray<readonly [RegExp, (line: string) => ReadonlyArray<Found>]> = [
  [/^\s*(?:flowchart|graph)\b/, flowchartLabels],
  [/^\s*(?:stateDiagram|sequenceDiagram)/, colonLabels],
]

/** The labels of one diagram's source; `first` is the source line of its first line. */
export const mermaidLabels = (code: string, first = 1): ReadonlyArray<DiagramLabel> => {
  const lines = code.split('\n')
  const header = lines.find((line) => line.trim() !== '' && !/^\s*%%/.test(line)) ?? ''
  const read = KINDS.find(([kind]) => kind.test(header))?.[1] ?? quotedLabels
  const labels: DiagramLabel[] = []
  let inNote = false
  for (const [index, line] of lines.entries()) {
    const at = first + index
    if (inNote) {
      if (/^\s*end note\s*$/i.test(line)) inNote = false
      else if (line.trim() !== '') labels.push({ line: at, text: plain(line) })
      continue
    }
    if (line === header || STRUCTURE.test(line)) continue
    if (/^\s*note\s+(?:left|right)\s+of\s+[^:]+$/i.test(line)) {
      inNote = true
      continue
    }
    for (const { text } of [...read(line)].sort((left, right) => left.at - right.at)) {
      const label = plain(text)
      if (label !== '') labels.push({ line: at, text: label })
    }
  }
  return labels
}

/** Every label of every Mermaid diagram in a Markdown or MDX source. */
export const diagramLabels = (markdown: string): ReadonlyArray<DiagramLabel> => {
  const lines = markdown.split('\n')
  const labels: DiagramLabel[] = []
  for (let index = 0; index < lines.length; index++) {
    const fence = FENCE.exec(lines[index] ?? '')
    if (fence?.[2] === undefined) continue
    const close = new RegExp(`^ {0,3}${fence[2][0]}{${fence[2].length},}\\s*$`)
    let end = index + 1
    while (end < lines.length && !close.test(lines[end] ?? '')) end += 1
    labels.push(...mermaidLabels(lines.slice(index + 1, end).join('\n'), index + 2))
    index = end
  }
  return labels
}

/**
 * A source's lines as the prose checks read them: fenced code is blank, and
 * each diagram line holds its labels, so a line number is still the source's.
 */
export const proseLines = (markdown: string): ReadonlyArray<string> => {
  const lines = markdown.split('\n')
  const prose = [...lines]
  for (let index = 0; index < lines.length; index++) {
    // A fence may be indented, as in a list item.
    const fence = /^(\s*)(`{3,}|~{3,})/.exec(lines[index] ?? '')
    if (fence?.[2] === undefined) continue
    const close = new RegExp(`^\\s*${fence[2][0]}{${fence[2].length},}\\s*$`)
    let end = index + 1
    while (end < lines.length && !close.test(lines[end] ?? '')) end += 1
    for (let blank = index; blank <= end && blank < lines.length; blank++) prose[blank] = ''
    if (/^\s*mermaid\b/.test((lines[index] ?? '').slice(fence[0].length))) {
      for (const label of mermaidLabels(lines.slice(index + 1, end).join('\n'), index + 2)) {
        const at = label.line - 1
        prose[at] = prose[at] === '' ? label.text : `${prose[at]} ${label.text}`
      }
    }
    index = end
  }
  return prose
}
