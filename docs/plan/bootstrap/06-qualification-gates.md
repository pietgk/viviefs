# Qualification gates (D46)

The spikes are gates: retained probes with stated pass conditions and positive controls, recorded in the ledger.
Order matters; later gates depend on earlier ones. `P` = platform/pattern gate (complyj uses `Q` for its own).

D46 named six foundation **themes**: platform, log store, engine + crash matrix, UI prototype, sync, trace
projection. P01-P10 are those themes split so each fact can fail independently (platform → P01-P03, log store →
P04-P05, engine → P06-P07). P11-P17 are follow-on (identity, UI on every platform, links and routing, quarantine
after a lost lease, encrypted store, crypto-shredding, browser leader), not foundation closure.

iOS, Android and web are first-class. P01, P02 and P07 fail if the Android emulator fails.

| Gate | Fact to establish | Pass condition | Positive control | Informs |
|---|---|---|---|---|
| **P01** Platform on SDK 58 | Effect v4 RC runs on Expo SDK 58 / RN 0.88 / Hermes, and builds with Metro | The research/02 probe (15 checks incl. `Workflow` + `Activity` on the memory engine) passes on a real iOS simulator **and** a real Android emulator with real polyfills (expo-crypto or react-native-quick-crypto for `getRandomValues` and `subtle.digest`); a bundle importing `effect/unstable/sql` builds with the Migrator babel workaround; the meaning of "iOS 27 required" is recorded; JS bundle-size baseline recorded | A bundle without the crypto polyfill fails the workflow check | D9, D22 |
| **P02** SQLite drivers | `@effect/sql-sqlite-react-native` on op-sqlite 17.x works on RN 0.88 New Architecture (iOS and Android); `@effect/sql-sqlite-wasm` with OPFS works on web | Migrations, transactions, EAVT queries and a volume that exercises index behaviour run on iOS, Android and web; peer conflict with op-sqlite 18 resolved by pinning | Fallback probe: minimal `SqlClient` over expo-sqlite passes the same checks | D16 |
| **P03** OTLP and motel | Effect's native OTLP exporter works on Hermes; motel receives from simulator and physical device | A known span arrives in motel from simulator; physical device path documented (LAN binding or cursor catch-up) | Export with a wrong endpoint produces no motel entry and no crash | D32, D45' |
| **P04** Log store conformance | The datom log store contract holds on SQLite (native including Android, wasm, Node) and Postgres | Append, dedup by `tx`, HLC mint and receive rules (incl. backwards clock, reboot, remote-ahead), cursor streaming, prefix scans, compaction horizon. P04 picks the HLC future-skew bound and the append volume used in probes | Duplicate append is a no-op while a new `tx` is appended | D31, D33', D37 |
| **P05** Changesets and projections | Changesets give atomic, deterministic visibility | Manifest gating, commit ordering, basis check per policy (LWW, write-once, human conflict), `cs == tx` shorthand, abort and expiry, defining attribute lifecycle, prefix-id cascade, orphan conflict, Reactivity keys, full rebuild equals incremental. Vocabulary pass for attribute names before any exemplar ships them (D44) | A changeset missing one member stays invisible; completing it makes all members visible at once | D34, D35'', D38, D42 |
| **P06** Workflow engine crash matrix | The datom-backed `WorkflowEngine` resumes correctly after a kill at every boundary | Kill before an activity, during it, after it before the journal write, during a deferred wait, during a clock, during a lease handoff, and during a content-hash file upload: every case resumes, and every external effect is observable at most once thanks to idempotency keys | The same matrix on `WorkflowEngine.layerMemory` fails the durability cases | D10, D20, D39, D43 |
| **P07** Device resume E2E | A force-quit app resumes the exemplar workflow, and a notification wakes it | Maestro via agent-device force-quits mid-upload and mid-wait on iOS simulator **and** Android emulator; relaunch resumes; a scheduled local notification tap completes a deferred; trace shows crash and resume | Without the engine sweep on launch, the workflow does not resume | D3, D20, D24 |
| **P08** UI three-way prototype | Which interaction-state approach fits: XState v5 + Effect, `@typeonce/effect-machine`, Effect + Atom | One screen of the evidence flow built three ways with D41's three state owners and D42's query atoms. Compared on type safety, test and story ergonomics, and lines of code. All three variants must pass the same screen tests and stories; the ADR records the winner. Product-specific criteria (voice, affordance) stay out (D55) | A variant that cannot render the screen and pass those tests fails the study (the harness is broken if nothing can fail) | D12, D41 |
| **P09** Sync | Datom replication with server authority works offline and across devices | Outbox up, one full-organization cursor stream down, Effect RPC append-and-acknowledge, server validation, typed rejection with rebuild and reapply, unknown attribute upgrade error, lease fencing across two devices, deferred completion from the server, a changeset that references a file waits until that file exists on the server | A stale-lease journal write is rejected while the current holder's write is accepted | D13-D15, D36, D40, D43, D44 |
| **P10** Trace projection | The trace derived from the log is lossless and stable across replays | Crash-and-resume run produces one trace with deterministic span ids, no duplicate spans on replay, attempts linked; the same smoke test passes against motel, Jaeger and otel-lgtm | Disabling the trace cursor loses nothing: re-enabling exports the backlog | D32, D45' |
| **P11** Identity | Fake and OIDC implementations satisfy one identity contract | Keycloak on Apple Container with PKCE from the iOS simulator, the Android emulator and web; membership enforced on sync, lease and commands. Checks split in [p11-design-review.md](../../evidence/p11-design-review.md) | Cross-organization access denied while same-organization access allowed | D18, D47 |
| **P12** UI on every platform | One React Native component tree renders and passes its stories on iOS, Android and web | Set by its grilling (the app-shell step, with P13). Direction agreed 2026-09-29: components in React Native primitives, web through react-native-web; stories run in Chromium in `verify` (`@storybook/react-native-web-vite` + `@storybook/addon-vitest`) and on the iOS simulator and Android emulator in this gate (`@storybook/react-native`, driven by agent-device through the accessibility tree); IntentComposer is rewritten on it and P08 re-runs | Set by its grilling, for example a story without an accessibility label fails in both places | D41, D54 |
| **P13** Links and routing | One URL opens the same screen and state on every platform | Set by its grilling (the app-shell step, with P12). Includes the first web E2E journey (Playwright) and the Lighthouse budgets on the served web build | Set by its grilling | - |
| **P14** Quarantine after a lost lease | User content stranded by a lost lease is never dropped and is resolved by a human | Set by its grilling and design review. Direction agreed 2026-09-27: a human-conflict entry (D34) names the stranded content, and a command resolves it (attach to the execution, keep as standalone evidence, or discard) | Set by its grilling | D15, D34 |
| **P15** Encrypted store | SQLCipher store passes the log store conformance suite | P04 + P05 suites green on SQLCipher with keys in Keychain/Keystore | Wrong key cannot open the database | D50 |
| **P16** Crypto-shredding | Erased subjects are unreadable everywhere | After key destruction, personal attributes are unreadable on every replica, projection and export; the log stays intact and syncable | Non-erased subject stays readable | D51 |
| **P17** Browser engine leader | Only one tab runs the engine | Two tabs, one engine (Web Locks); killing the leader promotes the other tab, which resumes; followers render and forward events over BroadcastChannel | Without the lock, two engines are detected running | D25 |

