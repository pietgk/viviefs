import { createActor, fromPromise, setup, assign } from 'xstate'
import * as Effect from 'effect/Effect'
import type { ComposerDriver, ComposerSession } from './driver.ts'
import type { ComposerEvent } from './interaction.ts'

/**
 * Retained probe. XState v5 + Effect via `fromPromise` (D12).
 * `Effect.runPromise` is the mandated seam.
 */
export const xstateDriver: ComposerDriver = {
  name: 'xstate',
  start: (deps) =>
    Effect.sync(() => {
      const machine = setup({
        types: {
          context: {} as { candidateHash: string | null },
          events: {} as
            | { type: 'START' }
            | { type: 'CANDIDATE'; hash: string }
            | { type: 'RETAKE' }
            | { type: 'CANCEL' }
            | { type: 'CONFIRM' },
        },
        actors: {
          submitIntent: fromPromise(
            ({ input }: { input: { hash: string } }) =>
              Effect.runPromise(deps.submit(input.hash)),
          ),
        },
      }).createMachine({
        id: 'intentComposer',
        context: { candidateHash: null },
        initial: 'empty',
        states: {
          empty: {
            on: { START: 'composing' },
          },
          composing: {
            on: {
              CANDIDATE: {
                target: 'reviewing',
                actions: assign({
                  candidateHash: ({ event }) =>
                    event.type === 'CANDIDATE' ? event.hash : null,
                }),
              },
              CANCEL: {
                target: 'empty',
                actions: assign({ candidateHash: () => null }),
              },
            },
          },
          reviewing: {
            on: {
              RETAKE: {
                target: 'composing',
                actions: assign({ candidateHash: () => null }),
              },
              CANCEL: {
                target: 'empty',
                actions: assign({ candidateHash: () => null }),
              },
              CONFIRM: 'submitting',
            },
          },
          submitting: {
            invoke: {
              src: 'submitIntent',
              input: ({ context }) => ({ hash: context.candidateHash ?? '' }),
              onDone: {
                target: 'empty',
                actions: assign({ candidateHash: () => null }),
              },
              onError: 'reviewing',
            },
          },
        },
      })

      const actor = createActor(machine)
      actor.start()

      const session: ComposerSession = {
        snapshot: () => {
          const snap = actor.getSnapshot()
          const phase = typeof snap.value === 'string' ? snap.value : 'empty'
          return {
            phase:
              phase === 'composing' ||
              phase === 'reviewing' ||
              phase === 'submitting'
                ? phase
                : 'empty',
            candidateHash: snap.context.candidateHash,
          }
        },
        send: (event: ComposerEvent) => {
          switch (event._tag) {
            case 'Start':
              actor.send({ type: 'START' })
              return
            case 'Candidate':
              actor.send({ type: 'CANDIDATE', hash: event.hash })
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
