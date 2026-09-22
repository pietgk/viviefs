import { afterEach, describe, expect, it } from '@effect/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { IntentComposerScreen, FIXTURE_HASH } from './IntentComposerScreen.tsx'
import type { ComposerDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { xstateDriver } from './xstate.ts'

const passingDrivers: ReadonlyArray<ComposerDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

const ready = { _tag: 'ready' as const }

afterEach(() => {
  cleanup()
})

describe('IntentComposerScreen', () => {
  for (const driver of passingDrivers) {
    it(`${driver.name} renders the composer through the shared view`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      render(
        <IntentComposerScreen
          session={session}
          readModel={null}
          status={ready}
          onSettleTitle={() => undefined}
        />,
      )
      expect(screen.getByTestId('intent-status').textContent).toBe(
        'Ready to compose',
      )
      fireEvent.click(screen.getByRole('button', { name: 'Compose' }))
      await waitFor(() =>
        expect(screen.getByTestId('intent-status').textContent).toBe(
          'Composing',
        ),
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

    it(`${driver.name} keeps waiting-for-review on domain status`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      render(
        <IntentComposerScreen
          session={session}
          readModel={{
            id: 'Oorg/E1',
            title: 'Q3 backup log',
            fileHash: 'blob:9f2',
            captured: true,
          }}
          status={{ _tag: 'waitingReview' }}
          onSettleTitle={() => undefined}
        />,
      )
      expect(screen.getByTestId('intent-status').textContent).toBe(
        'Waiting for reviewer approval',
      )
      expect(screen.queryByRole('button', { name: 'Compose' })).toBeNull()
      expect(screen.queryByTestId('intent-title')).toBeNull()
    })
  }
})
