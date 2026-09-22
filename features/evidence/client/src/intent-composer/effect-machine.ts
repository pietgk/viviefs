import { Machine } from '@typeonce/effect-machine'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'
import type { ComposerDriver, ComposerSession } from './driver.ts'
import { intentComposerGraph } from './graph.ts'
import {
  emptyComposer,
  type ComposerEvent,
  type ComposerSnapshot,
} from './interaction.ts'

const Root = Machine.state({
  states: {
    Empty: {},
    Composing: {},
    Reviewing: { fields: { candidateHash: Schema.String } },
    Submitting: { fields: { candidateHash: Schema.String } },
  },
})

const targets = Machine.targets(Root)

const Events = Machine.events({
  Start: {},
  Candidate: { hash: Schema.String },
  Retake: {},
  Cancel: {},
  Confirm: {},
})

const toEvent = (event: ComposerEvent) => {
  switch (event._tag) {
    case 'Start':
      return Events.Start()
    case 'Candidate':
      return Events.Candidate({ hash: event.hash })
    case 'Retake':
      return Events.Retake()
    case 'Cancel':
      return Events.Cancel()
    case 'Confirm':
      return Events.Confirm()
  }
}

function targetOf(name: 'Empty'): typeof targets.root.Empty
function targetOf(name: 'Composing'): typeof targets.root.Composing
function targetOf(name: 'Reviewing'): typeof targets.root.Reviewing
function targetOf(name: 'Submitting'): typeof targets.root.Submitting
function targetOf(
  name: 'Empty' | 'Composing' | 'Reviewing' | 'Submitting',
) {
  switch (name) {
    case 'Empty':
      return targets.root.Empty
    case 'Composing':
      return targets.root.Composing
    case 'Reviewing':
      return targets.root.Reviewing
    case 'Submitting':
      return targets.root.Submitting
  }
}

const leafOf = (
  snapshot: unknown,
): {
  readonly path: string
  readonly value: { readonly candidateHash?: string }
} => {
  let node = snapshot as {
    readonly path?: string
    readonly value?: { readonly candidateHash?: string }
    readonly state?: unknown
  }
  while (node && typeof node === 'object' && 'state' in node && node.state) {
    node = node.state as typeof node
  }
  return {
    path: String(node?.path ?? ''),
    value: node?.value ?? {},
  }
}

const toSnapshot = (snapshot: unknown): ComposerSnapshot => {
  const leaf = leafOf(snapshot)
  const path = leaf.path
  const hash = leaf.value.candidateHash ?? null
  if (path.includes('Composing')) return { phase: 'composing', candidateHash: null }
  if (path.includes('Reviewing')) {
    return { phase: 'reviewing', candidateHash: hash }
  }
  if (path.includes('Submitting')) {
    return { phase: 'submitting', candidateHash: hash }
  }
  return emptyComposer
}

const logicalOf = (snapshot: unknown): unknown => {
  if (snapshot && typeof snapshot === 'object' && 'state' in snapshot) {
    return (snapshot as { readonly state: unknown }).state
  }
  return snapshot
}

const graph = intentComposerGraph

const makeMachine = (
  submit: (hash: string) => Effect.Effect<void, { readonly _tag: string }>,
) =>
  Machine.make({
    root: Root,
    events: Events,
    effects: {
      submit: (hash: string) => submit(hash),
    },
  }).handle({
    initial: { target: targetOf(graph.initial) },
    states: {
      Empty: {
        on: {
          Start: { target: targetOf(graph.states.Empty.on.Start) },
        },
      },
      Composing: {
        on: {
          Candidate: {
            target: targetOf(graph.states.Composing.on.Candidate),
            data: ({ event }: { readonly event: { readonly hash: string } }) => ({
              candidateHash: event.hash,
            }),
          },
          Cancel: { target: targetOf(graph.states.Composing.on.Cancel) },
        },
      },
      Reviewing: {
        on: {
          Retake: { target: targetOf(graph.states.Reviewing.on.Retake) },
          Cancel: { target: targetOf(graph.states.Reviewing.on.Cancel) },
          Confirm: {
            target: targetOf(graph.states.Reviewing.on.Confirm),
            data: ({
              state,
            }: {
              readonly state: { readonly candidateHash: string }
            }) => ({ candidateHash: state.candidateHash }),
          },
        },
      },
      Submitting: {
        invoke: {
          src: 'submit',
          input: ({
            state,
          }: {
            readonly state: { readonly candidateHash: string }
          }) => state.candidateHash,
          onDone: { target: targetOf(graph.states.Submitting.invoke.onDone) },
          onFailure: {
            target: targetOf(graph.states.Submitting.invoke.onFailure),
            data: ({
              state,
            }: {
              readonly state: { readonly candidateHash: string }
            }) => ({ candidateHash: state.candidateHash }),
          },
        },
      },
    },
  })

export const effectMachineDriver: ComposerDriver = {
  name: 'effect-machine',
  start: (deps) =>
    Effect.gen(function* () {
      const scope = yield* Scope.make()
      const ref = yield* Machine.start(makeMachine(deps.submit)).pipe(
        Effect.provideService(Scope.Scope, scope),
        Effect.orDie,
      )
      const listeners = new Set<() => void>()
      let current: ComposerSnapshot = emptyComposer
      const publish = (snapshot: unknown) => {
        current = toSnapshot(logicalOf(snapshot))
        for (const listener of listeners) listener()
      }
      Effect.runFork(
        Stream.runForEach(ref.changes, (snapshot) =>
          Effect.sync(() => {
            publish(snapshot)
          }),
        ).pipe(Effect.provideService(Scope.Scope, scope)),
      )
      publish(yield* ref.state)
      const session: ComposerSession = {
        snapshot: () => current,
        send: (event) => {
          Effect.runFork(ref.send(toEvent(event)).pipe(Effect.ignore))
        },
        subscribe: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      }
      return session
    }),
}
