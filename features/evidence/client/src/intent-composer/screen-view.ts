import type { ComposerPhase, ComposerSnapshot } from './interaction.ts'

/**
 * Domain facts the screen reads. Never written by the view (D41).
 */
export type EvidenceReadModel = {
  readonly id: string
  readonly title: string
  readonly fileHash: string | null
  readonly captured: boolean
}

/**
 * Client status, including durable "waiting for review". That fact is not
 * an IntentComposer phase (D11).
 */
export type ScreenStatus =
  | { readonly _tag: 'loading' }
  | { readonly _tag: 'ready' }
  | { readonly _tag: 'error'; readonly message: string }
  | { readonly _tag: 'waitingReview' }

/**
 * Everything IntentComposerView renders. Pure: tests pass three literals.
 */
export type IntentComposerViewModel = {
  readonly title: string
  readonly displayedHash: string | null
  readonly phase: ComposerPhase
  readonly composeEnabled: boolean
  readonly confirmEnabled: boolean
  readonly cancelEnabled: boolean
  readonly retakeEnabled: boolean
  readonly candidateVisible: boolean
  readonly submitting: boolean
  readonly waitingReview: boolean
  readonly showTitleInput: boolean
  readonly statusMessage: string
}

export const selectIntentComposer = (
  readModel: EvidenceReadModel | null,
  interaction: ComposerSnapshot,
  status: ScreenStatus,
): IntentComposerViewModel => {
  const waitingReview = status._tag === 'waitingReview'
  const ready = status._tag === 'ready'
  const showingCandidate =
    interaction.phase === 'reviewing' || interaction.phase === 'submitting'
  const title = readModel?.title ?? ''
  const displayedHash = showingCandidate
    ? interaction.candidateHash
    : (readModel?.fileHash ?? null)

  return {
    title,
    displayedHash,
    phase: interaction.phase,
    composeEnabled: ready && interaction.phase === 'empty' && !waitingReview,
    confirmEnabled: ready && interaction.phase === 'reviewing',
    cancelEnabled:
      ready &&
      (interaction.phase === 'composing' || interaction.phase === 'reviewing'),
    retakeEnabled: ready && interaction.phase === 'reviewing',
    candidateVisible: showingCandidate && interaction.candidateHash !== null,
    submitting: interaction.phase === 'submitting',
    waitingReview,
    showTitleInput: ready && !waitingReview,
    statusMessage: statusMessage(status, interaction.phase),
  }
}

const statusMessage = (status: ScreenStatus, phase: ComposerPhase): string => {
  switch (status._tag) {
    case 'loading':
      return 'Loading evidence'
    case 'error':
      return status.message
    case 'waitingReview':
      return 'Waiting for reviewer approval'
    case 'ready':
      switch (phase) {
        case 'composing':
          return 'Composing'
        case 'reviewing':
          return 'Reviewing'
        case 'submitting':
          return 'Submitting'
        case 'empty':
          return 'Ready to compose'
      }
  }
}
