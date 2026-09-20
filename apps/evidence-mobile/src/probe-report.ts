import { Platform } from 'react-native'
import type { CheckResult } from './p01-effect-checks.ts'

export type ProbeReport = {
  gate: string
  platform: 'ios' | 'android' | 'web'
  variant: string
  checks: CheckResult[]
  globals: Record<string, string>
}

const hostPlatform = (): ProbeReport['platform'] => {
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'android') return 'android'
  return 'web'
}

export const reportUrl = (): string | undefined => {
  const configured = process.env.EXPO_PUBLIC_PROBE_URL
  if (configured) return configured
  const port = process.env.EXPO_PUBLIC_PROBE_PORT
  if (!port) return undefined
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1'
  return `http://${host}:${port}/report`
}

export const postReport = async (report: ProbeReport): Promise<string> => {
  const url = reportUrl()
  if (!url) return 'no probe URL; results stay on screen'
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (!response.ok) {
    throw new Error(`probe report failed: ${response.status}`)
  }
  return `reported ${report.checks.length} checks to ${url}`
}

export const currentPlatform = hostPlatform
