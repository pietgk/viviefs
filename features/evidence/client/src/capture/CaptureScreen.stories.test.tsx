import { afterEach, describe, expect, it } from '@effect/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as axe from 'axe-core'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { CaptureScreen, FIXTURE_HASH } from './CaptureScreen.tsx'
import { CaptureView } from './CaptureView.tsx'
import type { CaptureDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { idleInteraction } from './interaction.ts'
import { selectCaptureScreen } from './screen-view.ts'
import { xstateDriver } from './xstate.ts'

const ready = { _tag: 'ready' as const }

afterEach(() => {
  cleanup()
})

const viewStories = [
  {
    name: 'idle empty',
    view: selectCaptureScreen(null, idleInteraction, ready),
  },
  {
    name: 'previewing',
    view: selectCaptureScreen(
      null,
      { phase: 'previewing', previewHash: 'blob:local' },
      ready,
    ),
  },
  {
    name: 'waiting review',
    view: selectCaptureScreen(
      {
        id: 'Oorg/E1',
        title: 'Q3 backup log',
        fileHash: 'blob:9f2',
        captured: true,
      },
      idleInteraction,
      { _tag: 'waitingReview' },
    ),
  },
] as const

const passingDrivers: ReadonlyArray<CaptureDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

const expectAccessible = async (container: HTMLElement) => {
  const results = await axe.run(container)
  expect(results.violations).toEqual([])
}

describe('CaptureScreen stories', () => {
  for (const story of viewStories) {
    it(`${story.name} is accessible`, async () => {
      const rendered = render(
        <CaptureView
          view={story.view}
          titleDraft={story.view.title}
          onTitleChange={() => undefined}
          onTitleSettle={() => undefined}
          onCapture={() => undefined}
          onTakePhoto={() => undefined}
          onCancel={() => undefined}
          onConfirm={() => undefined}
          onRetake={() => undefined}
        />,
      )
      await expectAccessible(rendered.container)
    })
  }

  for (const driver of passingDrivers) {
    it(`${driver.name} wired story completes capture`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      const rendered = render(
        <CaptureScreen
          session={session}
          readModel={null}
          status={ready}
          onSettleTitle={() => undefined}
        />,
      )
      await expectAccessible(rendered.container)
      fireEvent.click(screen.getByRole('button', { name: 'Capture' }))
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Take photo' }),
        ).toBeTruthy(),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Take photo' }))
      await waitFor(() =>
        expect(screen.getByTestId('capture-hash').textContent).toBe(FIXTURE_HASH),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Capture' })).toBeTruthy(),
      )
    })
  }
})