Closure of the foundation stage: one sequential full run of P01-P10 on an unchanged committed tree. P11-P17 close
before the first consumer app relies on them. P11 closed on 2026-09-28 with one sequential run of P01-P11
([2026-09-28-p01-p11-closure.md](../../evidence/2026-09-28-p01-p11-closure.md)).

## Names for gates, steps and other work

Agreed 2026-09-29, so that a step, a gate and a milestone never share a name.

- **Gates are numbered in the order they run.** A new gate that runs before registered ones takes its place and the
  later ones move up. Only gates without a ledger entry may move.
- **A gate step belongs to a gate** and is written `Pnn.k`: P11.7 is gate step 7 of P11. "Step 7" alone is not
  used, and neither is "step" alone: `verify` has verify steps (D75).
- **Work that is not a gate has a name, not a number**: Housekeeping, Docs and teaching. The scaffolding work order in
  [00-next-session.md](00-next-session.md) keeps its numbers as history only.

Renumbered twice on 2026-09-29. First, when quarantine after a lost lease became a gate that runs before the
others. Then, in the Docs and teaching grilling, when UI on every platform and links and routing became gates that
run before quarantine. Notes use the numbers of their date:

| Gate | Earlier on 2026-09-29 | Before 2026-09-29 |
| --- | --- | --- |
| P12 UI on every platform | not a gate | not a gate |
| P13 Links and routing | not a gate | not a gate |
| P14 Quarantine after a lost lease | P12 | not a gate |
| P15 Encrypted store | P13 | P12 |
| P16 Crypto-shredding | P14 | P13 |
| P17 Browser engine leader | P15 | P14 |
