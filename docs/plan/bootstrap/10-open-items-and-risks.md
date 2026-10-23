# Open items and risks

## Freeze, named-slot, hypothesis

A scaffolding session treats these differently. Grilling decisions [D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94] remain accepted intent, unverified until
the named gate.

**Freeze** (scaffold as specified; ask before changing):

- Repo kinds, tags, "apps provide Layers" ([D52 Four project kinds][D52]-[D57 Where docs and exercises live][D57]), including: a feature must not import an adapter.
- Verify - Qualify - Teach, the five verify stages as an elaboration of [D48' Verify - Qualify - Teach][D48'], JS bundle-size budget.
- [P01 Platform on SDK 58][P01]-[P17 Browser engine leader][P17] registered; [P01][P01]-[P10 Trace projection][P10] foundation; [P11 Identity][P11]-[P17][P17] follow-on.
- iOS, Android and web first-class; [P01 Platform on SDK 58][P01], [P02 SQLite drivers][P02] and [P07 Device resume E2E][P07] fail if the Android emulator fails.
- Full-store sync per organization, one cursor, Effect RPC.
- Apache-2.0 and licence checks on new dependencies.
- No feature code before its gate passes.

**Named slot, empty** (create the project, ADR or gate id; do not invent the mechanism):

- Identity was filled at [P11 Identity][P11] (2026-09-28): `TokenVerifier`, `SignInSession`, the fake issuer and membership in the log ([ADR-0022 Identity and organization isolation][ADR-0022], [p11-design-review.md](../../evidence/p11-design-review.md)). Log stores were filled at [P04 Log store conformance][P04]. Sync and the in-memory blob store were filled at [P09 Sync][P09] ([ADR-0017 Sync: outbox and cursor stream over Effect RPC][ADR-0017], [ADR-0021 Files by content hash][ADR-0021]). Telemetry was filled at [P10 Trace projection][P10]: the trace projector and the `TraceSink` contract ([ADR-0018 Tracing derived from the log; telemetry sink pattern][ADR-0018]).
- Sampling of durable spans: the envelope records `sampled`; the trace projector does not honour it yet ([P10 Trace projection][P10]). Decided with the production telemetry backend.
- Quarantine of user content after a lost lease ([D15 Server authority after a lost lease][D15]). Direction agreed 2026-09-27: a human-conflict entry ([D34 Per-attribute conflict policies][D34]) that names the stranded content, resolved by a command (attach to the execution, keep as standalone evidence, or discard). Mechanism and UX in its own grilling and gate, [P14 Quarantine after a lost lease][P14] (registered 2026-09-29 as [P12 UI on every platform][P12], renumbered the same day).

**Hypothesis until gate** (must not constrain other work):

- SQLCipher and crypto-shredding ([P15 Encrypted store][P15], [P16 Crypto-shredding][P16]).
- Effect Cluster ([D39 One engine everywhere][D39]).
- Prefix subscriptions / partial sync.
- History consolidation and client-side data access on a full-org replica (follow-ons to the first sync).
- UI on every platform ([P12 UI on every platform][P12]): one React Native component tree, stories in Chromium and on the simulators ([D72 UI on every platform][D72]).
- Links and routing ([P13 Links and routing][P13]): one URL, one screen and state on every platform ([D73 Links and routing][D73]).
- Cold start, crash-resume and sync round-trip budgets (listed, not gated).

## Unverified claims (each owned by a gate)

