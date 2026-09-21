import { useEffect, useState } from 'react'
import { TEXT_SETTLE_MS, useSettledText } from '@viviefs/ui'
import { CaptureEvent } from './interaction.ts'
import { selectCaptureScreen } from './screen-view.ts'
import type { CaptureStatus, EvidenceReadModel } from './screen-view.ts'
import type { CaptureSession } from './driver.ts'
import { CaptureView } from './CaptureView.tsx'

export const FIXTURE_HASH = 'blob:p08-fixture'

export function CaptureScreen({
  session,
  readModel,
  status,
  onSettleTitle,
  settleMs = TEXT_SETTLE_MS,
}: {
  readonly session: CaptureSession
  readonly readModel: EvidenceReadModel | null
  readonly status: CaptureStatus
  readonly onSettleTitle: (title: string) => void
  readonly settleMs?: number
}) {
  const [, bump] = useState(0)
  useEffect(() => session.subscribe(() => bump((count) => count + 1)), [session])
  const view = selectCaptureScreen(readModel, session.snapshot(), status)
  const title = useSettledText(view.title, onSettleTitle, settleMs)
  return (
    <CaptureView
      view={view}
      titleDraft={title.text}
      onTitleChange={title.change}
      onTitleSettle={title.settle}
      onCapture={() => session.send(CaptureEvent.start)}
      onTakePhoto={() => session.send(CaptureEvent.preview(FIXTURE_HASH))}
      onCancel={() => session.send(CaptureEvent.cancel)}
      onConfirm={() => session.send(CaptureEvent.confirm)}
      onRetake={() => session.send(CaptureEvent.retake)}
    />
  )
}
