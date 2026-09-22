import { afterEach, describe, expect, it } from '@effect/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as axe from 'axe-core'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { IntentComposerScreen, FIXTURE_HASH } from './IntentComposerScreen.tsx'
import { IntentComposerView } from './IntentComposerView.tsx'
import type { ComposerDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { emptyComposer } from './interaction.ts'
import { selectIntentComposer } from './screen-view.ts'
import { xstateDriver } from './xstate.ts'

const ready = { _tag: 'ready' as const }

afterEach(() => {
  cleanup()
})

const viewStories = [
  {
    name: 'empty',
    view: selectIntentComposer(null, emptyComposer, ready),
  },
  {
    name: 'reviewing',
    view: selectIntentComposer(
      null,
      { phase: 'reviewing', candidateHash: 'blob:local' },
      ready,
    ),
  },
  {
    name: 'waiting review',
    view: selectIntentComposer(
      {
        id: 'Oorg/E1',
        title: 'Q3 backup log',
        fileHash: 'blob:9f2',
        captured: true,
      },
      emptyComposer,
      { _tag: 'waitingReview' },
    ),
  },
] as const

const passingDrivers: ReadonlyArray<ComposerDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

const expectAccessible = async (container: HTMLElement) => {
  const results = await axe.run(container)
  expect(results.violations).toEqual([])
}

describe('IntentComposer stories', () => {
  for (const story of viewStories) {
    it(`${story.name} is accessible`, async () => {
      const rendered = render(
        <IntentComposerView
          view={story.view}
          titleDraft={story.view.title}
          onTitleChange={() => undefined}
          onTitleSettle={() => undefined}
          onCompose={() => undefined}
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
    it(`${driver.name} wired story completes compose`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      const rendered = render(
        <IntentComposerScreen
          session={session}
          readModel={null}
          status={ready}
          onSettleTitle={() => undefined}
        />,
      )
      await expectAccessible(rendered.container)
      fireEvent.click(screen.getByRole('button', { name: 'Compose' }))
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Take photo' }),
        ).toBeTruthy(),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Take photo' }))
      await waitFor(() =>
        expect(screen.getByTestId('intent-hash').textContent).toBe(FIXTURE_HASH),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Compose' })).toBeTruthy(),
      )
    })
  }
})
