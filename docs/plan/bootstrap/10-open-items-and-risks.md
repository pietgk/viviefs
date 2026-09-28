# Open items and risks

## Freeze, named-slot, hypothesis

A scaffolding session treats these differently. Grilling decisions D1-D58 remain accepted intent, unverified until
the named gate.

**Freeze** (scaffold as specified; ask before changing):

- Repo kinds, tags, "apps provide Layers" (D52-D57), including: a feature must not import an adapter.
- Verify - Qualify - Teach, the five verify stages as an elaboration of D48', JS bundle-size budget.
- P01-P14 registered; P01-P10 foundation; P11-P14 follow-on.
- iOS, Android and web first-class; P01, P02 and P07 fail if the Android emulator fails.
- Full-store sync per organization, one cursor, Effect RPC.
- Apache-2.0 and licence checks on new dependencies.
- No feature code before its gate passes.

**Named slot, empty** (create the project, ADR or gate id; do not invent the mechanism):

- Identity: being filled by P11. The grilling (2026-09-27) is recorded in [p11-design-review.md](../../evidence/p11-design-review.md) and ADR-0022. Log stores were filled at P04. Sync and the in-memory blob store were filled at P09 (ADR-0017, ADR-0021). Telemetry was filled at P10: the trace projector and the `TraceSink` contract (ADR-0018).
- Sampling of durable spans: the envelope records `sampled`; the trace projector does not honour it yet (P10). Decided with the production telemetry backend.
- Quarantine of user content after a lost lease (D15). Direction agreed 2026-09-27: a human-conflict entry (D34) that names the stranded content, resolved by a command (attach to the execution, keep as standalone evidence, or discard). Mechanism and UX in its own grilling and gate after P11; not needed for P11.

**Hypothesis until gate** (must not constrain other work):

- SQLCipher and crypto-shredding (P12, P13).
- Effect Cluster (D39).
- Prefix subscriptions / partial sync.
- History consolidation and client-side data access on a full-org replica (follow-ons to the first sync).
- React Native Storybook.
- Cold start, crash-resume and sync round-trip budgets (listed, not gated).
- Docs site generator (Starlight assumed).

## Unverified claims (each owned by a gate)

| Claim | Source | Gate |
|---|---|---|
| Effect v4 RC works on SDK 58 / RN 0.88 with the same polyfills as on SDK 56, on iOS and Android | research/02 | P01 (measured 2026-09-20: 15 checks on iOS and Android with `expo-crypto`, ADR-0003) |
| expo-crypto or react-native-quick-crypto can supply `crypto.subtle.digest` for Workflow | research/02 | P01 (measured 2026-09-20: `expo-crypto` on `globalThis.crypto`; without it `workflow memory` fails, ADR-0004) |
| What "iOS 27 required" in SDK 58 means (deployment target or build SDK) | research/05 | P01 (measured 2026-09-20: build SDK; run used Xcode 26.6 and iOS 26.5, ADR-0004) |
| op-sqlite 17 works on RN 0.88 New Architecture on iOS and Android; peer conflict with op-sqlite 18 | research/02 | P02 (measured 2026-09-20: 17.x does not compile; pin is 18.2.5, ADR-0005) |
| Effect's native OTLP exporter works on Hermes (BigInt, fetch, JSON) | research/04 | P03 (measured 2026-09-20: iOS and Android, ADR-0018) |
| motel can be reached from a physical device (LAN binding) | research/05 | P03 (path documented: LAN binding or cursor catch-up; physical run deferred) |
| A custom `WorkflowEngine` over datoms is 300-600 lines and behaves under the crash matrix | estimate | P06 (measured 2026-09-20: 646 lines in `engine.ts`; seven kill boundaries on sqlite-node and PGlite; memory engine failed durability; upload hash is computed before the activity, ADR-0012) |
| `@effect/atom-react` and `Reactivity` are suitable for prefix/attribute invalidation from our projector | research/01 section 4 | P05, P08 (measured 2026-09-20/21: projector keys and capture-screen query atoms, ADR-0019) |
| Traces derived from the log are lossless and stable across replays, in motel, Jaeger and otel-lgtm | D32, D45' | P10 (measured 2026-09-26 on sqlite-node and PGlite: one trace, entity-keyed ids, one span per attempt after a kill, retry linked, backlog exported after a disabled trace cursor; host only, ADR-0018) |
| Keycloak PKCE flow from Expo on Apple Container, on iOS, Android and web | complyj qualified Keycloak, not with Expo | P11 |

## Closed in this pass

- **Domain read-sync engine** (Zero, PowerSync, or our own): dead. Q21 deferred it; D31 put domain data in the same
  log and withdrew the spike. A consumer that wants Zero later does that in its own ADR.
- **DuckDB `SqlClient`**: Effect v4 has no DuckDB driver (research/01 section 3). Analytics writes Parquet or
  DuckLake files that DuckDB reads, which is what D37 already says.
- **Interaction state library**: IntentComposer in `@typeonce/effect-machine` (P08 review 2026-09-22,
  ADR-0020). XState v5.33.2 and Effect + Atom remain retained probes; XState JSON viz is a later option.
- **HLC future-skew bound and log-append volume**: P04 picked 5000 ms and 2000 datoms.
- **Foundation closure**: one sequential P01-P10 run on `3bd24492`, 2026-09-26
  ([2026-09-26-foundation-closure.md](../../evidence/2026-09-26-foundation-closure.md)).
