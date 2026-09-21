import * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import * as Effect from 'effect/Effect'
import type { CaptureDriver, CaptureSession } from './driver.ts'
import { idleInteraction, type CaptureInteraction } from './interaction.ts'

/**
 * Positive control: Confirm is a no-op, so the screen cannot finish a capture.
 * The harness is broken if this variant still passes the shared tests.
 */
export const brokenDriver: CaptureDriver = {
  name: 'broken',
  start: () =>
    Effect.sync(() => {
      const registry = AtomRegistry.make()
      const interaction = Atom.make<CaptureInteraction>(idleInteraction)
      const session: CaptureSession = {
        snapshot: () => registry.get(interaction),
        send: (event) => {
          const current = registry.get(interaction)
          if (event._tag === 'StartCapture' && current.phase === 'idle') {
            registry.set(interaction, {
              phase: 'capturing',
              previewHash: null,
            })
            return
          }
          if (event._tag === 'Preview' && current.phase === 'capturing') {
            registry.set(interaction, {
              phase: 'previewing',
              previewHash: event.hash,
            })
            return
          }
          if (event._tag === 'Cancel') {
            registry.set(interaction, idleInteraction)
          }
        },
        subscribe: (listener) => registry.subscribe(interaction, listener),
      }
      return session
    }),
}