| Claim | Source | Gate |
|---|---|---|
| Effect v4 RC works on SDK 58 / RN 0.88 with the same polyfills as on SDK 56, on iOS and Android | research/02 | [P01 Platform on SDK 58][P01] (measured 2026-09-20: 15 checks on iOS and Android with `expo-crypto`, [ADR-0003 Effect v4 as the backbone][ADR-0003]) |
| expo-crypto or react-native-quick-crypto can supply `crypto.subtle.digest` for Workflow | research/02 | [P01 Platform on SDK 58][P01] (measured 2026-09-20: `expo-crypto` on `globalThis.crypto`; without it `workflow memory` fails, [ADR-0004 Expo SDK 58 and Hermes platform baseline][ADR-0004]) |
| What "iOS 27 required" in SDK 58 means (deployment target or build SDK) | research/05 | [P01 Platform on SDK 58][P01] (measured 2026-09-20: build SDK; run used Xcode 26.6 and iOS 26.5, [ADR-0004 Expo SDK 58 and Hermes platform baseline][ADR-0004]) |
| op-sqlite 17 works on RN 0.88 New Architecture on iOS and Android; peer conflict with op-sqlite 18 | research/02 | [P02 SQLite drivers][P02] (measured 2026-09-20: 17.x does not compile; pin is 18.2.5, [ADR-0005 SQLite drivers][ADR-0005]) |
| Effect's native OTLP exporter works on Hermes (BigInt, fetch, JSON) | research/04 | [P03 OTLP and motel][P03] (measured 2026-09-20: iOS and Android, [ADR-0018 Tracing derived from the log; telemetry sink pattern][ADR-0018]) |
| motel can be reached from a physical device (LAN binding) | research/05 | [P03 OTLP and motel][P03] (path documented: LAN binding or cursor catch-up; physical run deferred) |
| A custom `WorkflowEngine` over datoms is 300-600 lines and behaves under the crash matrix | estimate | [P06 Workflow engine crash matrix][P06] (measured 2026-09-20: 646 lines in `engine.ts`; seven kill boundaries on sqlite-node and PGlite; memory engine failed durability; upload hash is computed before the activity, [ADR-0012 Durable execution over one datom-backed engine][ADR-0012]) |
| `@effect/atom-react` and `Reactivity` are suitable for prefix/attribute invalidation from our projector | research/01 section 4 | [P05 Changesets and projections][P05], [P08 UI three-way prototype][P08] (measured 2026-09-20/21: projector keys and capture-screen query atoms, [ADR-0019 UI state ownership and live reads with query atoms][ADR-0019]) |
| Traces derived from the log are lossless and stable across replays, in motel, Jaeger and otel-lgtm | [D32 Traces derived from the log][D32], [D45' Telemetry sink pattern][D45'] | [P10 Trace projection][P10] (measured 2026-09-26 on sqlite-node and PGlite: one trace, entity-keyed ids, one span per attempt after a kill, retry linked, backlog exported after a disabled trace cursor; host only, [ADR-0018 Tracing derived from the log; telemetry sink pattern][ADR-0018]) |
| Keycloak PKCE flow from Expo on Apple Container, on iOS, Android and web | complyj qualified Keycloak, not with Expo | [P11 Identity][P11] (measured 2026-09-28: Keycloak 26.7.3, PKCE S256 through `expo-auth-session` on the iOS simulator, the Android emulator and web, one issuer on every platform; simulator and emulator only, [ADR-0022 Identity and organization isolation][ADR-0022]) |

## Closed in this pass

- **Domain read-sync engine** (Zero, PowerSync, or our own): dead. Q21 deferred it; [D31 One datom log][D31] put domain data in the same
  log and withdrew the spike. A consumer that wants Zero later does that in its own ADR.
- **DuckDB `SqlClient`**: Effect v4 has no DuckDB driver (research/01 section 3). Analytics writes Parquet or
  DuckLake files that DuckDB reads, which is what [D37 Log store tables][D37] already says.
- **Interaction state library**: IntentComposer in `@typeonce/effect-machine` ([P08 UI three-way prototype][P08] review 2026-09-22,
  [ADR-0020 Interaction state: outcome of the three-way prototype][ADR-0020]). XState v5.33.2 and Effect + Atom remain retained probes; XState JSON viz is a later option. Its view
  renders DOM only and is rewritten under [P12 UI on every platform][P12] ([D72 UI on every platform][D72]).
- **Docs site generator**: Starlight on Astro 7, samples embedded from the exemplar and checked by `tsc` 7, no
  Twoslash for now ([D59 Starlight docs site][D59]-[D61 Repository pages rendered in place][D61], 2026-09-29).
- **HLC future-skew bound and log-append volume**: [P04 Log store conformance][P04] picked 5000 ms and 2000 datoms.
- **Foundation closure**: one sequential [P01 Platform on SDK 58][P01]-[P10 Trace projection][P10] run on `3bd24492`, 2026-09-26
  ([2026-09-26-foundation-closure.md](../../evidence/2026-09-26-foundation-closure.md)).
