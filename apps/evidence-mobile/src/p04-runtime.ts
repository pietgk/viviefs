import * as Effect from 'effect/Effect'
import {
  makeMutableClock,
  P04_CHECK_COUNT,
  runLogStoreChecks,
  type CheckResult,
} from '@viviefs/testing'
import { currentPlatform } from './probe-report.ts'

export type P04RuntimeState = {
  gate: 'P04'
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client' | 'web'
  ready: boolean
  error: string | null
  report: string
  checks: CheckResult[]
  extra: {
    expectedChecks: number
  }
}

const SLOT = '__viviefsP04'

export const publishP04 = (state: P04RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const pendingP04 = (variant: string): P04RuntimeState => ({
  gate: 'P04',
  platform: currentPlatform(),
  variant,
  host: currentPlatform() === 'web' ? 'web' : 'dev-client',
  ready: false,
  error: null,
  report: 'running',
  checks: [],
  extra: {
    expectedChecks: P04_CHECK_COUNT,
  },
})

export const runP04Checks = (deviceId: string) =>
  Effect.gen(function* () {
    const { p04LogStore } = yield* Effect.promise(() => import('./p04-official'))
    const clock = makeMutableClock(1_700_000_000_000)
    return yield* runLogStoreChecks(p04LogStore(deviceId), clock)
  }).pipe(Effect.timeout('180 seconds'))
