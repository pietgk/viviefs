import { createActor, fromPromise, setup, assign } from 'xstate'
import * as Effect from 'effect/Effect'
import type { CaptureDriver, CaptureSession } from './driver.ts'
import type { CaptureEvent } from './interaction.ts'

/**
 * XState v5 + Effect via `fromPromise` (D12). `Effect.runPromise` is the
 * mandated seam; this file is the P08 XState variant, not domain workflow
 * code.
 */
export const xstateDriver: CaptureDriver = {
  name: 'xstate',
  start: (deps) =>
    Effect.sync(() => {
      const machine = setup({
        types: {
          context: {} as { previewHash: string | null },
          events: {} as
            | { type: 'START' }
            | { type: 'PREVIEW'; hash: string }
            | { type: 'RETAKE' }
            | { type: 'CANCEL' }
            | { type: 'CONFIRM' },
        },
        actors: {
          submitCapture: fromPromise(
            ({ input }: { input: { hash: string } }) =>
              Effect.runPromise(deps.submit(input.hash)),
          ),
        },
      }).createMachine({
        id: 'capture',
        context: { previewHash: null },
        initial: 'idle',
        states: {
          idle: {
            on: { START: 'capturing' },
          },
          capturing: {
            on: {
              PREVIEW: {
                target: 'previewing',
                actions: assign({
                  previewHash: ({ event }) =>
                    event.type === 'PREVIEW' ? event.hash : null,
                }),
              },
              CANCEL: {
                target: 'idle',
                actions: assign({ previewHash: () => null }),
              },
            },
          },
          previewing: {
            on: {
              RETAKE: {
                target: 'capturing',
                actions: assign({ previewHash: () => null }),
              },
              CANCEL: {
                target: 'idle',
                actions: assign({ previewHash: () => null }),
              },
              CONFIRM: 'submitting',
            },
          },
          submitting: {
            invoke: {
              src: 'submitCapture',
              input: ({ context }) => ({ hash: context.previewHash ?? '' }),
              onDone: {
                target: 'idle',
                actions: assign({ previewHash: () => null }),
              },
              onError: 'previewing',
            },
          },
        },
      })

      const actor = createActor(machine)
      actor.start()

      const session: CaptureSession = {
        snapshot: () => {
          const snap = actor.getSnapshot()
          const phase = typeof snap.value === 'string' ? snap.value : 'idle'
          return {
            phase:
              phase === 'capturing' ||
              phase === 'previewing' ||
              phase === 'submitting'
                ? phase
                : 'idle',
            previewHash: snap.context.previewHash,
          }
        },
        send: (event: CaptureEvent) => {
          switch (event._tag) {
            case 'StartCapture':
              actor.send({ type: 'START' })
              return
            case 'Preview':
              actor.send({ type: 'PREVIEW', hash: event.hash })
              return
            case 'Retake':
              actor.send({ type: 'RETAKE' })
              return
            case 'Cancel':
              actor.send({ type: 'CANCEL' })
              return
            case 'Confirm':
              actor.send({ type: 'CONFIRM' })
          }
        },
        subscribe: (listener) => actor.subscribe(listener).unsubscribe,
      }
      return session
    }),
}
