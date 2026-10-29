import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import { currentPlatform } from './probe-report.ts'
import {
  pendingP07,
  publishP07,
  runP07Session,
  type P07Phase,
} from './p07-runtime.ts'

const phaseTestId = (phase: P07Phase): string | null => {
  if (phase === 'at-upload') return 'p07-at-upload'
  if (phase === 'at-wait') return 'p07-at-wait'
  if (phase === 'resumed') return 'p07-resumed'
  if (phase === 'completed') return 'p07-completed'
  if (phase === 'abandoned') return 'p07-abandoned'
  return null
}

export default function P07App() {
  const [phase, setPhase] = useState<P07Phase>('starting')
  const [error, setError] = useState<string | null>(null)
  const variant = process.env.EXPO_PUBLIC_P07_VARIANT ?? 'mid-upload'

  useEffect(() => {
    let cancelled = false
    publishP07(pendingP07('starting'))
    const original = publishP07
    const wrapped: typeof publishP07 = (state) => {
      original(state)
      if (!cancelled) {
        setPhase(state.extra.phase)
        setError(state.error)
      }
    }
    Object.assign(globalThis, { __viviefsP07Publish: wrapped })
    const fiber = Effect.runFork(
      Effect.gen(function* () {
        yield* Effect.sleep('2.5 seconds')
        const { p07LogStore } = yield* Effect.promise(
          () => import('./p07-official.ts'),
        )
        return yield* runP07Session(p07LogStore(`p07-${currentPlatform()}`))
      }),
    )
    const timer = setInterval(() => {
      const report = (globalThis as { __viviefsP07?: { extra?: { phase?: P07Phase }; error?: string | null } })
        .__viviefsP07
      if (!report?.extra?.phase) return
      if (!cancelled) {
        setPhase(report.extra.phase)
        setError(report.error ?? null)
      }
    }, 250)
    return () => {
      cancelled = true
      clearInterval(timer)
      void Effect.runPromise(Fiber.interrupt(fiber))
    }
  }, [variant])

  const marker = phaseTestId(phase)

  return (
    <ScrollView
      testID="p07-root"
      accessibilityLabel="P07 device resume probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p07-title" style={styles.title}>
        P07 device resume
      </Text>
      <Text testID="p07-host" style={styles.meta}>
        {variant}
      </Text>
      <Text
        testID="p07-status"
        accessibilityLabel={`P07 status ${phase}`}
        style={phase === 'failed' ? styles.fail : styles.meta}
      >
        {phase}
      </Text>
      <Text
        testID="p07-phase"
        accessibilityLabel={`P07 phase ${phase}`}
        style={styles.name}
      >
        {phase}
      </Text>
      {marker ? (
        <Text
          testID={marker}
          accessibilityLabel={marker}
          style={phase === 'abandoned' ? styles.fail : styles.pass}
        >
          {phase}
        </Text>
      ) : null}
      {error ? (
        <Text testID="p07-error" style={styles.fail}>
          {error}
        </Text>
      ) : null}
      <Text
        testID="p07-check-phase"
        accessibilityLabel={`phase ${phase}`}
        style={styles.detail}
      >
        {phase}
      </Text>
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