- **`journal.ts` legacy-shape comment**: names commit `a067a0d6f` instead of a date (fixed with the first engine change, P11 step 3a).
- **Bundle size**: 10 MB per platform on the Hermes bundle (agreed 2026-09-27), gated by `verify` with a report
  of what changed since the recorded reference ([2026-09-27-bundle-size.md](../../evidence/2026-09-27-bundle-size.md)).
  iOS 4.74 MB, Android 6.84 MB; Android's `Intl` polyfill with the full time-zone database is 2.0 MB of it.
  Revisit the budget as the app grows.

## Deferred decisions

Each item says when it is decided and what is recommended. Agreed 2026-09-27.

| Item | What it is | Decide when | Agreed direction |
|---|---|---|---|
| Production hosting, deployment topology, production telemetry backend | Where the server runs; which backend replaces the local lab sinks; TLS; how the web app keeps its sign-in session (P11 keeps it in memory) | The first consumer app leaves the lab | Decide then, together with sampling of durable spans |
| Engine scale-out (Effect Cluster), multi-runner server | Server-side workflows on more than one runner | A real server-side workflow load or an availability need | Keep; the server never runs device workflows (D14) |
| Product apps into viviefs as app pairs (D55) | Whether BirVana, ERP and GRC live here | Before the first consumer app | Decide after P11-P14 |
| Encryption at rest per consumer app (D50) | Which apps turn on SQLCipher | At the start of an app that holds sensitive data | Per app, once P12 has qualified SQLCipher |
| Docs site generator (Starlight assumed; Twoslash or equivalent for sample checks) | Work order step 7: docs and teaching | Right after P11 | Step 7 runs right after P11, before P12-P14 |
| Quarantine after a lost lease (D15) | User content stranded when a device loses its lease | After P11, in its own grilling | Human-conflict entry (D34) resolved by a command; its own gate. P09 already rejects the stale journal write before it enters the device log; user content stays in the log |
| Partial sync (prefix subscriptions), history consolidation, client-side data access on a full-org replica | Devices hold the whole organization's log | When roles restrict data within an organization, or a replica grows too large | Raised in the P11 grilling (2026-09-27): roles are carried, not enforced, so nothing is brought forward. Server isolation (D18) stays authoritative |
| React Native Storybook | Stories for native-only components | The first native-only component | Keep |
| Physical devices, and a visible local-notification tap that completes a deferred | Everything so far ran on simulators; P07 completed the deferred from JavaScript, the banner tap was not observed (ADR-0013) | Before the first consumer app | One real-phone run on iOS and Android covering both |
| Identity, keys and trust (merges tamper-evidence of stored history and signed changesets, Q15) | Stored history is trusted, not provable; `actor` is a server-checked label, not a signature; `envelope.device` is not authenticated; who may take over a lease is unspecified | Before the first consumer app that makes audit claims, as one research and grilling step, together with P13 | Research inputs: vivief (per-device keypairs, device links as datoms, transport identity kept apart from authorization, Holochain considered), Holochain from primary sources. Candidate direction: hash chain with device-held checkpoints, device keys linked to a person, signed changesets. Until then the server log is never compacted, and crypto-shredding hashes stored ciphertext (P11 grilling Q15, Q23, Q24). Explainer: [identity, keys and trust](../../../.lavish/identity-keys-and-trust.html) |
| Roles in use, invitations, self-service membership | P11 enforces membership only; the operator grants and revokes | The first consumer app that needs a role | Roles are already carried in the caller; the first enforced role comes with its consumer |
| Local deletion after a revoked membership | P11 keeps the organization's copy read-only on the device | With P13 | Deletion is a courtesy, not security; decide it with erasure |
| Identity provider migration | Moving people to a new identity provider | When a consumer changes provider | Relinking is one datom on the server's account entity (ADR-0022); tooling then |
| Datom `op` as `TEXT` (`assert` / `retract`) or a boolean | Storage cost next to `e`, `a`, `v`; a change re-runs P04-P09 | When a storage or performance budget exists | Keep (deferred 2026-09-22) |
| The trace projector on iOS, Android and web | P10 ran it on the host; P03 measured OTLP from Hermes | When the evidence app or a consumer app runs the projector | Not in P11 (P11 grilling). Wire it with the first consumer app, and extend a device run to check it |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Effect v4 `unstable/*` modules (workflow, sql, rpc, http, reactivity, observability) change in minor releases | Breakage on upgrade | Exact version pin; upgrades as their own change with full verify and gate rerun (ledger goes stale on dependency change) |
| Effect Workflow has no versioning API | In-flight executions break on code changes | Version by workflow name, stable activity names, old versions ship until drained, lint on activity-name changes |
| Metro Migrator dynamic `import()` (Effect-TS/effect#6347) | Build failure when importing SQL modules | Babel stub plugin (research/rn-check/babel.config.js) until upstream fix; tracked |
| Basis checks on long-lived changesets are subtle | Wrong conflict outcomes | Dedicated P05 cases, a lesson and an exercise |
| Clock skew beyond HLC tolerance on long-offline devices | Wrong LWW winners | Server-side skew detection, flagged in trace; human-conflict policy for important attributes |
| Scope size: many patterns at once | Slow progress | Gate order, delivery definition, one exemplar |
| Expo SDK 58 is beta | Instability | Pin beta, move to stable when released (expected October 2026) |
| Single maintainer projects (motel, effect-machine) | Abandonment | Telemetry sink and interaction state are patterns behind contracts |
| Android first-class qualification on an ungrilled emulator | P01/P02/P07 blocked on Android-only failures | Fail the gate honestly; do not skip Android to make iOS green |
| Full-org replica on device | Unbounded history and over-broad local reads | History consolidation and client data access are explicit later work, not silent P09 extras |
