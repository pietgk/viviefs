import * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import * as Effect from 'effect/Effect'
import type { CaptureDriver, CaptureSession } from './driver.ts'
import {
  idleInteraction,
  type CaptureEvent,
  type CaptureInteraction,
} from './interaction.ts'

const applyEvent = (
  current: CaptureInteraction,
  event: CaptureEvent,
): CaptureInteraction => {
  switch (event._tag) {
    case 'StartCapture':
      return current.phase === 'idle'
        ? { phase: 'capturing', previewHash: null }
        : current
    case 'Preview':
      return current.phase === 'capturing'
        ? { phase: 'previewing', previewHash: event.hash }
        : current
    case 'Retake':
      return current.phase === 'previewing'
        ? { phase: 'capturing', previewHash: null }
        : current
    case 'Cancel':
      return current.phase === 'capturing' || current.phase === 'previewing'
        ? idleInteraction
        : current
    case 'Confirm':
      return current.phase === 'previewing' && current.previewHash !== null
        ? { phase: 'submitting', previewHash: current.previewHash }
        : current
  }
}

export const atomDriver: CaptureDriver = {
  name: 'atom',
  start: (deps) =>
    Effect.sync(() => {
      const registry = AtomRegistry.make()
      const interaction = Atom.make<CaptureInteraction>(idleInteraction)
      const session: CaptureSession = {
        snapshot: () => registry.get(interaction),
        send: (event) => {
          const current = registry.get(interaction)
          const next = applyEvent(current, event)
          registry.set(interaction, next)
          if (
            event._tag === 'Confirm' &&
            next.phase === 'submitting' &&
            next.previewHash !== null
          ) {
            const hash = next.previewHash
            Effect.runFork(
              deps.submit(hash).pipe(
                Effect.match({
                  onFailure: () => {
                    registry.set(interaction, {
                      phase: 'previewing',
                      previewHash: hash,
                    })
                  },
                  onSuccess: () => {
                    registry.set(interaction, idleInteraction)
                  },
                }),
              ),
            )
          }
        },
        subscribe: (listener) => registry.subscribe(interaction, listener),
      }
      return session
    }),
}
