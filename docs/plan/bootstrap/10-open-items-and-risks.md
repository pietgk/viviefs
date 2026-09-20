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

- Log stores, sync, identity, blobs, telemetry.
- Quarantine of user content after a lost lease (D15; likely home is D34 human-conflict).

**Hypothesis until gate** (must not constrain other work):

- Interaction-state library (P08).
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
| Effect v4 RC works on SDK 58 / RN 0.88 with the same polyfills as on SDK 56, on iOS and Android | research/02 (measured on SDK 56 only, never on a device) | P01 |
| expo-crypto or react-native-quick-crypto can supply `crypto.subtle.digest` for Workflow | research/02 | P01 |
| What "iOS 27 required" in SDK 58 means (deployment target or build SDK) | research/05 | P01 |
| op-sqlite 17 works on RN 0.88 New Architecture on iOS and Android; peer conflict with op-sqlite 18 | research/02 | P02 (measured 2026-09-20: 17.x does not compile; pin is 18.2.5, ADR-0005) |
| Effect's native OTLP exporter works on Hermes (BigInt, fetch, JSON) | research/04 | P03 (measured 2026-09-20: iOS and Android, ADR-0018) |
| motel can be reached from a physical device (LAN binding) | research/05 | P03 (path documented: LAN binding or cursor catch-up; physical run deferred) |
| A custom `WorkflowEngine` over datoms is 300-600 lines and behaves under the crash matrix | estimate | P06 (measured 2026-09-20: 646 lines in `engine.ts`; seven kill boundaries on sqlite-node and PGlite; memory engine failed durability, ADR-0012) |
| `@effect/atom-react` and `Reactivity` are suitable for prefix/attribute invalidation from our projector | research/01 section 4 | P05, P08 |
| Keycloak PKCE flow from Expo on Apple Container | complyj qualified Keycloak, not with Expo | P11 |

## Closed in this pass

- **Domain read-sync engine** (Zero, PowerSync, or our own): dead. Q21 deferred it; D31 put domain data in the same
  log and withdrew the spike. A consumer that wants Zero later does that in its own ADR.
- **DuckDB `SqlClient`**: Effect v4 has no DuckDB driver (research/01 section 3). Analytics writes Parquet or
  DuckLake files that DuckDB reads, which is what D37 already says.

## Deferred decisions

- Interaction state library (XState v5 + Effect vs effect-machine vs Atom): decided by P08.
- Production hosting, deployment topology, production telemetry backend.
- Scale-out of the engine (Effect Cluster) and multi-runner server.
- Whether product apps (BirVana, ERP, GRC) move into viviefs as app pairs (D55).
- Encryption at rest per consumer app (D50).
- Docs site generator details (Starlight assumed; Twoslash or equivalent for sample checks).
- Quarantine design after a lost lease (D15): user content is never dropped; mechanism unspecified. Likely a
  human-conflict datom plus a review surface, after P05/P09 exist.
- Prefix subscriptions (partial sync): later than P09.
- History consolidation on a full-org replica: later than P09; sits next to D37's compaction horizon.
- Client-side data access on a full-org replica: later than P09. Server isolation (D18) stays authoritative.
- React Native Storybook.
- Physical-device testing beyond P03's documented motel path.
- HLC future-skew bound and log-append volume: P04 picks them.

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
