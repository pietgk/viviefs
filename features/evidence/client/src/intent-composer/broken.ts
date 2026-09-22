import * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import * as Effect from 'effect/Effect'
import type { ComposerDriver, ComposerSession } from './driver.ts'
import { emptyComposer, type ComposerSnapshot } from './interaction.ts'

/**
 * Positive control: Confirm is a no-op, so the composer cannot finish.
 * The harness is broken if this variant still passes the shared tests.
 */
export const brokenDriver: ComposerDriver = {
  name: 'broken',
  start: () =>
    Effect.sync(() => {
      const registry = AtomRegistry.make()
      const interaction = Atom.make<ComposerSnapshot>(emptyComposer)
      const session: ComposerSession = {
        snapshot: () => registry.get(interaction),
        send: (event) => {
          const current = registry.get(interaction)
          if (event._tag === 'Start' && current.phase === 'empty') {
            registry.set(interaction, {
              phase: 'composing',
              candidateHash: null,
            })
            return
          }
          if (event._tag === 'Candidate' && current.phase === 'composing') {
            registry.set(interaction, {
              phase: 'reviewing',
              candidateHash: event.hash,
            })
            return
          }
          if (event._tag === 'Cancel') {
            registry.set(interaction, emptyComposer)
          }
        },
        subscribe: (listener) => registry.subscribe(interaction, listener),
      }
      return session
    }),
}
