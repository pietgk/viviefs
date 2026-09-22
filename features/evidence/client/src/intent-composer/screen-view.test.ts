import { describe, expect, it } from '@effect/vitest'
import { emptyComposer } from './interaction.ts'
import {
  selectIntentComposer,
  type EvidenceReadModel,
  type ScreenStatus,
} from './screen-view.ts'

const evidence: EvidenceReadModel = {
  id: 'Oorg/E1',
  title: 'Q3 backup log',
  fileHash: 'blob:9f2',
  captured: true,
}

const ready: ScreenStatus = { _tag: 'ready' }

describe('selectIntentComposer', () => {
  it('reads the committed title and file from the read model while empty', () => {
    const view = selectIntentComposer(evidence, emptyComposer, ready)
    expect(view.title).toBe('Q3 backup log')
    expect(view.displayedHash).toBe('blob:9f2')
    expect(view.composeEnabled).toBe(true)
    expect(view.confirmEnabled).toBe(false)
    expect(view.candidateVisible).toBe(false)
    expect(view.waitingReview).toBe(false)
    expect(view.statusMessage).toBe('Ready to compose')
  })

  it('uses an empty title when the entity does not exist yet', () => {
    const view = selectIntentComposer(null, emptyComposer, ready)
    expect(view.title).toBe('')
    expect(view.displayedHash).toBe(null)
  })

  it('shows the candidate hash instead of the committed file', () => {
    const view = selectIntentComposer(
      evidence,
      { phase: 'reviewing', candidateHash: 'blob:local' },
      ready,
    )
    expect(view.displayedHash).toBe('blob:local')
    expect(view.candidateVisible).toBe(true)
    expect(view.confirmEnabled).toBe(true)
    expect(view.retakeEnabled).toBe(true)
    expect(view.composeEnabled).toBe(false)
    expect(view.statusMessage).toBe('Reviewing')
  })

  it('keeps waiting-for-review on status, not on the composer phase', () => {
    const view = selectIntentComposer(evidence, emptyComposer, {
      _tag: 'waitingReview',
    })
    expect(view.waitingReview).toBe(true)
    expect(view.composeEnabled).toBe(false)
    expect(view.showTitleInput).toBe(false)
    expect(view.phase).toBe('empty')
    expect(view.statusMessage).toBe('Waiting for reviewer approval')
  })

  it('disables compose while loading or failed', () => {
    expect(
      selectIntentComposer(evidence, emptyComposer, { _tag: 'loading' })
        .composeEnabled,
    ).toBe(false)
    expect(
      selectIntentComposer(evidence, emptyComposer, {
        _tag: 'error',
        message: 'offline',
      }).statusMessage,
    ).toBe('offline')
  })

  it('marks submitting from the composer while still showing the candidate', () => {
    const view = selectIntentComposer(
      evidence,
      { phase: 'submitting', candidateHash: 'blob:local' },
      ready,
    )
    expect(view.submitting).toBe(true)
    expect(view.candidateVisible).toBe(true)
    expect(view.confirmEnabled).toBe(false)
    expect(view.statusMessage).toBe('Submitting')
  })
})
