import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Effect from 'effect/Effect'
import { checkTestId } from './probe-report.ts'
import { currentPlatform, postReport } from './probe-report.ts'
import type { CheckResult } from '@viviefs/testing'
import { pendingP05, publishP05, runP05Checks } from './p05-runtime.ts'

type ScreenState = {
  checks: CheckResult[]
  report: string
}

const statusOf = (
  error: string | null,
  state: ScreenState | null,
): 'running' | 'pass' | 'fail' => {
  if (error) return 'fail'
  if (!state) return 'running'
  return state.checks.every((check) => check.status === 'PASS') ? 'pass' : 'fail'
}

export default function P05App() {
  const [state, setState] = useState<ScreenState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const variant = process.env.EXPO_PUBLIC_P05_VARIANT ?? 'native'
  const deviceId = `p05-${currentPlatform()}`

  useEffect(() => {
    let cancelled = false
    publishP05(pendingP05(variant))
    void (async () => {
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, 2500))
        if (cancelled) return
        const checks = await Effect.runPromise(runP05Checks(deviceId))
        if (cancelled) return
        let report = 'Hermes results published'
        try {
          report = await postReport({
            gate: 'P05',
            platform: currentPlatform(),
            variant,
            checks,
            globals: { deviceId },
          })
        } catch (cause) {
          report = `HTTP report skipped: ${String(cause)}`
        }
        if (cancelled) return
        publishP05({
          ...pendingP05(variant),
          ready: true,
          error: null,
          report,
          checks,
        })
        setState({ checks, report })
      } catch (cause) {
        if (cancelled) return
        const message = String(cause)
        publishP05({
          ...pendingP05(variant),
          ready: true,
          error: message,
          report: message,
        })
        setError(message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [deviceId, variant])

  const status = statusOf(error, state)

  return (
    <ScrollView
      testID="p05-root"
      accessibilityLabel="P05 changeset probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p05-title" style={styles.title}>
        P05 changeset probe
      </Text>
      <Text testID="p05-host" style={styles.meta}>
        {currentPlatform()} · {variant}
      </Text>
      <Text
        testID="p05-status"
        accessibilityLabel={`P05 status ${status}`}
        style={
          status === 'pass'
            ? styles.pass
            : status === 'fail'
              ? styles.fail
              : styles.meta
        }
      >
        {status}
      </Text>
      {error ? (
        <Text testID="p05-error" style={styles.fail}>
          {error}
        </Text>
      ) : null}
      {state
        ? state.checks.map((check) => (
            <View
              key={check.name}
              testID={checkTestId('p05', check.name)}
              accessibilityLabel={`${check.name} ${check.status}`}
              style={styles.row}
            >
              <Text
                style={check.status === 'PASS' ? styles.pass : styles.fail}
              >
                {check.status}
              </Text>
              <Text style={styles.name}>{check.name}</Text>
              <Text style={styles.detail}>{check.detail}</Text>
            </View>
          ))
        : null}
      {state ? (
        <Text testID="p05-report" style={styles.meta}>
          {state.report}
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#fff',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  meta: {
    color: '#444',
    marginBottom: 8,
  },
  row: {
    gap: 2,
    marginBottom: 8,
  },
  name: {
    fontWeight: '500',
  },
  detail: {
    color: '#333',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  pass: {
    color: '#0a7',
    fontWeight: '700',
  },
  fail: {
    color: '#c30',
    fontWeight: '700',
  },
})
