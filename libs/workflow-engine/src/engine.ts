import * as Cause from 'effect/Cause'
import * as Clock from 'effect/Clock'
import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Fiber from 'effect/Fiber'
import * as FiberMap from 'effect/FiberMap'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import type * as Scope from 'effect/Scope'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'
import {
  activityId,
  Attr,
  clockId,
  deferredId,
  executionId as executionEntity,
  HlcDevice,
  LogStore,
  type EnvelopeType,
  type StoredDatomType,
} from '@viviefs/datom'
import { CrashHook } from './crash-hook.ts'
import { EngineConfig } from './config.ts'
import {
  completeFromExit,
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
  type ClockValue,
  type LeaseValue,
} from './journal.ts'

export class StaleLease extends Schema.TaggedError<StaleLease>()('StaleLease', {
  executionId: Schema.String,
  device: Schema.String,
  holder: Schema.String,
  epoch: Schema.Number,
}) {}

export class Leases extends Context.Service<
  Leases,
  {
    readonly holder: (
      executionId: string,
    ) => Effect.Effect<LeaseValue | null>
    readonly handoff: (
      executionId: string,
      device: string,
    ) => Effect.Effect<LeaseValue>
  }
>()('viviefs/workflow-engine/Leases') {}

const envelope = (
  cs: string,
  device: string,
  leaseEpoch: number | null,
): EnvelopeType => ({
  cs,
  actor: 'engine',
  device,
  leaseEpoch,
  traceId: '00000000000000000000000000000000',
  spanId: '0000000000000000',
  sampled: false,
  command: 'workflow.engine',
})

const latest = (
  rows: ReadonlyArray<StoredDatomType>,
  attribute: string,
): StoredDatomType | undefined => {
  let found: StoredDatomType | undefined
  for (const row of rows) {
    if (row.a !== attribute) continue
    if (!found || row.seq > found.seq) found = row
  }
  return found
}

const sleepUntil = (wakeAtMs: number) =>
  Clock.currentTimeMillis.pipe(
    Effect.flatMap((now) => {
      const remaining = wakeAtMs - now
      return remaining <= 0
        ? Effect.void
        : Effect.sleep(Duration.millis(remaining))
    }),
  )

export const engineLayer: Layer.Layer<
  WorkflowEngine.WorkflowEngine | Leases,
  never,
  LogStore | HlcDevice | EngineConfig | CrashHook
