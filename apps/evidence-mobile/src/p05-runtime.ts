import * as Effect from 'effect/Effect'
import {
  makeMutableClock,
  P05_CHECK_COUNT,
  runChangesetChecks,
  type CheckResult,
} from '@viviefs/testing'
import { currentPlatform } from './probe-report.ts'

export type P05RuntimeState = {
  gate: 'P05'
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

const SLOT = '__viviefsP05'

export const publishP05 = (state: P05RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const pendingP05 = (variant: string): P05RuntimeState => ({
  gate: 'P05',
  platform: currentPlatform(),
  variant,
  host: currentPlatform() === 'web' ? 'web' : 'dev-client',
  ready: false,
  error: null,
  report: 'running',
  checks: [],
  extra: {
    expectedChecks: P05_CHECK_COUNT,
  },
})

export const runP05Checks = (deviceId: string) =>
  Effect.gen(function* () {
    const { p05LogStore } = yield* Effect.promise(() => import('./p05-official'))
    const clock = makeMutableClock(1_700_000_000_000)
    return yield* runChangesetChecks(p05LogStore(deviceId), clock)
  }).pipe(Effect.timeout('180 seconds'))
