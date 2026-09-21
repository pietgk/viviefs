import type { CaptureInteraction, CapturePhase } from './interaction.ts'

/**
 * Domain facts the capture screen reads. Never written by the view (D41).
 */
export type EvidenceReadModel = {
  readonly id: string
  readonly title: string
  readonly fileHash: string | null
  readonly captured: boolean
}

/**
 * Client status, including durable "waiting for review". That fact is not
 * an interaction phase (D11).
 */
export type CaptureStatus =
  | { readonly _tag: 'loading' }
  | { readonly _tag: 'ready' }
  | { readonly _tag: 'error'; readonly message: string }
  | { readonly _tag: 'waitingReview' }

/**
 * Everything CaptureView renders. Pure: tests pass three literals.
 */
export type CaptureScreenView = {
  readonly title: string
  readonly displayedHash: string | null
  readonly phase: CapturePhase
  readonly captureEnabled: boolean
  readonly confirmEnabled: boolean
  readonly cancelEnabled: boolean
  readonly retakeEnabled: boolean
  readonly previewVisible: boolean
  readonly submitting: boolean
  readonly waitingReview: boolean
  readonly showTitleInput: boolean
  readonly statusMessage: string
}

export const selectCaptureScreen = (
  readModel: EvidenceReadModel | null,
  interaction: CaptureInteraction,
  status: CaptureStatus,
): CaptureScreenView => {
  const waitingReview = status._tag === 'waitingReview'
  const ready = status._tag === 'ready'
  const previewing =
    interaction.phase === 'previewing' || interaction.phase === 'submitting'
  const title = readModel?.title ?? ''
  const displayedHash = previewing
    ? interaction.previewHash
    : (readModel?.fileHash ?? null)

  return {
    title,
    displayedHash,
    phase: interaction.phase,
    captureEnabled: ready && interaction.phase === 'idle' && !waitingReview,
    confirmEnabled: ready && interaction.phase === 'previewing',
    cancelEnabled:
      ready &&
      (interaction.phase === 'capturing' || interaction.phase === 'previewing'),
    retakeEnabled: ready && interaction.phase === 'previewing',
    previewVisible: previewing && interaction.previewHash !== null,
    submitting: interaction.phase === 'submitting',
    waitingReview,
    showTitleInput: ready && !waitingReview,
    statusMessage: statusMessage(status, interaction.phase),
  }
}

const statusMessage = (
  status: CaptureStatus,
  phase: CapturePhase,
): string => {
  switch (status._tag) {
    case 'loading':
      return 'Loading evidence'
    case 'error':
      return status.message
    case 'waitingReview':
      return 'Waiting for reviewer approval'
    case 'ready':
      switch (phase) {
        case 'capturing':
          return 'Capturing'
        case 'previewing':
          return 'Preview ready'
        case 'submitting':
          return 'Saving capture'
        case 'idle':
          return 'Ready to capture'
      }
  }
}
