import { useEffect, useState } from 'react'
import { TEXT_SETTLE_MS, useSettledText } from '@viviefs/ui'
import { ComposerEvent } from './interaction.ts'
import { selectIntentComposer } from './screen-view.ts'
import type { EvidenceReadModel, ScreenStatus } from './screen-view.ts'
import type { ComposerSession } from './driver.ts'
import { IntentComposerView } from './IntentComposerView.tsx'

export const FIXTURE_HASH = 'blob:p08-fixture'

export function IntentComposerScreen({
  session,
  readModel,
  status,
  onSettleTitle,
  settleMs = TEXT_SETTLE_MS,
}: {
  readonly session: ComposerSession
  readonly readModel: EvidenceReadModel | null
  readonly status: ScreenStatus
  readonly onSettleTitle: (title: string) => void
  readonly settleMs?: number
}) {
  const [, bump] = useState(0)
  useEffect(
    () => session.subscribe(() => bump((count) => count + 1)),
    [session],
  )
  const view = selectIntentComposer(readModel, session.snapshot(), status)
  const title = useSettledText(view.title, onSettleTitle, settleMs)
  return (
    <IntentComposerView
      view={view}
      titleDraft={title.text}
      onTitleChange={title.change}
      onTitleSettle={title.settle}
      onCompose={() => session.send(ComposerEvent.start)}
      onTakePhoto={() => session.send(ComposerEvent.candidate(FIXTURE_HASH))}
      onCancel={() => session.send(ComposerEvent.cancel)}
      onConfirm={() => session.send(ComposerEvent.confirm)}
      onRetake={() => session.send(ComposerEvent.retake)}
    />
  )
}