> = Layer.effect(
  WorkflowEngine.WorkflowEngine,
  Effect.gen(function* () {
    const store = yield* LogStore
    const device = yield* HlcDevice
    const config = yield* EngineConfig
    const hook = yield* CrashHook
    const scope = yield* Effect.scope
    const clocks = yield* FiberMap.make<string>()
    const deferredState = WorkflowEngine.makeDeferredState()

    const workflows = new Map<
      string,
      {
        readonly workflow: Workflow.Any
        readonly execute: (
          payload: object,
          executionId: string,
        ) => Effect.Effect<
          unknown,
          unknown,
          WorkflowEngine.WorkflowInstance | WorkflowEngine.WorkflowEngine
        >
        readonly scope: Scope.Scope
      }
    >()

    type RunState = {
      instance: WorkflowEngine.WorkflowInstance['Service']
      interrupted: boolean
      resumeRequested: boolean
      fiber: Fiber.Fiber<Workflow.Result<unknown, unknown>> | undefined
    }
    const runs = new Map<string, RunState>()

    const rowsOf = (exec: string) =>
      Effect.orDie(store.scanPrefix(executionEntity(config.org, exec)))

    const holderOf = (exec: string) =>
      rowsOf(exec).pipe(
        Effect.map((rows) => {
          let best: LeaseValue | null = null
          for (const row of rows) {
            if (row.a !== Attr.leaseHolder) continue
            const parsed = decodeLease(row.v)
            if (!parsed) continue
            if (!best || parsed.epoch > best.epoch) best = parsed
          }
          return best
        }),
      )

    const appendFact = (
      exec: string,
      entity: string,
      attribute: string,
      value: string,
    ) =>
      Effect.gen(function* () {
        const holder = yield* holderOf(exec)
        if (holder && holder.device !== device.id) {
          return yield* Effect.die(
            new StaleLease({
              executionId: exec,
              device: device.id,
              holder: holder.device,
              epoch: holder.epoch,
            }),
          )
        }
        const tx = yield* store.mint()
        yield* store.append(
          [
            {
              e: entity,
              a: attribute,
              v: value,
              tx,
              op: 'assert',
              cs: tx,
            },
          ],
          envelope(tx, device.id, holder?.epoch ?? null),
        )
      }).pipe(Effect.orDie)

    const grantIfNeeded = (exec: string) =>
      Effect.gen(function* () {
        const holder = yield* holderOf(exec)
        if (holder) return holder
        const next: LeaseValue = {
          device: device.id,
          epoch: 1,
          expiresAtMs: null,
        }
        yield* appendFact(
          exec,
          executionEntity(config.org, exec),
          Attr.leaseHolder,
          encodeLease(next),
        )
        return next
      })

    const storedResult = (exec: string) =>
      rowsOf(exec).pipe(
        Effect.map((rows) => {
          const row = latest(rows, Attr.workflowResult)
          if (!row) return null
          return decodeExit(row.v)
        }),
      )

    const storedStarted = (exec: string) =>
      rowsOf(exec).pipe(
        Effect.map((rows) => {
          const row = latest(rows, Attr.workflowStarted)
          if (!row) return null
          return decodeStarted(row.v)
        }),
      )

    const persistResult = (
      exec: string,
      result: Workflow.Result<unknown, unknown>,
    ) => {
      if (result._tag !== 'Complete') return Effect.void
      return storedResult(exec).pipe(
        Effect.flatMap((existing) =>
          existing
            ? Effect.void
            : appendFact(
                exec,
                executionEntity(config.org, exec),
                Attr.workflowResult,
                encodeExit(result.exit),
              ),
        ),
      )
    }

    const completeDeferred = (options: {
      readonly workflowName: string
      readonly executionId: string
      readonly deferredName: string
      readonly exit: Exit.Exit<unknown, unknown>
    }): Effect.Effect<void> =>
      Effect.gen(function* () {
        const entity = deferredId(
          config.org,
          options.executionId,
          options.deferredName,
        )
        const rows = yield* rowsOf(options.executionId)
        const exists = rows.some(
          (row) => row.e === entity && row.a === Attr.deferredExit,
        )
        if (!exists) {
          yield* appendFact(
            options.executionId,
            entity,
            Attr.deferredExit,
            encodeExit(options.exit),
          )
        }
        const wake = deferredState
          .deferredDone(options.executionId, options.deferredName)
          .pipe(Effect.andThen(resume(options.executionId)), Effect.orDie)
        const instance = yield* Effect.serviceOption(
          WorkflowEngine.WorkflowInstance,
        )
        if (
          Option.isSome(instance) &&
          instance.value.executionId === options.executionId
        ) {
          yield* wake.pipe(Effect.forkIn(scope), Effect.asVoid)
          return
        }
        yield* wake
      })

    const fireClock = (
      workflow: Workflow.Any,
      exec: string,
      clock: ClockValue,
    ): Effect.Effect<void> =>
      FiberMap.run(
        clocks,
        `${exec}/${clock.name}`,
        sleepUntil(clock.wakeAtMs).pipe(
          Effect.andThen(
            completeDeferred({
              workflowName: workflow._tag,
              executionId: exec,
              deferredName: clock.deferredName,
              exit: Exit.void,
            }),
          ),
        ),
        { onlyIfMissing: true },
      ).pipe(Effect.asVoid)

    const sweepClocks: Effect.Effect<void> = Effect.gen(function* () {
      const rows = yield* Effect.orDie(
        store.scanPrefix(`${executionEntity(config.org, '')}`),
      )
      const byExec = new Map<string, StoredDatomType[]>()
      for (const row of rows) {
        const match = row.e.match(/^O[^/]+\/W([^/]+)/)
        if (!match?.[1]) continue
        const exec = match[1]
        const list = byExec.get(exec) ?? []
        list.push(row)
        byExec.set(exec, list)
      }
      for (const [exec, list] of byExec) {
        const workflowName = decodeStarted(
          latest(list, Attr.workflowStarted)?.v ?? '',
        )?.name
        if (!workflowName) continue
        const workflow = workflows.get(workflowName)?.workflow
        if (!workflow) continue
        for (const row of list) {
          if (row.a !== Attr.clockWakeAt) continue
          const clock = decodeClock(row.v)
          if (!clock) continue
          const done = list.some(
            (candidate) =>
              candidate.a === Attr.deferredExit &&
              candidate.e === deferredId(config.org, exec, clock.deferredName),
          )
          if (done) continue
          yield* fireClock(workflow, exec, clock)
        }
      }
    })

    const resume = Effect.fnUntraced(function* (
      exec: string,
    ): Effect.fn.Return<void> {
      const existing = yield* storedResult(exec)
      if (existing) return
      const started = yield* storedStarted(exec)
      if (!started) return
      const entry = workflows.get(started.name)
      if (!entry) {
        return yield* Effect.die(`Workflow ${started.name} is not registered`)
      }
      let state = runs.get(exec)
      const fiberExit = state?.fiber?.pollUnsafe()
      if (fiberExit && fiberExit._tag === 'Success' && fiberExit.value._tag === 'Complete') {
        return
      }
      if (state?.fiber && !fiberExit) {
        if (!state.resumeRequested) {
          state.resumeRequested = true
          const running = state
          const fiber = state.fiber
          yield* Fiber.await(fiber).pipe(
            Effect.flatMap(() => {
              running.resumeRequested = false
              return resume(exec)
            }),
            Effect.forkIn(scope),
          )
        }
        return
      }
      const instance = WorkflowEngine.WorkflowInstance.initial(
        entry.workflow,
        exec,
        state?.instance.scope,
      )
      if (state?.interrupted) instance.interrupted = true
      state = {
        instance,
        interrupted: state?.interrupted ?? false,
        resumeRequested: false,
        fiber: undefined,
      }
      runs.set(exec, state)
      state.fiber = yield* entry
        .execute(started.payload as object, exec)
        .pipe(
          Workflow.intoResult,
          Effect.provideService(WorkflowEngine.WorkflowEngine, engine),
          (effect) => deferredState.trackRun(instance, effect),
          Effect.tap((result) => persistResult(exec, result)),
          Effect.orDie,
          Effect.forkIn(entry.scope),
        )
      yield* sweepClocks
    })

    const die = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.orDie(effect)

    const engine = WorkflowEngine.makeUnsafe({
      register: Effect.fnUntraced(function* (workflow, execute) {
        workflows.set(workflow._tag, {
          workflow,
          execute,
          scope: yield* Effect.scope,
        })
      }),
      execute: Effect.fnUntraced(function* (workflow, options) {
        const entry = workflows.get(workflow._tag)
        if (!entry) {
          return yield* Effect.die(`Workflow ${workflow._tag} is not registered`)
        }
        const exec = options.executionId
        const result = yield* storedResult(exec)
        if (result) {
          return completeFromExit(result) as never
        }
        const started = yield* storedStarted(exec)
        if (!started) {
          yield* grantIfNeeded(exec)
          yield* appendFact(
            exec,
            executionEntity(config.org, exec),
            Attr.workflowStarted,
            encodeStarted({
              name: workflow._tag,
              payload: options.payload,
            }),
          )
        }
        yield* resume(exec)
        if (options.discard) return undefined as never
        const state = runs.get(exec)
        if (!state?.fiber) {
          const again = yield* storedResult(exec)
          if (again) return completeFromExit(again) as never
          return new Workflow.Suspended({}) as never
        }
        const instance = state.instance
        const exit = yield* Fiber.await(state.fiber)
        if (
          Exit.isFailure(exit) &&
          Cause.hasInterruptsOnly(exit.cause) &&
          instance.suspended
        ) {
          return new Workflow.Suspended({}) as never
        }
        return (yield* exit) as never
      }, die),
      poll: (_workflow: Workflow.Any, exec: string) =>
        die(
          Effect.gen(function* () {
            const result = yield* storedResult(exec)
            if (result) return Option.some(completeFromExit(result))
            const state = runs.get(exec)
            const fiberExit = state?.fiber?.pollUnsafe()
            if (fiberExit) {
              return fiberExit._tag === 'Success'
                ? Option.some(fiberExit.value)
                : yield* Effect.die(fiberExit.cause)
            }
            if (state?.fiber) return Option.none()
            const started = yield* storedStarted(exec)
            if (started) return Option.some(new Workflow.Suspended({}))
            return Option.none()
          }),
        ),
      interrupt: Effect.fnUntraced(function* (_workflow: Workflow.Any, exec: string) {
        const state = runs.get(exec)
        if (state) state.interrupted = true
        yield* resume(exec)
      }, die),
      interruptUnsafe: Effect.fnUntraced(function* (_workflow: Workflow.Any, exec: string) {
        const state = runs.get(exec)
        if (!state) return
        state.interrupted = true
        if (state.fiber) yield* Fiber.interrupt(state.fiber)
      }),
      resume: (_workflow: Workflow.Any, exec: string) => die(resume(exec)),
      activityExecute: Effect.fnUntraced(function* (activity, attempt) {
        const instance = yield* WorkflowEngine.WorkflowInstance
        yield* hook.at('before-activity')
        const entity = activityId(
          config.org,
          instance.executionId,
          activity.name,
          attempt,
        )
        const rows = yield* rowsOf(instance.executionId)
        const stored = rows.find(
          (row) => row.e === entity && row.a === Attr.activityExit,
        )
        if (stored) {
          const exit = decodeExit(stored.v)
          if (exit) return completeFromExit(exit)
        }
        yield* hook.at(
          activity.name === 'upload' ? 'during-upload' : 'during-activity',
        )
        const activityInstance = WorkflowEngine.WorkflowInstance.initial(
          instance.workflow,
          instance.executionId,
        )
        activityInstance.interrupted = instance.interrupted
        const result = yield* activity.executeEncoded.pipe(
          Workflow.intoResult,
          Effect.provideService(
            WorkflowEngine.WorkflowInstance,
            activityInstance,
          ),
        )
        if (result._tag === 'Suspended') return result
        yield* hook.at('after-activity-before-journal')
        yield* appendFact(
          instance.executionId,
          entity,
          Attr.activityExit,
          encodeExit(result.exit),
        )
        return result
      }, die),
      deferredResult: Effect.fnUntraced(function* (deferred) {
        const instance = yield* WorkflowEngine.WorkflowInstance
        const entity = deferredId(
          config.org,
          instance.executionId,
          deferred.name,
        )
        const rows = yield* rowsOf(instance.executionId)
        const stored = rows.find(
          (row) => row.e === entity && row.a === Attr.deferredExit,
        )
        if (!stored) {
          yield* hook.at('during-deferred')
          return Option.none()
        }
        const exit = decodeExit(stored.v)
        return exit ? Option.some(exit) : Option.none()
      }, die),
      deferredDone: (options: {
        readonly workflowName: string
        readonly executionId: string
        readonly deferredName: string
        readonly exit: Exit.Exit<unknown, unknown>
      }) => die(completeDeferred(options)),
      scheduleClock: (
        workflow: Workflow.Any,
        options: {
          readonly executionId: string
          readonly clock: { readonly name: string; readonly duration: Duration.Duration; readonly deferred: { readonly name: string } }
        },
      ) =>
        die(
          Effect.gen(function* () {
          const exec = options.executionId
          const entity = clockId(config.org, exec, options.clock.name)
          const rows = yield* rowsOf(exec)
          const existing = rows.find(
            (row) => row.e === entity && row.a === Attr.clockWakeAt,
          )
          const now = yield* Clock.currentTimeMillis
          const clock: ClockValue = existing
            ? (decodeClock(existing.v) ?? {
                workflowName: workflow._tag,
                name: options.clock.name,
                deferredName: options.clock.deferred.name,
                wakeAtMs:
                  now + Duration.toMillis(options.clock.duration),
              })
            : {
                workflowName: workflow._tag,
                name: options.clock.name,
                deferredName: options.clock.deferred.name,
                wakeAtMs: now + Duration.toMillis(options.clock.duration),
              }
          if (!existing) {
            yield* appendFact(
              exec,
              entity,
              Attr.clockWakeAt,
              encodeClock(clock),
            )
          }
          yield* hook.at('during-clock')
          yield* fireClock(workflow, exec, clock)
        }),
        ),
    } as unknown as WorkflowEngine.Encoded)

    return engine
  }),
).pipe(
  Layer.merge(
    Layer.effect(
      Leases,
      Effect.gen(function* () {
        const store = yield* LogStore
        const device = yield* HlcDevice
        const config = yield* EngineConfig
        const hook = yield* CrashHook
        const holderOf = (exec: string) =>
          store.scanPrefix(executionEntity(config.org, exec)).pipe(
            Effect.map((rows) => {
              let best: LeaseValue | null = null
              for (const row of rows) {
                if (row.a !== Attr.leaseHolder) continue
                const parsed = decodeLease(row.v)
                if (!parsed) continue
                if (!best || parsed.epoch > best.epoch) best = parsed
              }
              return best
            }),
          )
        return Leases.of({
          holder: (exec) => Effect.orDie(holderOf(exec)),
          handoff: (exec, toDevice) =>
            Effect.orDie(
              Effect.gen(function* () {
              yield* hook.at('during-lease-handoff')
              const holder = yield* holderOf(exec)
              const next: LeaseValue = {
                device: toDevice,
                epoch: (holder?.epoch ?? 0) + 1,
                expiresAtMs: null,
              }
              const tx = yield* store.mint()
              yield* store.append(
                [
                  {
                    e: executionEntity(config.org, exec),
                    a: Attr.leaseHolder,
                    v: encodeLease(next),
                    tx,
                    op: 'assert',
                    cs: tx,
                  },
                ],
                envelope(tx, device.id, holder?.epoch ?? null),
              )
              return next
            }),
            ),
        })
      }),
    ),
  ),
)
