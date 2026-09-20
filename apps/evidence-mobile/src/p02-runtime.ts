import * as Effect from 'effect/Effect'
import { expoSqliteLayer } from './p02-expo-sqlite.ts'
import { officialSqliteLayer } from './p02-official'
import { P02_CHECK_COUNT, runSqlDriverChecks } from './p02-sql-checks.ts'
import { currentPlatform } from './probe-report.ts'

export type P02RuntimeState = {
  gate: 'P02'
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client' | 'web'
  ready: boolean
  error: string | null
  report: string
  checks: Array<{ name: string; status: 'PASS' | 'FAIL'; detail: string }>
  extra: {
    driver: string
    expectedChecks: number
  }
}

const SLOT = '__viviefsP02'

export const publishP02 = (state: P02RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const pendingP02 = (variant: string): P02RuntimeState => ({
  gate: 'P02',
  platform: currentPlatform(),
  variant,
  host: currentPlatform() === 'web' ? 'web' : 'dev-client',
  ready: false,
  error: null,
  report: 'running',
  checks: [],
  extra: {
    driver: variant,
    expectedChecks: P02_CHECK_COUNT,
  },
})

const layerFor = (variant: string) => {
  const filename = `viviefs-p02-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`
  return variant === 'fallback'
    ? expoSqliteLayer(filename)
    : officialSqliteLayer(filename)
}

export const runP02Checks = (variant: string) =>
  runSqlDriverChecks().pipe(
    Effect.provide(layerFor(variant)),
    Effect.scoped,
    Effect.timeout('45 seconds'),
  )
