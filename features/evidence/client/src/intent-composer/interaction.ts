/**
 * Ephemeral IntentComposer (D11, D12, D41). Durable progress lives in the
 * workflow. This snapshot is the screen's interaction owner, not a transaction.
 */
export type ComposerPhase =
  | 'empty'
  | 'composing'
  | 'reviewing'
  | 'submitting'

export type ComposerSnapshot = {
  readonly phase: ComposerPhase
  readonly candidateHash: string | null
}

export const emptyComposer: ComposerSnapshot = {
  phase: 'empty',
  candidateHash: null,
}

export type ComposerEvent =
  | { readonly _tag: 'Start' }
  | { readonly _tag: 'Candidate'; readonly hash: string }
  | { readonly _tag: 'Retake' }
  | { readonly _tag: 'Cancel' }
  | { readonly _tag: 'Confirm' }

export const ComposerEvent = {
  start: { _tag: 'Start' } as const,
  candidate: (hash: string): ComposerEvent => ({ _tag: 'Candidate', hash }),
  retake: { _tag: 'Retake' } as const,
  cancel: { _tag: 'Cancel' } as const,
  confirm: { _tag: 'Confirm' } as const,
}
