import { describe, expect, it } from '@effect/vitest'
import { idleInteraction } from './interaction.ts'
import {
  selectCaptureScreen,
  type CaptureStatus,
  type EvidenceReadModel,
} from './screen-view.ts'

const evidence: EvidenceReadModel = {
  id: 'Oorg/E1',
  title: 'Q3 backup log',
  fileHash: 'blob:9f2',
  captured: true,
}

const ready: CaptureStatus = { _tag: 'ready' }

describe('selectCaptureScreen', () => {
  it('reads the committed title and file from the read model while idle', () => {
    const view = selectCaptureScreen(evidence, idleInteraction, ready)
    expect(view.title).toBe('Q3 backup log')
    expect(view.displayedHash).toBe('blob:9f2')
    expect(view.captureEnabled).toBe(true)
    expect(view.confirmEnabled).toBe(false)
    expect(view.previewVisible).toBe(false)
    expect(view.waitingReview).toBe(false)
    expect(view.statusMessage).toBe('Ready to capture')
  })

  it('uses an empty title when the entity does not exist yet', () => {
    const view = selectCaptureScreen(null, idleInteraction, ready)
    expect(view.title).toBe('')
    expect(view.displayedHash).toBe(null)
  })

  it('shows the interaction preview hash instead of the committed file', () => {
    const view = selectCaptureScreen(
      evidence,
      { phase: 'previewing', previewHash: 'blob:local' },
      ready,
    )
    expect(view.displayedHash).toBe('blob:local')
    expect(view.previewVisible).toBe(true)
    expect(view.confirmEnabled).toBe(true)
    expect(view.retakeEnabled).toBe(true)
    expect(view.captureEnabled).toBe(false)
    expect(view.statusMessage).toBe('Preview ready')
  })

  it('keeps waiting-for-review on status, not on the interaction phase', () => {
    const view = selectCaptureScreen(evidence, idleInteraction, {
      _tag: 'waitingReview',
    })
    expect(view.waitingReview).toBe(true)
    expect(view.captureEnabled).toBe(false)
    expect(view.showTitleInput).toBe(false)
    expect(view.phase).toBe('idle')
    expect(view.statusMessage).toBe('Waiting for reviewer approval')
  })

  it('disables capture while loading or failed', () => {
    expect(
      selectCaptureScreen(evidence, idleInteraction, { _tag: 'loading' })
        .captureEnabled,
    ).toBe(false)
    expect(
      selectCaptureScreen(evidence, idleInteraction, {
        _tag: 'error',
        message: 'offline',
      }).statusMessage,
    ).toBe('offline')
  })

  it('marks submitting from interaction while still showing the preview', () => {
    const view = selectCaptureScreen(
      evidence,
      { phase: 'submitting', previewHash: 'blob:local' },
      ready,
    )
    expect(view.submitting).toBe(true)
    expect(view.previewVisible).toBe(true)
    expect(view.confirmEnabled).toBe(false)
    expect(view.statusMessage).toBe('Saving capture')
  })
})
