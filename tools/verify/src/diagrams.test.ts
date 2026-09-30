// Every Mermaid edge survives rendering (D61): each rule is shown firing on a
// diagram that would lose an edge, next to one that keeps them all.
import { describe, expect, it } from '@effect/vitest'
import {
  countDiagrams,
  describeFinding,
  findCollapsingSelfTransitions,
  parseEdge,
  selfTransitionsByNode,
} from './diagrams.ts'

const fenced = (body: string) => `Text.\n\n\`\`\`mermaid\n${body}\n\`\`\`\n`

describe('parseEdge', () => {
  it('reads the state-diagram and flowchart label forms', () => {
    expect(parseEdge('  Qualified --> Qualified: inputs change')).toEqual({
      from: 'Qualified',
      to: 'Qualified',
      label: 'inputs change',
    })
    expect(parseEdge('  A["Start"] -->|go| B')).toEqual({ from: 'A', to: 'B', label: 'go' })
    expect(parseEdge('  CON -. "why" .-> ADR')).toEqual({ from: 'CON', to: 'ADR', label: 'why' })
    expect(parseEdge('  ADR -- "claims" --> GATE')?.label).toBe('claims')
    expect(parseEdge('  ENTRY ==> ACC{"Human accepts"}')).toEqual({
      from: 'ENTRY',
      to: 'ACC',
      label: '(unlabelled)',
    })
  })

  it('ignores structure lines', () => {
    expect(parseEdge('  classDef kill fill:#7f1d1d')).toBeNull()
    expect(parseEdge('  subgraph Q["Qualify"]')).toBeNull()
    expect(parseEdge('  direction LR')).toBeNull()
  })
})

describe('findCollapsingSelfTransitions', () => {
  it('fails on two self-transitions on one node', () => {
    const markdown = fenced('stateDiagram-v2\n  a --> a: ALPHA\n  a --> a: BETA')
    expect(findCollapsingSelfTransitions(markdown)).toEqual([
      { diagram: 1, node: 'a', labels: ['ALPHA', 'BETA'] },
    ])
  })

  it('fails on labelled dotted self-loops', () => {
    const markdown = fenced('flowchart TB\n  A -. "one" .-> A\n  A -. "two" .-> A')
    expect(findCollapsingSelfTransitions(markdown)).toEqual([
      { diagram: 1, node: 'A', labels: ['one', 'two'] },
    ])
  })

  it('passes one self-transition and parallel edges between two nodes', () => {
    const markdown = fenced(
      'stateDiagram-v2\n  a --> a: ALPHA\n  a --> b: BETA\n  a --> b: DELTA',
    )
    expect(findCollapsingSelfTransitions(markdown)).toEqual([])
  })

  it('does not read arrows inside notes', () => {
    const source = 'stateDiagram-v2\n  note right of a\n    a --> a: x\n    a --> a: y\n  end note'
    expect(selfTransitionsByNode(source).size).toBe(0)
  })

  it('numbers diagrams within a file', () => {
    const markdown =
      fenced('flowchart LR\n  a --> b') + fenced('flowchart LR\n  c --> c\n  c --> c')
    expect(countDiagrams(markdown)).toBe(2)
    const messages = findCollapsingSelfTransitions(markdown).map((finding) =>
      describeFinding(finding, 'docs/x.md'),
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('docs/x.md: diagram 2, node "c" has 2 self-transitions.')
  })
})
