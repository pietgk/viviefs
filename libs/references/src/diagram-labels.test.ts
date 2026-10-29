// Diagram labels are prose (D180): every label of a Mermaid diagram, with the
// source line it is on, and nothing that is only the diagram's structure.
// The diagrams are those of How a pattern is delivered, as the human reviewed it.
import { describe, expect, it } from '@effect/vitest'
import { diagramLabels } from './diagram-labels.ts'

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

  it('reads no other fenced code, and no prose', () => {
    expect(diagramLabels('A `metadata.guide` in prose.\n\n```ts\nconst a = ["metadata.guide"]\n```\n')).toEqual([])
  })
})
