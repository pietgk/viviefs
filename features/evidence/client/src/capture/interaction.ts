/**
 * Ephemeral capture interaction (D11, D12, D41). Durable progress lives in
 * the workflow; this tagged union is the screen's interaction owner.
 */
export type CapturePhase =
  | 'idle'
  | 'capturing'
  | 'previewing'
  | 'submitting'

export type CaptureInteraction = {
  readonly phase: CapturePhase
  readonly previewHash: string | null
}

export const idleInteraction: CaptureInteraction = {
  phase: 'idle',
  previewHash: null,
}

export type CaptureEvent =
  | { readonly _tag: 'StartCapture' }
  | { readonly _tag: 'Preview'; readonly hash: string }
  | { readonly _tag: 'Retake' }
  | { readonly _tag: 'Cancel' }
  | { readonly _tag: 'Confirm' }

export const CaptureEvent = {
  start: { _tag: 'StartCapture' } as const,
  preview: (hash: string): CaptureEvent => ({ _tag: 'Preview', hash }),
  retake: { _tag: 'Retake' } as const,
  cancel: { _tag: 'Cancel' } as const,
  confirm: { _tag: 'Confirm' } as const,
}
