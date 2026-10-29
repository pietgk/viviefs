import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Effect from 'effect/Effect'
import {
  globalSnapshot,
  runP01Checks,
  type CheckResult,
} from './p01-effect-checks.ts'
import { pendingP01, publishP01, type P01RuntimeState } from './p01-runtime.ts'
import { checkTestId, currentPlatform, postReport } from './probe-report.ts'

if (process.env.EXPO_PUBLIC_IMPORT_SQL === '1') {
  void import('./p01-sql-import.ts')
}

type ScreenState = {
  checks: CheckResult[]
  globals: Record<string, string>
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

export default function P01App() {
  const [state, setState] = useState<ScreenState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const variant =
    process.env.EXPO_PUBLIC_CRYPTO_POLYFILL === '0'
      ? 'no-polyfill'
      : 'polyfill'

  useEffect(() => {
    let cancelled = false
    publishP01(pendingP01(variant))
    void (async () => {
      try {
        const checks = await Effect.runPromise(runP01Checks())
        const globals = globalSnapshot()
        if (cancelled) return
        let report = 'Hermes results published; HTTP report unused'
        try {
          report = await postReport({
            gate: 'P01',
            platform: currentPlatform(),
            variant,
            checks,
            globals,
          })
        } catch (cause) {
          report = `HTTP report skipped: ${String(cause)}`
        }
        if (cancelled) return
        const published: P01RuntimeState = {
          gate: 'P01',
          platform: currentPlatform(),
          variant,
          host: 'dev-client',
          ready: true,
          error: null,
          report,
          checks,
          globals,
        }
        publishP01(published)
        setState({ checks, globals, report })
      } catch (cause) {
        if (cancelled) return
        const message = String(cause)
        publishP01({
          ...pendingP01(variant),
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
  }, [variant])

  const status = statusOf(error, state)

  return (
    <ScrollView
      testID="p01-root"
      accessibilityLabel="P01 platform probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p01-title" style={styles.title}>
        P01 platform probe
      </Text>
      <Text testID="p01-host" style={styles.meta}>
        {currentPlatform()} · {variant} · dev-client
      </Text>
      <Text
        testID="p01-status"
        accessibilityLabel={`P01 status ${status}`}
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
        <Text testID="p01-error" style={styles.fail}>
          {error}
        </Text>
      ) : null}
      {!state && !error ? (
        <Text testID="p01-running">Running Effect v4 checks…</Text>
      ) : null}
      {state
        ? state.checks.map((check) => (
            <View
              key={check.name}
              testID={checkTestId('p01', check.name)}
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
        <Text testID="p01-report" style={styles.meta}>
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
