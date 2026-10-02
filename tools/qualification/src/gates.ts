// The gate table. One entry per gate in docs/plan/bootstrap/06-qualification-gates.md,
// in the order a sequential full run executes them.
//
// A gate is present here only with a retained probe file. An identifier that is
// not in this table must fail: safety.test.ts asserts that no unimplemented
// gate can be presented as a passing check. Probe bodies currently refuse to
// pass; they are registered so the ledger can report "not run".

export interface GateProbe {
  gate: string
  /**
   * The gate's name, as in the gate table of 06-qualification-gates.md. Docs
   * render a gate as its id and name ("P04 Log store conformance", D86).
   */
  name: string
  /**
   * The claim this gate proves: a statement the stack depends on that could
   * be false (D93), as in the "Fact to establish" column of the plan's gate
   * table. P is for proof.
   */
  claim: string
  path: string
  args: string[]
  timeoutMs: number
  summary: string
  stage: 'foundation' | 'follow-on'
}

export const gateProbes: GateProbe[] = [
  {
    gate: 'P01',
    name: 'Platform on SDK 58',
    claim:
      'Effect v4 RC runs on Expo SDK 58 / RN 0.88 / Hermes, and builds with Metro',
    path: 'tools/qualification/src/probes/p01.ts',
    args: [],
    timeoutMs: 2_700_000,
    stage: 'foundation',
    summary:
      'Effect v4 RC runs on Expo SDK 58 / RN 0.88 / Hermes on iOS and Android, with polyfills and the Migrator babel workaround.',
  },
  {
    gate: 'P02',
    name: 'SQLite drivers',
    claim:
      '`@effect/sql-sqlite-react-native` on op-sqlite 17.x works on RN 0.88 New Architecture (iOS and Android); `@effect/sql-sqlite-wasm` with OPFS works on web',
    path: 'tools/qualification/src/probes/p02.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      '@effect/sql-sqlite-react-native on op-sqlite 18.2.5 and @effect/sql-sqlite-wasm with OPFS, on iOS, Android and web.',
  },
  {
    gate: 'P03',
    name: 'OTLP and motel',
    claim:
      'Effect\'s native OTLP exporter works on Hermes; motel receives from simulator and physical device',
    path: 'tools/qualification/src/probes/p03.ts',
    args: [],
    timeoutMs: 1_800_000,
    stage: 'foundation',
    summary:
      "Effect's native OTLP exporter works on Hermes; motel receives a known span from the simulator.",
  },
  {
    gate: 'P04',
    name: 'Log store conformance',
    claim:
      'The datom log store contract holds on SQLite (native including Android, wasm, Node) and Postgres',
    path: 'tools/qualification/src/probes/p04.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Log store contract on SQLite (native including Android, wasm, Node) and Postgres: append, HLC, cursor, prefix, compaction.',
  },
  {
    gate: 'P05',
    name: 'Changesets and projections',
    claim:
      'Changesets give atomic, deterministic visibility',
    path: 'tools/qualification/src/probes/p05.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Changesets give atomic, deterministic visibility, including basis checks, policies, and defining-attribute lifecycle.',
  },
  {
    gate: 'P06',
    name: 'Workflow engine crash matrix',
    claim:
      'The datom-backed `WorkflowEngine` resumes correctly after a kill at every boundary',
    path: 'tools/qualification/src/probes/p06.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'Datom-backed WorkflowEngine resumes after a kill at every boundary; external effects are observable at most once.',
  },
  {
    gate: 'P07',
    name: 'Device resume E2E',
    claim:
      'A force-quit app resumes the exemplar workflow, and a notification wakes it',
    path: 'tools/qualification/src/probes/p07.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'foundation',
    summary:
      'Force-quit resume and notification wake on iOS simulator and Android emulator.',
  },
  {
    gate: 'P08',
    name: 'UI three-way prototype',
    claim:
      'Which interaction-state approach fits: XState v5 + Effect, `@typeonce/effect-machine`, Effect + Atom',
    path: 'tools/qualification/src/probes/p08.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'One evidence screen built three ways (XState, effect-machine, Effect+Atom) against the same tests and stories.',
  },
  {
    gate: 'P09',
    name: 'Sync',
    claim:
      'Datom replication with server authority works offline and across devices',
    path: 'tools/qualification/src/probes/p09.ts',
    args: [],
    timeoutMs: 1_200_000,
    stage: 'foundation',
    summary:
      'Datom replication with server authority: outbox, full-org cursor, Effect RPC, leases, typed rejection.',
  },
  {
    gate: 'P10',
    name: 'Trace projection',
    claim:
      'The trace derived from the log is lossless and stable across replays',
    path: 'tools/qualification/src/probes/p10.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'foundation',
    summary:
      'Trace derived from the log is lossless and stable across replays, against motel, Jaeger and otel-lgtm.',
  },
  {
    gate: 'P11',
    name: 'Identity',
    claim:
      'Fake and OIDC implementations satisfy one identity contract',
    path: 'tools/qualification/src/probes/p11.ts',
    args: [],
    timeoutMs: 3_600_000,
    stage: 'follow-on',
    summary:
      'Fake and OIDC Identity implementations; Keycloak PKCE; membership enforced on sync, lease and commands.',
  },
  {
    gate: 'P12',
    name: 'UI on every platform',
    claim:
      'One React Native component tree renders and passes its stories on iOS, Android and web',
    path: 'tools/qualification/src/probes/p12.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'One React Native component tree renders and passes its stories on iOS, Android and web.',
  },
  {
    gate: 'P13',
    name: 'Links and routing',
    claim:
      'One URL opens the same screen and state on every platform',
    path: 'tools/qualification/src/probes/p13.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'One URL opens the same screen and state on iOS, Android and web.',
  },
  {
    gate: 'P14',
    name: 'Quarantine after a lost lease',
    claim:
      'User content stranded by a lost lease is never dropped and is resolved by a human',
    path: 'tools/qualification/src/probes/p14.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'User content stranded by a lost lease becomes a human-conflict entry that a command resolves.',
  },
  {
    gate: 'P15',
    name: 'Encrypted store',
    claim:
      'SQLCipher store passes the log store conformance suite',
    path: 'tools/qualification/src/probes/p15.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'SQLCipher store passes the log store conformance suite with keys in Keychain/Keystore.',
  },
  {
    gate: 'P16',
    name: 'Crypto-shredding',
    claim:
      'Erased subjects are unreadable everywhere',
    path: 'tools/qualification/src/probes/p16.ts',
    args: [],
    timeoutMs: 600_000,
    stage: 'follow-on',
    summary:
      'After key destruction, personal attributes are unreadable on every replica and projection.',
  },
  {
    gate: 'P17',
    name: 'Browser engine leader',
    claim:
      'Only one tab runs the engine',
    path: 'tools/qualification/src/probes/p17.ts',
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