- **[P11 Identity][P11] closure**: one sequential [P01 Platform on SDK 58][P01]-[P11][P11] run on `59b74a9a`, 2026-09-28
  ([2026-09-28-p01-p11-closure.md](../../evidence/2026-09-28-p01-p11-closure.md)).
- **"Hermes inspector did not appear"**: on RN 0.88 every debugger target is "React Native Bridgeless [C++
  connection]", and the harness excluded that description, so it never saw one. It now counts this app's targets,
  and the dead post-launch waits and `runtime:reload` are gone (2026-09-29, Housekeeping).
- **`journal.ts` legacy-shape comment**: names commit `a067a0d6f` instead of a date (fixed with the first engine change, [P11 Identity][P11] step 3a).
- **Bundle size**: 10 MB per platform on the Hermes bundle (agreed 2026-09-27), gated by `verify` with a report
  of what changed since the recorded reference ([2026-09-27-bundle-size.md](../../evidence/2026-09-27-bundle-size.md)).
  iOS 4.74 MB, Android 6.84 MB; Android's `Intl` polyfill with the full time-zone database is 2.0 MB of it.
  Revisit the budget as the app grows.

## Schedule

Agreed 2026-09-29; the Docs and teaching part was refined the same day in its grilling ([D74 Docs and teaching order][D74]). Names follow
[06-qualification-gates.md](06-qualification-gates.md#names-for-gates-steps-and-other-work): gates in run order, steps
as `Pnn.k`, other work by name.

| Order | Work | What |
| --- | --- | --- |
| 1 | Housekeeping (done 2026-09-29; [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed in one sequential run on `54e724786`) | Qualify [ADR-0024 Repository structure][ADR-0024], 0025 and 0028-0031 against `verify` with checks that can fail; explain "Hermes inspector did not appear"; clear the Effect language-service suggestions; draft upstream issues (not filed); renumber gates; amend [ADR-0026 Verify - Qualify - Teach][ADR-0026] (acceptance on the guide); one handover; a sequential [P01 Platform on SDK 58][P01]-[P11 Identity][P11] run |
| 2 | Docs and teaching | In this order ([D74 Docs and teaching order][D74]): **Recording** the grilling ([D59-D74 Docs and teaching][D59-D74]); **Skills** update, after an include/adapt list is reviewed ([D69 Matt Pocock skills][D69]; done 2026-09-29, [ADR-0001 Record architectural decisions][ADR-0001] and [ADR-0027 Developer experience planes][ADR-0027] amended); **Docs skeleton**: `apps/docs` with the `.lavish/` move, Mermaid integrity and the docs-only rule ([D59 Starlight docs site][D59]-[D61 Repository pages rendered in place][D61], [D68 Research records][D68]; done 2026-09-30); **Evidence ownership**: file treatments, coverage lockfile, engine suites in `verify` and Schema at every boundary ([D70 Verify versus qualify][D70], [D71 Evidence ownership][D71]; design review 2026-09-30, [D75-D80 Evidence ownership design review][D75-D80]; done 2026-10-01: built in `9716b875d`, [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed in one sequential run on it, `2026-10-01T05-58-55.362Z-02076418`); **Log-store guide**, which settles the guide template ([D62 The shape of a guide][D62]-[D67 Exemplar links to its guide][D67]; design review 2026-10-01, [D81 What a lesson is][D81]-[D86 Named, linked references][D86], and a second round, [D87-D91 References, names and the exercise loop][D87-D91]; built 2026-10-01 as a draft guide, the template, the `guides` and `exercises` verify steps; accepted when the human accepts it, with [P04 Log store conformance][P04] and [P05 Changesets and projections][P05] run on that commit); **App shell**, below; **Durable workflow guide**; **Identity guide**; then the other guides ([D65 Guide inventory and order][D65]) |
| 2, before the App shell | The vivief review, maps 2 and 3 (agreed 2026-10-09) | [I34 vivief as the source of ViViEfs's concepts][I34]'s review paused this Schedule on 2026-10-05. Map 2 (the foundation concepts) is finished and map 3 (the words) is run before the App shell, because guides and screens are written in its words; then the map-2 build issues ([I66 Attribute value types and the typed reference read model][I66], [I69 Accept checks every change][I69], [I67 Minting entity id segments][I67]) and the App shell. Maps 4-6 follow it. Sequence and reasons: [next-session.md](../next-session.md) and [2026-10-09 A sequence for the open issues](../../research/2026-10-09-issue-sequence-review.html) |
| 2, App shell | [P12 UI on every platform][P12] UI on every platform, [P13 Links and routing][P13] Links and routing | One grilling for both, design review, gates; closed by one sequential run. [P08 UI three-way prototype][P08] re-runs on the rewritten IntentComposer view ([D72 UI on every platform][D72], [D73 Links and routing][D73]) |
| 3 | [P14 Quarantine after a lost lease][P14] Quarantine after a lost lease | Grilling, design review, gate |
| 4 | [P15 Encrypted store][P15] Encrypted store, [P16 Crypto-shredding][P16] Crypto-shredding, [P17 Browser engine leader][P17] Browser engine leader | In that order |
| Any time | Storybook 11 stable | Repin from `11.0.0-alpha.1` as its own change, then the [P12 UI on every platform][P12] run |
| Before the first consumer app | Identity, keys and trust; one physical-device run; product apps as app pairs ([D55 Exemplar first, product apps later][D55]); the trace projector on devices | As recorded under Deferred decisions |

Almost every step changes the gates' inputs (the lockfile, the workspace, `libs/`). A guide's own gates run on the
commit that records its acceptance ([D63 Acceptance on the guide][D63]); the sequential runs above close batches of changes.

## Drift between design and build (found 2026-09-29)

Found in the Docs and teaching grilling; each has a decision and a place in the Schedule.

| Drift | Design source | Fixed in |
| --- | --- | --- |
| The crash matrix has no owner in `verify`: it runs through the store projects' integration tests (since 2026-09-20; the drift first read "only in [P06 Workflow engine crash matrix][P06]"), its memory-engine positive control runs only in [P06][P06], and `libs/workflow-engine` declares an owner nothing checks | [D20 Crash matrix as the merge bar][D20], [D26 AI-robust guardrails][D26], [ADR-0025 AI-robust guardrails][ADR-0025] | Evidence ownership ([D71 Evidence ownership][D71], [D78 Engine suites in the engine][D78], [D80 Where tests live][D80]); fixed 2026-10-01: `libs/workflow-engine` runs the engine suites with the positive control, and `evidence` fails when they did not pass |
| No coverage lockfile; evidence owners are declared per project and not checked against what runs | [D48' Verify - Qualify - Teach][D48'], 05, web-interview ADR 005, 006, 010 | Evidence ownership ([D71 Evidence ownership][D71], [D75 Evidence vocabulary][D75]-[D77 Coverage producers][D77]); fixed 2026-10-01: the registry and `evidence-baseline.json`, checked by `ownership` and `evidence` |
| "Schema at every boundary" is not enforced | [D26 AI-robust guardrails][D26], [ADR-0025 AI-robust guardrails][ADR-0025] | Evidence ownership ([D71 Evidence ownership][D71], [D79 Schema at every boundary, linted][D79]); fixed 2026-10-01: a lint rule with a positive control; SQL rows decode through `rowsOf` |
| The `ui` stage's `storybook` step is Vitest with jsdom; no story runs in a browser or on a device; IntentComposer renders DOM only | [D41 Three state owners][D41], [ADR-0019 UI state ownership and live reads with query atoms][ADR-0019], [ADR-0020 Interaction state: outcome of the three-way prototype][ADR-0020] | App shell, [P12 UI on every platform][P12] ([D72 UI on every platform][D72]) |
| `e2e-web` has no project; no Lighthouse budgets | 05 | App shell, [P13 Links and routing][P13] ([D73 Links and routing][D73]) |
| No docs-only path rule; no Mermaid integrity check | 05 | Docs skeleton ([D61 Repository pages rendered in place][D61]); fixed 2026-09-30: `verify`'s `docs` and `diagrams` steps and `tools/verify/src/docs-only.ts` |
| The `integration` stage's description names a crash matrix it does not run | `tools/verify` | Evidence ownership; fixed 2026-10-01: the stage names what it runs |

## Deferred decisions

The deferred decisions agreed on 2026-09-27 are issues now ([D92 Issues as records][D92]), each with the trigger that decides it under
`Decide when:`: [I7 Production hosting, deployment and telemetry backend][I7] to [I20 The trace projector on iOS, Android and web][I20] in [docs/issues](../../issues/README.md), listed with their status under Reference > Issues on
the docs site. Open questions for the human ([I1 Advisories that fail audit with no fix released][I1] to [I6 Post the two upstream issue drafts][I6]) are there too.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Effect modules marked `@stability unstable` (workflow, sql, rpc, http, cli, reactivity, observability; under `effect/*` since 4.0) change in minor releases | Breakage on upgrade | Exact version pin; upgrades as their own change with full verify and gate rerun (ledger goes stale on dependency change) |
| Effect Workflow has no versioning API | In-flight executions break on code changes | Version by workflow name, stable activity names, old versions ship until drained, lint on activity-name changes |
| Metro Migrator dynamic `import()` (Effect-TS/effect#6347, closed by Effect-TS/effect#9157 on `v4/next-minor`; still in 4.0.5 on 2026-10-22) | Build failure when importing SQL modules | Babel stub plugin (`apps/evidence-mobile/babel.config.js`) until the Effect release with the fix is pinned |
| Basis checks on long-lived changesets are subtle | Wrong conflict outcomes | Dedicated [P05 Changesets and projections][P05] cases, a lesson and an exercise |
| Clock skew beyond HLC tolerance on long-offline devices | Wrong LWW winners | Server-side skew detection, flagged in trace; human-conflict policy for important attributes |
| Scope size: many patterns at once | Slow progress | Gate order, delivery definition, one exemplar |
| Storybook `11.0.0-alpha.1` pinned for Vitest 5 ([D72 UI on every platform][D72]); `@storybook/react-native` needs Reanimated 4.5.1 and friends, unproven on Expo 58 / RN 0.88 | Stories break on upgrade, or do not run on device | Exact pin, all Storybook packages on one version; [P12 UI on every platform][P12] qualifies it on iOS, Android and Chromium; stable as its own change |
| Evidence owners declared but not run (found 2026-09-29) | A green `verify` that proves less than it claims | Per-file treatments that name the producing `verify` step ([D71 Evidence ownership][D71], [D76 Eleven file treatments][D76]); since 2026-10-01 `evidence` fails an owned file no test reaches and a suite no test runs |
| Single maintainer projects (motel, effect-machine) | Abandonment | Telemetry sink and interaction state are patterns behind contracts |
| Android first-class qualification on an ungrilled emulator | [P01 Platform on SDK 58][P01]/[P02 SQLite drivers][P02]/[P07 Device resume E2E][P07] blocked on Android-only failures | Fail the gate honestly; do not skip Android to make iOS green |
| Full-org replica on device | Unbounded history and over-broad local reads | History consolidation and client data access are explicit later work, not silent [P09 Sync][P09] extras |
| `@effect/sql-sqlite-wasm` waits forever when its OPFS worker fails before it is ready (found in [P11 Identity][P11]) | A web app hangs instead of failing, for example on a database name over wa-sqlite's 64-character path limit | `@viviefs/store-sqlite-wasm` bounds the open to 30 s, checks the name length and makes a worker failure raise; issue drafted in [upstream-issues.md](../upstream-issues.md) |
| Lab browsers drift: the iOS simulator's WebKit GPU process can hang in the sign-in sheet after long use; Chrome on the emulator shows first-run screens and switches web accessibility off after a quiet spell (found in [P11 Identity][P11]) | Device sign-in cannot be driven, although the app is fine | The [P11 Identity][P11] device run reboots the simulator and starts Chrome with test flags (`prepareAndroidChrome`); failures name the surface instead of timing out silently |
| Lab state outlives a gate: the emulator, the simulator, the agent-device daemon and the motel daemon run across gates and days (found in the [P01 Platform on SDK 58][P01]-[P11 Identity][P11] run) | One gate's leftovers fail a later gate: a notification shade left open, a daemon without `adb`, a motel whose ingest hung while its health answered | Each gate checks what it relies on instead of trusting what is running: Android sessions close the shade, agent-device calls carry the SDK, motel must store a canary span ([closure note](../../evidence/2026-09-28-p01-p11-closure.md)) |

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0001]: ../../adr/0001-record-architectural-decisions.md
[ADR-0003]: ../../adr/0003-effect-v4-as-backbone.md
[ADR-0004]: ../../adr/0004-expo-sdk-58-platform-baseline.md
[ADR-0005]: ../../adr/0005-sqlite-drivers.md
[ADR-0012]: ../../adr/0012-datom-backed-workflow-engine.md
[ADR-0017]: ../../adr/0017-sync-outbox-and-cursor-stream.md
[ADR-0018]: ../../adr/0018-tracing-and-telemetry-sinks.md
[ADR-0019]: ../../adr/0019-ui-state-ownership-and-query-atoms.md
[ADR-0020]: ../../adr/0020-interaction-state-three-way-prototype.md
[ADR-0021]: ../../adr/0021-files-by-content-hash.md
[ADR-0022]: ../../adr/0022-identity-and-organization-isolation.md
[ADR-0024]: ../../adr/0024-repository-structure.md
[ADR-0025]: ../../adr/0025-ai-robust-guardrails.md
[ADR-0026]: ../../adr/0026-verify-qualify-teach.md
[ADR-0027]: ../../adr/0027-developer-experience-planes.md
[D1]: 02-decision-log.md#d1
[D15]: 02-decision-log.md#d15
[D20]: 02-decision-log.md#d20
[D26]: 02-decision-log.md#d26
[D31]: 02-decision-log.md#d31
[D32]: 02-decision-log.md#d32
[D34]: 02-decision-log.md#d34
[D37]: 02-decision-log.md#d37
[D39]: 02-decision-log.md#d39
[D41]: 02-decision-log.md#d41
[D45']: 02-decision-log.md#d45p
[D48']: 02-decision-log.md#d48p
[D52]: 02-decision-log.md#d52
[D55]: 02-decision-log.md#d55
[D57]: 02-decision-log.md#d57
[D59]: 02-decision-log.md#d59
[D59-D74]: 02-decision-log.md#d59-d74
[D61]: 02-decision-log.md#d61
[D62]: 02-decision-log.md#d62
[D63]: 02-decision-log.md#d63
[D65]: 02-decision-log.md#d65
[D67]: 02-decision-log.md#d67
[D68]: 02-decision-log.md#d68
[D69]: 02-decision-log.md#d69
[D70]: 02-decision-log.md#d70
[D71]: 02-decision-log.md#d71
[D72]: 02-decision-log.md#d72
[D73]: 02-decision-log.md#d73
[D74]: 02-decision-log.md#d74
[D75]: 02-decision-log.md#d75
[D75-D80]: 02-decision-log.md#d75-d80
[D76]: 02-decision-log.md#d76
[D77]: 02-decision-log.md#d77
[D78]: 02-decision-log.md#d78
[D79]: 02-decision-log.md#d79
[D80]: 02-decision-log.md#d80
[D81]: 02-decision-log.md#d81
[D86]: 02-decision-log.md#d86
[D87-D91]: 02-decision-log.md#d87-d91
[D92]: 02-decision-log.md#d92
[D94]: 02-decision-log.md#d94
[I1]: ../../issues/0001-advisories-that-fail-audit.md
[I20]: ../../issues/0020-trace-projector-on-devices.md
[I34]: ../../issues/0034-vivief-as-the-source-of-viviefs-concepts.md
[I6]: ../../issues/0006-post-the-upstream-issue-drafts.md
[I66]: ../../issues/0066-attribute-value-types.md
[I67]: ../../issues/0067-minting-entity-id-segments.md
[I69]: ../../issues/0069-accept-checks-every-change.md
[I7]: ../../issues/0007-production-hosting-and-telemetry-backend.md
[P01]: 06-qualification-gates.md#p01
[P02]: 06-qualification-gates.md#p02
[P03]: 06-qualification-gates.md#p03
[P04]: 06-qualification-gates.md#p04
[P05]: 06-qualification-gates.md#p05
[P06]: 06-qualification-gates.md#p06
[P07]: 06-qualification-gates.md#p07
[P08]: 06-qualification-gates.md#p08
[P09]: 06-qualification-gates.md#p09
[P10]: 06-qualification-gates.md#p10
[P11]: 06-qualification-gates.md#p11
[P12]: 06-qualification-gates.md#p12
[P13]: 06-qualification-gates.md#p13
[P14]: 06-qualification-gates.md#p14
[P15]: 06-qualification-gates.md#p15
[P16]: 06-qualification-gates.md#p16
[P17]: 06-qualification-gates.md#p17
