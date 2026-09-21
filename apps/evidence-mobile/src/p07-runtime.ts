import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import { AppState } from 'react-native'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'
import {
  deviceLayer,
  executionId as executionEntity,
  HlcDevice,
  liveClock,
  LogStore,
  type EnvelopeType,
} from '@viviefs/datom'
import {
  Approval,
  DeviceResume,
  deviceResumeLayer,
  UploadWork,
} from '@viviefs/evidence-model'
import {
  expoWakeScheduler,
  lastNotificationData,
  requestNotificationPermission,
  scheduleDeferredNotification,
  subscribeNotificationResponses,
  type DeferredNotificationData,
} from '@viviefs/platform-native'
import { otlpJsonLayer } from '@viviefs/telemetry'
import { P07_PARKED_ATTR, type CheckResult } from '@viviefs/testing'
import {
  engineConfigLayer,
  engineLayer,
  EngineSweep,
  noopCrashHook,
} from '@viviefs/workflow-engine'
import { currentPlatform } from './probe-report.ts'

export const P07_SERVICE_NAME = 'viviefs-evidence-p07'
export const P07_ORG = 'p07'
const SLOT = '__viviefsP07'
const FILE_HASH = 'blob:p07'
const APPROVAL = 'approval'

export type P07Phase =
  | 'starting'
  | 'at-upload'
  | 'at-wait'
  | 'resumed'
  | 'completed'
  | 'abandoned'
  | 'failed'

export type P07RuntimeState = {
  gate: 'P07'
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client'
  ready: boolean
  error: string | null
  report: string
  checks: CheckResult[]
  extra: {
    phase: P07Phase
    token: string
    executionId: string
    sweep: boolean
    expectedChecks: number
  }
}

class ParkGate extends Context.Service<
  ParkGate,
  {
    readonly was: (exec: string) => Effect.Effect<boolean>
    readonly mark: (exec: string) => Effect.Effect<void>
  }
>()('viviefs/p07/ParkGate') {}

