# Qualification harness

Adapted from complyj `tools/qualification`. The gate table is code
(`src/gates.ts`). The ledger is append-only and machine-written. Do not edit
`gate-ledger.json` by hand.

P01-P10 are the foundation stage (D46's six themes split so each fact can fail
independently). P11-P17 are follow-on, not foundation closure. iOS, Android and
web are first-class: P01, P02 and P07 fail if the Android emulator fails.

Probes are retained. P01 is implemented (Expo SDK 58 development client, crypto
polyfill, iOS simulator and Android emulator, Migrator babel workaround,
bundle-size baseline, no-polyfill positive control). The probe drives the
simulators with `@expo/agent-cli` (`status`, `dev --dev-client`, `runtime:eval`)
and records an `agent-device` accessibility snapshot. Expo Go is not the host.
P02 is implemented (official `@effect/sql-sqlite-react-native` on op-sqlite
18.2.5 on iOS and Android, because 17.x does not compile on RN 0.88 New Architecture;
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
P08 is implemented (IntentComposer three ways: effect-machine is the copy
target, XState v5 + `fromPromise` and Effect + Atom stay retained probes;
generated mermaid checked by unit test; broken Confirm positive control).
P09 is implemented (sync over Effect RPC: outbox, cursor, server authority,
blobs; the `sync/protocol` suite and its span review). P10 is implemented
(durable spans projected from the journal on sqlite-node and PGlite; motel,
Jaeger and otel-lgtm sinks). P11 is implemented (one token contract on the
fake issuer and Keycloak; membership, actor and server-only data on the
authenticated protocol; PKCE sign-in and local replicas on iOS, Android and
web; three device positive controls). P12-P17 refuse to pass; there is no
passing placeholder.

A probe's host part calls the same suite `verify` runs (D70, D80); the suites
and the catalogue of suite ids are in `@viviefs/testing` and each lib's
`src/suites/`.

## Run

```sh
pnpm ledger                 # Cumulative state.
pnpm qualify --gate P01     # One probe
pnpm qualify --foundation   # P01-P10 in order, on a committed tree
pnpm qualify --through P11  # P01-P11 in order, on a committed tree
pnpm qualify                # P01-P17 in order
```

`pnpm verify` does not run qualification. GitHub Actions runs `verify` only.
A sequential full run of P01-P10 on unchanged committed inputs is what closes
the foundation stage.

Unknown gate ids fail. Every negative claim in a later probe must ship a
positive control. Sanitized evidence records go to `docs/evidence/`; bulky
artifacts stay in `.artifacts/qualification` (gitignored).

## Running a probe alone

Run a probe file directly for a measurement without a ledger entry; only
`pnpm qualify` writes the ledger. Through mise, because the shell's Node is
refused:

```sh
mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-lab.ts      # Keycloak and the evidence server; prints the passwords
mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-device.ts web ios android
mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-device.ts web --control shared-replica
```

The P09, P10 and P11 evidence notes carry a span review between
`span-review` markers, with line anchors into the probe's checks file. A change
that moves those lines makes the probe test fail; regenerate the block from the
probe (`spanReview(spans)` of the probe's run), never by hand.

## Lab facts (check these before blaming the code)

Learned in P11 and in the sequential runs since (2026-09-28 to 2026-10-01).

- **Lab state outlives a gate.** The emulator, the simulator, the agent-device
  daemon and the motel daemon run across gates and days. P07 leaves Android's
  notification shade open (sessions now close it); an agent-device daemon
  started by an iOS call had no `adb` (every call now carries the SDK); a motel
  started days earlier from `/tmp` answered health but hung on ingest (a canary
  span now decides reuse). Details:
  [closure note](../../docs/evidence/2026-09-28-p01-p11-closure.md).
- **iOS accessibility after the sign-in sheet**: for a few seconds
  agent-device's runner can log "Could not match active AX application", and a
  press finds nothing. P11 taps retry only that miss.
- **`agent-cli navigate`** waits up to 45 s twice and reopens the app once; the
  harness gives it 240 s.
- **iOS simulator**: after long use WebKit's GPU process can hang in the
  sign-in sheet ("A problem repeatedly occurred"); `runP11OnPlatform` reboots
  the simulator. A new development build also needs `ios/.xcode.env.local` to
  point at mise's Node (the file is not in git).
- **agent-device on the sign-in sheet**: its tree is unreadable for a moment
  while the sheet loads, and `wait` gives up on that; the driver polls with
  `snapshot -i` every 5 s. Selectors: iOS by label (`role=textfield
  label="Username or email"`, `role=securetextfield label="Password"`), Android
  by Keycloak's HTML ids (`id="username"`, `id="password"`, `id="kc-login"`).
- **agent-device daemon** keeps the PATH it started with. Every harness call
  carries the Android SDK; a daemon started by hand without it needs
  `agent-device daemon stop` before Android.
- **Chrome on the emulator**: first-run screens, and web accessibility switched
  off after a quiet spell. `prepareAndroidChrome()` in `devices.ts` sets test
  flags (debug app plus `/data/local/tmp/chrome-command-line`).
- **A new development build** greets its first launch with a sheet
  ("Continue") that opens the developer menu; the runner dismisses both.
- **P07's notification tap** misses on iOS and Android; the relaunch fallback
  completes the deferred (an open item, not a harness failure).
- **Web**: open the app at `http://localhost:8081`, not `127.0.0.1` (the
  redirect URI must match Keycloak's). Keycloak's browser session survives a
  reload; with `prompt=login` it then asks only for the remembered user's
  password. Metro no longer sends `Cross-Origin-Opener-Policy` (it severed the
  sign-in popup); P02, P04 and P05 pass on web without it.
- **wa-sqlite path limit**: 64 characters including `-journal`; a longer OPFS
  database name used to hang the app silently (now bounded and reported).
