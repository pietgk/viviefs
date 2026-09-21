import { afterEach, describe, expect, it } from '@effect/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as Effect from 'effect/Effect'
import { atomDriver } from './atom.ts'
import { CaptureScreen, FIXTURE_HASH } from './CaptureScreen.tsx'
import type { CaptureDriver } from './driver.ts'
import { effectMachineDriver } from './effect-machine.ts'
import { xstateDriver } from './xstate.ts'

const passingDrivers: ReadonlyArray<CaptureDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

const ready = { _tag: 'ready' as const }

afterEach(() => {
  cleanup()
})

describe('CaptureScreen', () => {
  for (const driver of passingDrivers) {
    it(`${driver.name} renders the capture flow through the shared view`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      render(
        <CaptureScreen
          session={session}
          readModel={null}
          status={ready}
          onSettleTitle={() => undefined}
        />,
      )
      expect(screen.getByTestId('capture-status').textContent).toBe(
        'Ready to capture',
      )
      fireEvent.click(screen.getByRole('button', { name: 'Capture' }))
      await waitFor(() =>
        expect(screen.getByTestId('capture-status').textContent).toBe(
          'Capturing',
        ),
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

    it(`${driver.name} keeps waiting-for-review on domain status`, async () => {
      const session = await Effect.runPromise(
        driver.start({ submit: () => Effect.void }),
      )
      render(
        <CaptureScreen
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
      expect(screen.getByTestId('capture-status').textContent).toBe(
        'Waiting for reviewer approval',
      )
      expect(screen.queryByRole('button', { name: 'Capture' })).toBeNull()
      expect(screen.queryByTestId('capture-title')).toBeNull()
    })
  }
})