export const publishP07 = (state: P07RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const p07Token = (): string => process.env.EXPO_PUBLIC_P07_TOKEN ?? ''

export const p07Scenario = (): 'mid-upload' | 'mid-wait' | 'no-sweep' => {
  const value = process.env.EXPO_PUBLIC_P07_SCENARIO
  if (value === 'mid-wait' || value === 'no-sweep') return value
  return 'mid-upload'
}

export const p07SweepEnabled = (): boolean =>
  process.env.EXPO_PUBLIC_P07_SWEEP !== '0'

export const p07Variant = (): string =>
  process.env.EXPO_PUBLIC_P07_VARIANT ?? p07Scenario()

export const pendingP07 = (phase: P07Phase): P07RuntimeState => ({
  gate: 'P07',
  platform: currentPlatform(),
  variant: p07Variant(),
  host: 'dev-client',
  ready: phase !== 'starting' && phase !== 'failed',
  error: null,
  report: phase,
  checks: [],
  extra: {
    phase,
    token: p07Token(),
    executionId: '',
    sweep: p07SweepEnabled(),
    expectedChecks: 1,
  },
})

const envelope = (cs: string, device: string): EnvelopeType => ({
  cs,
  actor: 'p07',
  device,
  leaseEpoch: null,
  traceId: '00000000000000000000000000000000',
  spanId: '0000000000000000',
  sampled: false,
  command: 'p07.park',
})

const parkGateLayer = Layer.effect(
  ParkGate,
  Effect.gen(function* () {
    const store = yield* LogStore
    const device = yield* HlcDevice
    const entityOf = (exec: string) =>
      `${executionEntity(P07_ORG, exec)}/Pupload`
    return ParkGate.of({
      was: (exec) =>
        Effect.orDie(store.scanPrefix(entityOf(exec))).pipe(
          Effect.map((rows) => rows.some((row) => row.a === P07_PARKED_ATTR)),
        ),
      mark: (exec) =>
        Effect.gen(function* () {
          const tx = yield* store.mint()
          yield* store.append(
            [
              {
                e: entityOf(exec),
                a: P07_PARKED_ATTR,
                v: '1',
                tx,
                op: 'assert',
                cs: tx,
              },
            ],
            envelope(tx, device.id),
          )
        }).pipe(Effect.orDie),
    })
  }),
)

const uploadWorkLayer = (
  scenario: 'mid-upload' | 'mid-wait' | 'no-sweep',
  publish: (phase: P07Phase) => void,
) =>
  Layer.effect(
    UploadWork,
    Effect.gen(function* () {
      const parks = yield* ParkGate
      return UploadWork.of({
        perform: () =>
          Effect.gen(function* () {
            const instance = yield* WorkflowEngine.WorkflowInstance
            const exec = instance.executionId
            const parked = yield* parks.was(exec)
            if (
              !parked &&
              (scenario === 'mid-upload' || scenario === 'no-sweep')
            ) {
              yield* parks.mark(exec)
              yield* Effect.withSpan(Effect.void, 'p07.park', {
                attributes: {
                  'probe.token': p07Token(),
                  'probe.boundary': 'upload',
                  'probe.gate': 'P07',
                },
              })
              yield* Effect.sleep(Duration.millis(750))
              publish('at-upload')
              yield* Effect.sleep(Duration.minutes(2))
            }
            return FILE_HASH
          }),
      })
    }),
  )

const completeApproval = (executionId: string) => {
  const token = DurableDeferred.tokenFromExecutionId(Approval, {
    workflow: DeviceResume,
    executionId,
  })
  return DurableDeferred.succeed(Approval, { token, value: undefined })
}

export const runP07Session = (
  openStore: Layer.Layer<LogStore, any, any>,
): Effect.Effect<void> => {
  const scenario = p07Scenario()
  const sweepEnabled = p07SweepEnabled()
  const token = p07Token()
  const deviceId = `p07-${currentPlatform()}`
  const payload = { scenario, nonce: process.env.EXPO_PUBLIC_P07_RUN ?? 'run' }
  let latest = pendingP07('starting')
  const publish = (
    phase: P07Phase,
    patch: Partial<P07RuntimeState> = {},
  ) => {
    latest = {
      ...pendingP07(phase),
      ...patch,
      extra: {
        ...pendingP07(phase).extra,
        ...patch.extra,
        phase,
        token,
        sweep: sweepEnabled,
        executionId: patch.extra?.executionId ?? latest.extra.executionId,
      },
      ready:
        patch.ready ??
        (phase !== 'starting' && phase !== 'failed'),
    }
    publishP07(latest)
  }
  publish('starting')

  const parks = parkGateLayer.pipe(
    Layer.provide(openStore),
    Layer.provide(deviceLayer(deviceId)),
    Layer.provide(liveClock),
  )
  const upload = uploadWorkLayer(scenario, publish).pipe(Layer.provide(parks))
  const appLayer = deviceResumeLayer.pipe(
    Layer.provide(upload),
    Layer.provideMerge(engineLayer),
    Layer.provideMerge(openStore),
    Layer.provide(engineConfigLayer(P07_ORG)),
    Layer.provideMerge(deviceLayer(deviceId)),
    Layer.provide(noopCrashHook),
    Layer.provide(expoWakeScheduler),
    Layer.provideMerge(liveClock),
    Layer.provideMerge(
      otlpJsonLayer({
        baseUrl: process.env.EXPO_PUBLIC_OTLP_URL ?? 'http://127.0.0.1:27686',
        serviceName: P07_SERVICE_NAME,
      }),
    ),
  )

  return Effect.scoped(
    Effect.gen(function* () {
      yield* Effect.promise(() => requestNotificationPermission())
      const ctx = yield* Layer.build(appLayer)
      const use = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        effect.pipe(Effect.provide(ctx))

      const executionId = yield* use(DeviceResume.executionId(payload))
      publish('starting', {
        extra: { ...latest.extra, executionId, phase: 'starting' },
      })

      const applyNotification = (data: DeferredNotificationData) => {
        if (data.executionId !== executionId) return
        if (data.kind === 'deferred' && data.deferredName === APPROVAL) {
          void Effect.runPromise(
            use(completeApproval(executionId)).pipe(Effect.ignore),
          )
        }
      }
      Object.assign(globalThis, {
        __viviefsP07Complete: () => applyNotification({
          kind: 'deferred',
          workflowName: 'DeviceResume.v1',
          executionId,
          deferredName: APPROVAL,
        }),
      })
      const last = yield* Effect.promise(() => lastNotificationData())
      if (
        last &&
        last.executionId === executionId &&
        last.kind === 'deferred' &&
        last.deferredName === APPROVAL
      ) {
        yield* use(completeApproval(executionId)).pipe(Effect.ignore)
      }
      const unsubscribe = subscribeNotificationResponses(applyNotification)
      yield* Effect.addFinalizer(() => Effect.sync(unsubscribe))

      const sweepSvc = yield* use(EngineSweep)
      const pendingIds = yield* use(sweepSvc.pending())
      const hadPending = pendingIds.includes(executionId)

      if (hadPending && !sweepEnabled) {
        publish('abandoned', {
          ready: true,
          checks: [
            {
              name: 'without sweep does not resume',
              status: 'PASS',
              detail: executionId,
            },
          ],
        })
        return yield* Effect.never
      }

      if (hadPending && sweepEnabled) {
        yield* use(
          Effect.withSpan(sweepSvc.sweep(), 'p07.resume', {
            attributes: {
              'probe.token': token,
              'probe.gate': 'P07',
              'probe.boundary': scenario,
            },
          }),
        )
        publish('resumed', {
          extra: { ...latest.extra, executionId, phase: 'resumed' },
        })
      } else {
        yield* use(DeviceResume.execute(payload, { discard: true }))
      }

      const sub = AppState.addEventListener('change', (state) => {
        if (state !== 'active' || !sweepEnabled) return
        void Effect.runPromise(
          use(sweepSvc.sweep()).pipe(Effect.ignore),
        )
      })
      yield* Effect.addFinalizer(() => Effect.sync(() => sub.remove()))

      let announcedWait = false
      for (let attempt = 0; attempt < 6_000; attempt++) {
        const status = yield* use(DeviceResume.poll(executionId))
        if (Option.isSome(status) && status.value._tag === 'Complete') {
          const exit = status.value.exit
          const hash =
            Exit.isSuccess(exit) &&
            typeof exit.value === 'object' &&
            exit.value !== null &&
            'hash' in exit.value
              ? String((exit.value as { hash: string }).hash)
              : ''
          const name =
            scenario === 'mid-wait'
              ? 'notification completes deferred'
              : 'mid-upload resume'
          publish('completed', {
            ready: true,
            checks: [
              {
                name,
                status: hash.startsWith('blob:') ? 'PASS' : 'FAIL',
                detail: hash || String(exit._tag),
              },
            ],
          })
          return yield* Effect.never
        }
        if (
          Option.isSome(status) &&
          status.value._tag === 'Suspended' &&
          !announcedWait &&
          latest.extra.phase !== 'at-upload'
        ) {
          announcedWait = true
          if (scenario === 'mid-wait' && !hadPending) {
            yield* Effect.promise(() =>
              scheduleDeferredNotification({
                executionId,
                workflowName: 'DeviceResume.v1',
                deferredName: APPROVAL,
                seconds: 12,
              }),
            )
          }
          yield* Effect.withSpan(Effect.void, 'p07.park', {
            attributes: {
              'probe.token': token,
              'probe.boundary': 'wait',
              'probe.gate': 'P07',
            },
          })
          publish('at-wait', { ready: true })
        }
        yield* Effect.sleep(Duration.millis(100))
      }
      return yield* Effect.die('P07 session timed out')
    }),
  ).pipe(
    Effect.catchCause((cause) =>
      Effect.sync(() => {
        publish('failed', {
          ready: true,
          error: String(cause).split('\n').slice(0, 6).join(' | '),
          checks: [
            {
              name: 'session',
              status: 'FAIL',
              detail: String(cause).split('\n')[0] ?? 'failed',
            },
          ],
        })
      }),
    ),
  ) as Effect.Effect<void>
}
