# Qualification harness

Adapted from complyj `tools/qualification`. The gate table is code
(`src/gates.ts`). The ledger is append-only and machine-written. Do not edit
`gate-ledger.json` by hand.

P01-P10 are the foundation stage (D46's six themes split so each fact can fail
independently). P11-P14 are follow-on, not foundation closure. iOS, Android and
web are first-class: P01, P02 and P07 fail if the Android emulator fails.

Probes are retained. P01 is implemented (Expo SDK 58 development client, crypto
polyfill, iOS simulator and Android emulator, Migrator babel workaround,
bundle-size baseline, no-polyfill positive control). The probe drives the
simulators with `@expo/agent-cli` (`status`, `dev --dev-client`, `runtime:eval`)
and records an `agent-device` accessibility snapshot. Expo Go is not the host.
P02 is implemented (official `@effect/sql-sqlite-react-native` on op-sqlite
18.2.5 on iOS and Android — 17.x does not compile on RN 0.88 New Architecture —
`@effect/sql-sqlite-wasm` with OPFS on web, expo-sqlite fallback probe on all
three). P03 is implemented (Effect-native OTLP/JSON to motel 0.2.8 from iOS
and Android; wrong-endpoint positive control; physical-device path documented).
P04 is implemented (log store contract on sqlite-node, postgres via PGlite,
op-sqlite native iOS and Android, and sqlite-wasm OPFS web; HLC future-skew
bound 5s; append volume 2000; duplicate-append positive control).
P05 is implemented (changesets and projections on the same five stores; 24h
open-changeset TTL; incomplete-changeset positive control; pinned
`viviefs/changeset/*` and `evidence/*` names).
P06 is implemented (datom-backed `WorkflowEngine` crash matrix on sqlite-node
and PGlite; memory-engine durability positive control; pinned
`viviefs/workflow/*`, `viviefs/activity/exit`, `viviefs/deferred/exit`,
`viviefs/clock/wake-at` and `viviefs/lease/holder`). P07 is implemented
(device force-quit mid-upload and mid-wait on iOS simulator and Android
emulator; launch `EngineSweep` resumes; without sweep the workflow stays
parked; motel `p07.park` / `p07.resume`; `expo-notifications` 58.0.3).
P08 is implemented (evidence capture screen three ways: XState v5 +
`fromPromise`, `@typeonce/effect-machine` 0.38.0, Effect + Atom; shared
selector, settled text, query atoms, stories and a11y; broken variant
positive control; winner recorded in ADR 0020).
P09-P14 that have not been implemented refuse to pass; there is no
passing placeholder.

## Run

```sh
pnpm ledger                 # Cumulative state.
pnpm qualify --gate P01     # One probe
pnpm qualify --foundation   # P01-P10 in order, on a committed tree
pnpm qualify                # P01-P14 in order
```

`pnpm verify` does not run qualification. GitHub Actions runs `verify` only.
A sequential full run of P01-P10 on unchanged committed inputs is what closes
the foundation stage.

Unknown gate ids fail. Every negative claim in a later probe must ship a
positive control. Sanitized evidence records go to `docs/evidence/`; bulky
artifacts stay in `.artifacts/qualification` (gitignored).
