import type { CaptureScreenView } from './screen-view.ts'

export type CaptureViewProps = {
  readonly view: CaptureScreenView
  readonly titleDraft: string
  readonly onTitleChange: (text: string) => void
  readonly onTitleSettle: () => void
  readonly onCapture: () => void
  readonly onTakePhoto: () => void
  readonly onCancel: () => void
  readonly onConfirm: () => void
  readonly onRetake: () => void
}

/**
 * Pure view over a screen-view selector (D41). Stories and tests pass fakes.
 */
export function CaptureView({
  view,
  titleDraft,
  onTitleChange,
  onTitleSettle,
  onCapture,
  onTakePhoto,
  onCancel,
  onConfirm,
  onRetake,
}: CaptureViewProps) {
  return (
    <main data-testid="capture-screen">
      <h1>Capture evidence</h1>
      <p data-testid="capture-status">{view.statusMessage}</p>
      {view.showTitleInput ? (
        <label>
          Title
          <input
            data-testid="capture-title"
            value={titleDraft}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleSettle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onTitleSettle()
            }}
          />
        </label>
      ) : null}
      {view.displayedHash ? (
        <p data-testid="capture-hash">{view.displayedHash}</p>
      ) : null}
      {view.captureEnabled ? (
        <button type="button" onClick={onCapture}>
          Capture
        </button>
      ) : null}
      {view.phase === 'capturing' ? (
        <button type="button" onClick={onTakePhoto}>
          Take photo
        </button>
      ) : null}
      {view.retakeEnabled ? (
        <button type="button" onClick={onRetake}>
          Retake
        </button>
      ) : null}
      {view.confirmEnabled ? (
        <button type="button" onClick={onConfirm}>
          Confirm
        </button>
      ) : null}
      {view.cancelEnabled ? (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
    </main>
  )
}
