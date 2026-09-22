import * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import * as Effect from 'effect/Effect'
import type { ComposerDriver, ComposerSession } from './driver.ts'
import {
  emptyComposer,
  type ComposerEvent,
  type ComposerSnapshot,
} from './interaction.ts'

const applyEvent = (
  current: ComposerSnapshot,
  event: ComposerEvent,
): ComposerSnapshot => {
  switch (event._tag) {
    case 'Start':
      return current.phase === 'empty'
        ? { phase: 'composing', candidateHash: null }
        : current
    case 'Candidate':
      return current.phase === 'composing'
        ? { phase: 'reviewing', candidateHash: event.hash }
        : current
    case 'Retake':
      return current.phase === 'reviewing'
        ? { phase: 'composing', candidateHash: null }
        : current
    case 'Cancel':
      return current.phase === 'composing' || current.phase === 'reviewing'
        ? emptyComposer
        : current
    case 'Confirm':
      return current.phase === 'reviewing' && current.candidateHash !== null
        ? { phase: 'submitting', candidateHash: current.candidateHash }
        : current
  }
}

/** Retained probe. Query atoms stay on Atom; IntentComposer does not. */
export const atomDriver: ComposerDriver = {
  name: 'atom',
  start: (deps) =>
    Effect.sync(() => {
      const registry = AtomRegistry.make()
      const interaction = Atom.make<ComposerSnapshot>(emptyComposer)
      const session: ComposerSession = {
        snapshot: () => registry.get(interaction),
        send: (event) => {
          const current = registry.get(interaction)
          const next = applyEvent(current, event)
          registry.set(interaction, next)
          if (
            event._tag === 'Confirm' &&
            next.phase === 'submitting' &&
            next.candidateHash !== null
          ) {
            const hash = next.candidateHash
            Effect.runFork(
              deps.submit(hash).pipe(
                Effect.match({
                  onFailure: () => {
                    registry.set(interaction, {
                      phase: 'reviewing',
                      candidateHash: hash,
                    })
                  },
                  onSuccess: () => {
                    registry.set(interaction, emptyComposer)
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
