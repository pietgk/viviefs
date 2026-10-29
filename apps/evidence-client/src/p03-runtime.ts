import * as Effect from 'effect/Effect'
import { otlpJsonLayer } from '@viviefs/telemetry'
import { currentPlatform } from './probe-report.ts'

export const P03_SERVICE_NAME = 'viviefs-evidence-p03'
export const P03_SPAN_NAME = 'p03.known-span'
export const P03_CHECK_NAMES = ['bigint', 'emit span'] as const
export const P03_CHECK_COUNT = P03_CHECK_NAMES.length

export type P03RuntimeState = {
  gate: 'P03'
  platform: 'ios' | 'android' | 'web'
  variant: string
  host: 'dev-client' | 'web'
  ready: boolean
  error: string | null
  report: string
  checks: Array<{ name: string; status: 'PASS' | 'FAIL'; detail: string }>
  extra: {
    token: string
    otlpUrl: string
    expectedChecks: number
  }
}

const SLOT = '__viviefsP03'

export const publishP03 = (state: P03RuntimeState): void => {
  Object.assign(globalThis, { [SLOT]: state })
}

export const p03Token = (): string => process.env.EXPO_PUBLIC_P03_TOKEN ?? ''

export const p03Variant = (): string =>
  process.env.EXPO_PUBLIC_OTLP_VARIANT === 'wrong-endpoint'
    ? 'wrong-endpoint'
    : 'motel'

export const p03OtlpUrl = (): string =>
  process.env.EXPO_PUBLIC_OTLP_URL ?? 'http://127.0.0.1:27686'

export const pendingP03 = (variant: string): P03RuntimeState => ({
  gate: 'P03',
  platform: currentPlatform(),
  variant,
  host: currentPlatform() === 'web' ? 'web' : 'dev-client',
  ready: false,
  error: null,
  report: 'running',
  checks: [],
  extra: {
    token: p03Token(),
    otlpUrl: p03OtlpUrl(),
    expectedChecks: P03_CHECK_COUNT,
  },
})

const bigintCheck = () => {
  const ctor = globalThis.BigInt
  if (typeof ctor !== 'function') {
    return {
      name: 'bigint',
      status: 'FAIL' as const,
      detail: 'BigInt is not a function',
    }
  }
  try {
    const sample = ctor(String(Date.now()))
    return {
      name: 'bigint',
      status: typeof sample === 'bigint' ? ('PASS' as const) : ('FAIL' as const),
      detail: typeof sample,
    }
  } catch (cause) {
    return {
      name: 'bigint',
      status: 'FAIL' as const,
      detail: String(cause),
    }
  }
}

export const emitKnownSpan = (options: {
  token: string
  variant: string
  baseUrl: string
}) =>
  Effect.withSpan(Effect.sleep('80 millis'), P03_SPAN_NAME, {
    attributes: {
      'probe.gate': 'P03',
      'probe.token': options.token,
      'probe.variant': options.variant,
    },
  }).pipe(
    Effect.as({
      name: 'emit span',
      status: 'PASS' as const,
      detail: `${options.token} -> ${options.baseUrl}`,
    }),
    Effect.provide(
      otlpJsonLayer({
        baseUrl: options.baseUrl,
        serviceName: P03_SERVICE_NAME,
      }),
    ),
    Effect.scoped,
    Effect.timeout('20 seconds'),
    Effect.matchCause({
      onSuccess: () => ({
        name: 'emit span',
        status: 'PASS' as const,
        detail: `${options.token} -> ${options.baseUrl}`,
      }),
      onFailure: (cause) => ({
        name: 'emit span',
        status: 'FAIL' as const,
        detail: String(cause).split('\n').slice(0, 4).join(' | '),
      }),
    }),
  )

export const runP03Checks = () => {
  const token = p03Token()
  const variant = p03Variant()
  const baseUrl = p03OtlpUrl()
  const first = bigintCheck()
  if (!token) {
    return Effect.succeed([
      first,
      {
        name: 'emit span',
        status: 'FAIL' as const,
        detail: 'EXPO_PUBLIC_P03_TOKEN missing',
      },
    ])
  }
  return emitKnownSpan({ token, variant, baseUrl }).pipe(
    Effect.map((emitted) => [first, emitted]),
  )
}
