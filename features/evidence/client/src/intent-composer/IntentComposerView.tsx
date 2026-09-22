import type { IntentComposerViewModel } from './screen-view.ts'

export type IntentComposerViewProps = {
  readonly view: IntentComposerViewModel
  readonly titleDraft: string
  readonly onTitleChange: (text: string) => void
  readonly onTitleSettle: () => void
  readonly onCompose: () => void
  readonly onTakePhoto: () => void
  readonly onCancel: () => void
  readonly onConfirm: () => void
  readonly onRetake: () => void
}

/**
 * Pure view over a screen-view selector (D41). Stories and tests pass fakes.
 */
export function IntentComposerView({
  view,
  titleDraft,
  onTitleChange,
  onTitleSettle,
  onCompose,
  onTakePhoto,
  onCancel,
  onConfirm,
  onRetake,
}: IntentComposerViewProps) {
  return (
    <main data-testid="intent-composer">
      <h1>Compose intent</h1>
      <p data-testid="intent-status">{view.statusMessage}</p>
      {view.showTitleInput ? (
        <label>
          Title
          <input
            data-testid="intent-title"
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
        <p data-testid="intent-hash">{view.displayedHash}</p>
      ) : null}
      {view.composeEnabled ? (
        <button type="button" onClick={onCompose}>
          Compose
        </button>
      ) : null}
      {view.phase === 'composing' ? (
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
