// Diagram labels are prose (D180): every label of a Mermaid diagram, with the
// source line it is on, and nothing that is only the diagram's structure.
// The diagrams are those of How a pattern is delivered, as the human reviewed it.
import { describe, expect, it } from '@effect/vitest'
import { diagramLabels, proseLines } from './diagram-labels.ts'

const fenced = (lines: ReadonlyArray<string>): string => ['Before.', '', '```mermaid', ...lines, '```', '', 'After.', ''].join('\n')

const texts = (markdown: string) => diagramLabels(markdown).map(({ text }) => text)

describe('diagram labels', () => {
  it('reads node, edge and subgraph labels of a flowchart, with their source lines', () => {
    const markdown = fenced([
      'flowchart TB',
      '  GR["Grilling decision"] --> ADR["ADR<br/>problem, design"]',
      '  ADR -- "shapes" --> EX',
      '  subgraph Q["Qualify"]',
      '    PROBE --> LEDGER[("Ledger<br/>machine-written")]',
      '  end',
      '  EX -. "metadata.guide" .-> GUIDE',
      '  GUIDE ==> ACC{"Human accepts<br/>the guide"}',
      '  CS --> Q1{May this writer do this?}',
      '  L[(Log)] -.->|"reviewer: completion (D40)"| SLOG',
      '  Q1 -- yes --> Q2',
      '  classDef warn fill:#f96',
      '  %% a comment, not a label',
    ])
    expect(diagramLabels(markdown)).toEqual([
      { line: 5, text: 'Grilling decision' },
      { line: 5, text: 'ADR problem, design' },
      { line: 6, text: 'shapes' },
      { line: 7, text: 'Qualify' },
      { line: 8, text: 'Ledger machine-written' },
      { line: 10, text: 'metadata.guide' },
      { line: 11, text: 'Human accepts the guide' },
      { line: 12, text: 'May this writer do this?' },
      { line: 13, text: 'Log' },
      { line: 13, text: 'reviewer: completion (D40)' },
      { line: 14, text: 'yes' },
    ])
  })

  it('reads transitions and notes of a state diagram, and messages of a sequence diagram', () => {
    expect(
      texts(
        fenced([
          'stateDiagram-v2',
          '  [*] --> Proposed: grilling decision recorded',
          "  Proposed --> Accepted: intent record, accepted directly (D65')",
          '  Accepted --> [*]',
          '  note right of Proposed: Proposed, unverified',
          '  note left of Accepted',
          '    its pattern is Delivered',
          '  end note',
          '  state "Waiting for a file" as Waiting',
        ]),
      ),
    ).toEqual([
      'grilling decision recorded',
      "intent record, accepted directly (D65')",
      'Proposed, unverified',
      'its pattern is Delivered',
      'Waiting for a file',
    ])
    expect(
      texts(
        fenced([
          'sequenceDiagram',
          '  participant Button as Confirm button',
          '  participant server as "server"',
          '  Button->>Session: send(Confirm)',
          '  Note over Session,Machine: send is async enqueue',
          '  loop Every minute',
          '  end',
        ]),
      ),
    ).toEqual(['Confirm button', 'server', 'send(Confirm)', 'send is async enqueue', 'Every minute'])
  })

  it('reads a plain subgraph title, skips an empty label and reads an unclosed shape to the end of its line', () => {
    expect(texts(fenced(['flowchart LR', '  subgraph Device storage', '  A[""] --> B[Half open', '  end']))).toEqual(['Device storage', 'Half open'])
  })

  it('reads quoted names of any other diagram kind, and a note across lines past a blank one', () => {
    expect(texts(fenced(['%% the model', 'erDiagram', '  CHANGESET ||--o{ DATOM : "holds"']))).toEqual(['holds'])
    expect(texts(fenced(['stateDiagram-v2', '  note right of Open', '    first', '', '    second', '  end note']))).toEqual(['first', 'second'])
  })

  it('reads a diagram whose fence is never closed to the end of the source', () => {
    expect(diagramLabels('```mermaid\nflowchart TB\n  A["open"] --> B\n')).toEqual([{ line: 3, text: 'open' }])
  })

  it('gives the prose checks each diagram line as its labels, and fenced code as blank lines', () => {
    expect(proseLines(fenced(['flowchart TB', '  A["one"] --> B["two"]']))).toEqual(['Before.', '', '', '', 'one two', '', '', 'After.', ''])
    expect(proseLines('Text.\n```ts\nconst a = 1\n```\n')).toEqual(['Text.', '', '', '', ''])
  })

  it('reads no diagram shown inside another code block, as an example of Markdown', () => {
    const example = ['````md', '```mermaid', 'flowchart TB', '  EX -. "metadata.guide" .-> GUIDE', '```', '````', ''].join('\n')
    expect(diagramLabels(example)).toEqual([])
    expect(diagramLabels(`${example}\n${fenced(['flowchart TB', '  A -- "after" --> B'])}`)).toEqual([{ line: 12, text: 'after' }])
  })

  it('reads no other fenced code, and no prose', () => {
    expect(diagramLabels('A `metadata.guide` in prose.\n\n```ts\nconst a = ["metadata.guide"]\n```\n')).toEqual([])
  })
})
