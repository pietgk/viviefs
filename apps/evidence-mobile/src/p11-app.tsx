import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
// Without extension, so Metro picks `p11-platform.web.ts` on web.
import { finishWebSignIn } from './p11-platform'
import {
  actionName,
  P11_ORGS,
  P11_SLOT,
  startingP11,
  startP11Device,
  type P11Action,
  type P11Device,
  type P11Report,
} from './p11-runtime.ts'

const publishGlobal = (report: P11Report) => {
  Object.assign(globalThis, { [P11_SLOT]: report })
}

const stateLabel: Record<P11Report['extra']['state'], string> = {
  starting: 'Starting',
  SignedOut: 'Signed out',
  SignedIn: 'Signed in',
  SignInNeeded: 'Sign-in needed',
}

const slug = (action: P11Action) => actionName(action).replace(/\s+/g, '-')

function ActionButton(props: {
  readonly action: P11Action
  readonly label: string
  readonly enabled: boolean
  readonly onPress: (action: P11Action) => void
  readonly tone?: 'primary' | 'plain' | 'danger'
}) {
  const tone = props.tone ?? 'plain'
  return (
    <Pressable
      testID={`p11-${slug(props.action)}`}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: !props.enabled }}
      disabled={!props.enabled}
      onPress={() => props.onPress(props.action)}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary' && styles.buttonPrimary,
        tone === 'danger' && styles.buttonDanger,
        !props.enabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === 'primary' && styles.buttonTextPrimary,
          tone === 'danger' && styles.buttonTextDanger,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  )
}

function Row(props: { readonly id: string; readonly label: string; readonly value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{props.label}</Text>
      <Text
        testID={`p11-${props.id}`}
        accessibilityLabel={`${props.label} ${props.value}`}
        style={styles.rowValue}
        numberOfLines={2}
      >
        {props.value}
      </Text>
    </View>
  )
}

export default function P11App() {
  // In the web popup the login page redirected to, only hand the result back.
  const [popup] = useState(finishWebSignIn)
  const [report, setReport] = useState<P11Report>(startingP11)
  const device = useRef<P11Device | null>(null)

  useEffect(() => {
    if (popup) return
    publishGlobal(startingP11())
    const started = startP11Device((next) => {
      publishGlobal(next)
      setReport(next)
    })
    device.current = started
    return () => {
      device.current = null
      void started.dispose()
    }
  }, [popup])

  if (popup) {
    return (
      <View style={styles.popup}>
        <Text testID="p11-popup">Returning to ViViEfs…</Text>
      </View>
    )
  }

  const { extra } = report
  const idle = extra.busy === null && extra.state !== 'starting'
  const signedOut = extra.state === 'SignedOut'
  const hasReplica = extra.replica !== null
  const onPress = (action: P11Action) => {
    void device.current?.run(action)
  }

  return (
    <ScrollView
      testID="p11-root"
      accessibilityLabel="P11 sign-in probe"
      contentContainerStyle={styles.container}
    >
      <Text testID="p11-title" style={styles.title}>
        P11 sign-in
      </Text>
      <Text
        testID="p11-state"
        accessibilityLabel={`state ${extra.state}`}
        style={[
          styles.state,
          extra.state === 'SignedIn' && styles.stateIn,
          extra.state === 'SignInNeeded' && styles.stateNeeded,
        ]}
      >
        {stateLabel[extra.state]}
      </Text>

      <View style={styles.card}>
        <Row id="subject" label="Account" value={extra.subject ?? '-'} />
        <Row id="person" label="Person" value={extra.person ?? '-'} />
        <Row
          id="organizations"
          label="Organizations"
          value={extra.organizations.length > 0 ? extra.organizations.join(', ') : '-'}
        />
        {extra.reason ? <Row id="reason" label="Reason" value={extra.reason} /> : null}
        <Row id="replica" label="Local replica" value={extra.replica ?? '-'} />
        {P11_ORGS.map((org) => (
          <Row
            key={org}
            id={`outbox-${org}`}
            label={`Outbox ${org}`}
            value={`${extra.outbox[org].pending} pending, ${extra.outbox[org].acked} acked, ${extra.outbox[org].rejected} rejected`}
          />
        ))}
        {P11_ORGS.map((org) => (
          <Row key={org} id={`rows-${org}`} label={`Local rows ${org}`} value={String(extra.rows[org])} />
        ))}
      </View>

      <View style={styles.actions}>
        <ActionButton
          action={{ _tag: 'signIn' }}
          label={extra.state === 'SignInNeeded' ? 'Sign in again' : 'Sign in'}
          tone="primary"
          enabled={idle && extra.state !== 'SignedIn'}
          onPress={onPress}
        />
        <ActionButton
          action={{ _tag: 'signOut' }}
          label="Sign out"
          enabled={idle && !signedOut}
          onPress={onPress}
        />
        {P11_ORGS.map((org) => (
          <ActionButton
            key={`write-${org}`}
            action={{ _tag: 'write', org }}
            label={`Write in ${org}`}
            enabled={idle && hasReplica}
            onPress={onPress}
          />
        ))}
        {P11_ORGS.map((org) => (
          <ActionButton
            key={`sync-${org}`}
            action={{ _tag: 'sync', org }}
            label={`Sync ${org}`}
            enabled={idle && hasReplica}
            onPress={onPress}
          />
        ))}
        <ActionButton
          action={{ _tag: 'removeAccount' }}
          label="Remove this account from this device"
          tone="danger"
          enabled={idle && hasReplica}
          onPress={onPress}
        />
      </View>

      <Text
        testID="p11-busy"
        accessibilityLabel={extra.busy ? `busy ${extra.busy}` : 'idle'}
        style={styles.meta}
      >
        {extra.busy ? `Working: ${extra.busy}` : `Actions: ${extra.actions}`}
      </Text>
      {extra.last ? (
        <Text
          testID="p11-last"
          accessibilityLabel={`last ${extra.last.action} ${extra.last.outcome}`}
          style={styles.meta}
        >
          {`${extra.last.action}: ${extra.last.outcome}`}
        </Text>
      ) : null}
      {report.error ? (
        <Text testID="p11-error" style={styles.error}>
          {report.error}
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#fff',
    gap: 12,
  },
  popup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  state: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
    color: '#444',
    fontWeight: '600',
  },
  stateIn: {
    backgroundColor: '#e3f6ee',
    color: '#07784f',
  },
  stateNeeded: {
    backgroundColor: '#fdecdf',
    color: '#a63d00',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  rowLabel: {
    color: '#666',
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    color: '#111',
    fontFamily: 'Courier',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbb',
    backgroundColor: '#fff',
  },
  buttonPrimary: {
    backgroundColor: '#1a5fd0',
    borderColor: '#1a5fd0',
  },
  buttonDanger: {
    borderColor: '#d9a3a3',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#222',
    fontWeight: '500',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextDanger: {
    color: '#b3261e',
  },
  meta: {
    color: '#444',
  },
  error: {
    color: '#c30',
    fontWeight: '700',
  },
})
