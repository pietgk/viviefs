/**
 * One graph for the effect-machine handle and the teaching diagram.
 * A later renderer may emit XState JSON from this same object.
 */
export const intentComposerGraph = {
  initial: 'Empty',
  states: {
    Empty: { on: { Start: 'Composing' } },
    Composing: { on: { Candidate: 'Reviewing', Cancel: 'Empty' } },
    Reviewing: {
      on: { Retake: 'Composing', Cancel: 'Empty', Confirm: 'Submitting' },
    },
    Submitting: {
      invoke: { onDone: 'Empty', onFailure: 'Reviewing' },
    },
  },
} as const

export type IntentComposerGraph = typeof intentComposerGraph

const phaseName = (state: string): string => state.toLowerCase()

const edgeLabel: Readonly<Record<string, string>> = {
  Start: 'start',
  Candidate: 'candidate(hash)',
  Retake: 'retake',
  Cancel: 'cancel',
  Confirm: 'confirm',
  onDone: 'command ok',
  onFailure: 'command fail',
}

export const intentComposerMermaid = (
  graph: IntentComposerGraph = intentComposerGraph,
): string => {
  const lines = ['stateDiagram-v2', `  [*] --> ${phaseName(graph.initial)}`]
  for (const [state, body] of Object.entries(graph.states)) {
    if ('on' in body) {
      for (const [event, target] of Object.entries(body.on)) {
        lines.push(
          `  ${phaseName(state)} --> ${phaseName(target)}: ${edgeLabel[event] ?? event}`,
        )
      }
    }
    if ('invoke' in body) {
      lines.push(
        `  ${phaseName(state)} --> ${phaseName(body.invoke.onDone)}: ${edgeLabel.onDone}`,
      )
      lines.push(
        `  ${phaseName(state)} --> ${phaseName(body.invoke.onFailure)}: ${edgeLabel.onFailure}`,
      )
    }
  }
  return `${lines.join('\n')}\n`
}
