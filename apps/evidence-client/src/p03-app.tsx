import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Effect from 'effect/Effect'
import { checkTestId } from './probe-report.ts'
import { currentPlatform, postReport } from './probe-report.ts'
import {
  p03OtlpUrl,
  p03Token,
  p03Variant,
  pendingP03,
  publishP03,
  runP03Checks,
} from './p03-runtime.ts'

type CheckResult = {
  name: string
  status: 'PASS' | 'FAIL'
  detail: string
}

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

export default function P03App() {
  const [state, setState] = useState<ScreenState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const variant = p03Variant()
  const token = p03Token()

  useEffect(() => {
    let cancelled = false
    publishP03(pendingP03(variant))
    void (async () => {
      try {
        const checks = await Effect.runPromise(runP03Checks())
        if (cancelled) return
        let report = 'Hermes results published'
        try {
          report = await postReport({
            gate: 'P03',
            platform: currentPlatform(),
            variant,
            checks,
            globals: {
              driver: variant,
              token,
              otlpUrl: p03OtlpUrl(),
            },
          })
        } catch (cause) {
          report = `HTTP report skipped: ${String(cause)}`
        }
        if (cancelled) return
        publishP03({
          ...pendingP03(variant),
          ready: true,
          error: null,
          report,
          checks,
        })
        setState({ checks, report })
      } catch (cause) {
        if (cancelled) return
        const message = String(cause)
        publishP03({
          ...pendingP03(variant),
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
  }, [token, variant])

  const status = statusOf(error, state)

  return (
    <ScrollView
      testID="p03-root"
      accessibilityLabel="P03 OTLP motel probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p03-title" style={styles.title}>
        P03 OTLP motel probe
      </Text>
      <Text testID="p03-host" style={styles.meta}>
        {currentPlatform()} · {variant}
      </Text>
      <Text
        testID="p03-status"
        accessibilityLabel={`P03 status ${status}`}
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
        <Text testID="p03-error" style={styles.fail}>
          {error}
        </Text>
      ) : null}
      {state
        ? state.checks.map((check) => (
            <View
              key={check.name}
              testID={checkTestId('p03', check.name)}
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
        <Text testID="p03-report" style={styles.meta}>
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
