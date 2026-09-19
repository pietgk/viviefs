# Open items and risks

## Unverified claims (each owned by a gate)

| Claim | Source | Gate |
|---|---|---|
| Effect v4 RC works on SDK 58 / RN 0.88 with the same polyfills as on SDK 56 | research/02 (measured on SDK 56 only, never on a device) | P01 |
| expo-crypto or react-native-quick-crypto can supply `crypto.subtle.digest` for Workflow | research/02 | P01 |
| What "iOS 27 required" in SDK 58 means (deployment target or build SDK) | research/05 | P01 |
| op-sqlite 17 works on RN 0.88 New Architecture; peer conflict with op-sqlite 18 | research/02 | P02 |
| Effect's native OTLP exporter works on Hermes (BigInt, fetch, JSON) | research/04 | P03 |
| motel can be reached from a physical device (LAN binding) | research/05 | P03 |
| A custom `WorkflowEngine` over datoms is 300-600 lines and behaves under the crash matrix | estimate | P06 |
| `@effect/atom-react` and `Reactivity` are suitable for prefix/attribute invalidation from our projector | research/01 section 4 | P05, P08 |
| Effect ships a DuckDB `SqlClient` | not checked | analytics projection (later) |
| Keycloak PKCE flow from Expo on Apple Container | complyj qualified Keycloak, not with Expo | P11 |

## Deferred decisions

- Interaction state library (XState v5 + Effect vs effect-machine vs Atom): decided by P08.
- Production hosting, deployment topology, production telemetry backend.
- Scale-out of the engine (Effect Cluster) and multi-runner server.
- Whether product apps (BirVana, ERP, GRC) move into viviefs as app pairs (D55).
- Encryption at rest per consumer app (D50).
- Docs site generator details (Starlight assumed; Twoslash or equivalent for sample checks).

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
