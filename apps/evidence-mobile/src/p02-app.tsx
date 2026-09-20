import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Effect from 'effect/Effect'
import { checkTestId } from './probe-report.ts'
import { currentPlatform, postReport } from './probe-report.ts'
import type { CheckResult } from './p02-sql-checks.ts'
import { pendingP02, publishP02 } from './p02-runtime.ts'
import { runP02Checks } from './p02-runtime.ts'

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

export default function P02App() {
  const [state, setState] = useState<ScreenState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const variant =
    process.env.EXPO_PUBLIC_SQL_DRIVER === 'fallback' ? 'fallback' : 'official'

  useEffect(() => {
    let cancelled = false
    publishP02(pendingP02(variant))
    void (async () => {
      try {
        const checks = await Effect.runPromise(runP02Checks(variant))
        if (cancelled) return
        let report = 'Hermes results published'
        try {
          report = await postReport({
            gate: 'P02',
            platform: currentPlatform(),
            variant,
            checks,
            globals: { driver: variant },
          })
        } catch (cause) {
          report = `HTTP report skipped: ${String(cause)}`
        }
        if (cancelled) return
        publishP02({
          ...pendingP02(variant),
          ready: true,
          error: null,
          report,
          checks,
        })
        setState({ checks, report })
      } catch (cause) {
        if (cancelled) return
        const message = String(cause)
        publishP02({
          ...pendingP02(variant),
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
      testID="p02-root"
      accessibilityLabel="P02 SQLite driver probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p02-title" style={styles.title}>
        P02 SQLite driver probe
      </Text>
      <Text testID="p02-host" style={styles.meta}>
        {currentPlatform()} · {variant}
      </Text>
      <Text
        testID="p02-status"
        accessibilityLabel={`P02 status ${status}`}
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
        <Text testID="p02-error" style={styles.fail}>
          {error}
        </Text>
      ) : null}
      {state
        ? state.checks.map((check) => (
            <View
              key={check.name}
              testID={checkTestId('p02', check.name)}
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
        <Text testID="p02-report" style={styles.meta}>
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
