import { Machine } from '@typeonce/effect-machine'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'
import type { CaptureDriver, CaptureSession } from './driver.ts'
import {
  idleInteraction,
  type CaptureEvent,
  type CaptureInteraction,
} from './interaction.ts'

const Root = Machine.state({
  states: {
    Idle: {},
    Capturing: {},
    Previewing: { fields: { previewHash: Schema.String } },
    Submitting: { fields: { previewHash: Schema.String } },
  },
})

const targets = Machine.targets(Root)

const Events = Machine.events({
  StartCapture: {},
  Preview: { hash: Schema.String },
  Retake: {},
  Cancel: {},
  Confirm: {},
})

const toEvent = (event: CaptureEvent) => {
  switch (event._tag) {
    case 'StartCapture':
      return Events.StartCapture()
    case 'Preview':
      return Events.Preview({ hash: event.hash })
    case 'Retake':
      return Events.Retake()
    case 'Cancel':
      return Events.Cancel()
    case 'Confirm':
      return Events.Confirm()
  }
}

const leafOf = (
  snapshot: unknown,
): { readonly path: string; readonly value: { readonly previewHash?: string } } => {
  let node = snapshot as {
    readonly path?: string
    readonly value?: { readonly previewHash?: string }
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

const toInteraction = (snapshot: unknown): CaptureInteraction => {
  const leaf = leafOf(snapshot)
  const path = leaf.path
  const hash = leaf.value.previewHash ?? null
  if (path.includes('Capturing')) return { phase: 'capturing', previewHash: null }
  if (path.includes('Previewing')) {
    return { phase: 'previewing', previewHash: hash }
  }
  if (path.includes('Submitting')) {
    return { phase: 'submitting', previewHash: hash }
  }
  return idleInteraction
}

const logicalOf = (snapshot: unknown): unknown => {
  if (snapshot && typeof snapshot === 'object' && 'state' in snapshot) {
    return (snapshot as { readonly state: unknown }).state
  }
  return snapshot
}

const makeMachine = (submit: (hash: string) => Effect.Effect<void, { readonly _tag: string }>) =>
  Machine.make({
    root: Root,
    events: Events,
    effects: {
      submit: (hash: string) => submit(hash),
    },
  }).handle({
    initial: { target: targets.root.Idle },
    states: {
      Idle: {
        on: { StartCapture: { target: targets.root.Capturing } },
      },
      Capturing: {
        on: {
          Preview: {
            target: targets.root.Previewing,
            data: ({ event }: { readonly event: { readonly hash: string } }) => ({
              previewHash: event.hash,
            }),
          },
          Cancel: { target: targets.root.Idle },
        },
      },
      Previewing: {
        on: {
          Retake: { target: targets.root.Capturing },
          Cancel: { target: targets.root.Idle },
          Confirm: {
            target: targets.root.Submitting,
            data: ({
              state,
            }: {
              readonly state: { readonly previewHash: string }
            }) => ({ previewHash: state.previewHash }),
          },
        },
      },
      Submitting: {
        invoke: {
          src: 'submit',
          input: ({
            state,
          }: {
            readonly state: { readonly previewHash: string }
          }) => state.previewHash,
          onDone: { target: targets.root.Idle },
          onFailure: {
            target: targets.root.Previewing,
            data: ({
              state,
            }: {
              readonly state: { readonly previewHash: string }
            }) => ({ previewHash: state.previewHash }),
          },
        },
      },
    },
  })

export const effectMachineDriver: CaptureDriver = {
  name: 'effect-machine',
  start: (deps) =>
    Effect.gen(function* () {
      const scope = yield* Scope.make()
      const ref = yield* Machine.start(makeMachine(deps.submit)).pipe(
        Effect.provideService(Scope.Scope, scope),
        Effect.orDie,
      )
      const listeners = new Set<() => void>()
      let current: CaptureInteraction = idleInteraction
      const publish = (snapshot: unknown) => {
        current = toInteraction(logicalOf(snapshot))
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
      const session: CaptureSession = {
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
