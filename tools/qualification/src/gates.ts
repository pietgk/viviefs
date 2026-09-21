// The gate table. One entry per gate in docs/plan/bootstrap/06-qualification-gates.md,
// in the order a sequential full run executes them.
//
// A gate is present here only with a retained probe file. An identifier that is
// not in this table must fail: safety.test.ts asserts that no unimplemented
// gate can be presented as a passing check. Probe bodies currently refuse to
// pass; they are registered so the ledger can report "not run".

export interface GateProbe {
  gate: string
  path: string
  args: string[]
  timeoutMs: number
  summary: string
  stage: 'foundation' | 'follow-on'
}

export const gateProbes: GateProbe[] = [
  {
    gate: 'P01',
    path: 'tools/qualification/src/probes/p01.ts',
    args: [],
    timeoutMs: 2_700_000,
    stage: 'foundation',
    summary:
      'Effect v4 RC runs on Expo SDK 58 / RN 0.88 / Hermes on iOS and Android, with polyfills and the Migrator babel workaround.',
  },
  {
    gate: 'P02',
    path: 'tools/qualification/src/probes/p02.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      '@effect/sql-sqlite-react-native on op-sqlite 18.2.5 and @effect/sql-sqlite-wasm with OPFS, on iOS, Android and web.',
  },
  {
    gate: 'P03',
    path: 'tools/qualification/src/probes/p03.ts',
    args: [],
    timeoutMs: 1_800_000,
    stage: 'foundation',
    summary:
      "Effect's native OTLP exporter works on Hermes; motel receives a known span from the simulator.",
  },
  {
    gate: 'P04',
    path: 'tools/qualification/src/probes/p04.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Log store contract on SQLite (native including Android, wasm, Node) and Postgres: append, HLC, cursor, prefix, compaction.',
  },
  {
    gate: 'P05',
    path: 'tools/qualification/src/probes/p05.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Changesets give atomic, deterministic visibility, including basis checks, policies, and defining-attribute lifecycle.',
  },
  {
    gate: 'P06',
    path: 'tools/qualification/src/probes/p06.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'Datom-backed WorkflowEngine resumes after a kill at every boundary; external effects are observable at most once.',
  },
  {
    gate: 'P07',
    path: 'tools/qualification/src/probes/p07.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Force-quit resume and notification wake on iOS simulator and Android emulator.',
  },
  {
    gate: 'P08',
    path: 'tools/qualification/src/probes/p08.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'One evidence screen built three ways (XState, effect-machine, Effect+Atom) against the same tests and stories.',
  },
  {
    gate: 'P09',
    path: 'tools/qualification/src/probes/p09.ts',
    args: [],
    timeoutMs: 1_200_000,
    stage: 'foundation',
    summary:
      'Datom replication with server authority: outbox, full-org cursor, Effect RPC, leases, typed rejection.',
  },
  {
    gate: 'P10',
    path: 'tools/qualification/src/probes/p10.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'Trace derived from the log is lossless and stable across replays, against motel, Jaeger and otel-lgtm.',
  },
  {
    gate: 'P11',
    path: 'tools/qualification/src/probes/p11.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'Fake and OIDC Identity implementations; Keycloak PKCE; membership enforced on sync, lease and commands.',
  },
  {
    gate: 'P12',
    path: 'tools/qualification/src/probes/p12.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'SQLCipher store passes the log store conformance suite with keys in Keychain/Keystore.',
  },
  {
    gate: 'P13',
    path: 'tools/qualification/src/probes/p13.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'After key destruction, personal attributes are unreadable on every replica and projection.',
  },
  {
    gate: 'P14',
    path: 'tools/qualification/src/probes/p14.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'One browser leader tab runs the engine (Web Locks); killing the leader promotes the follower.',
  },
]

export const implementedGates = gateProbes.map((probe) => probe.gate)

export const foundationGates = gateProbes
  .filter((probe) => probe.stage === 'foundation')
  .map((probe) => probe.gate)

export function gateProbe(gate: string): GateProbe | undefined {
  return gateProbes.find((probe) => probe.gate === gate)
}
