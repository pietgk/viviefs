import type { CheckResult } from './p01-effect-checks.ts'
import { currentPlatform } from './probe-report.ts'

export type P01RuntimeState = {
  gate: 'P01'
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client'
  ready: boolean
  error: string | null
  report: string
  checks: CheckResult[]
  globals: Record<string, string>
}

const SLOT = '__viviefsP01'

export const publishP01 = (state: P01RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const pendingP01 = (variant: string): P01RuntimeState => ({
  gate: 'P01',
  platform: currentPlatform(),
  variant,
  host: 'dev-client',
  ready: false,
  error: null,
  report: 'running',
  checks: [],
  globals: {},
})
