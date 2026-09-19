# Related work and inputs (as of 2026-09-19)

Facts gathered from sibling repos and external sources during the bootstrap grilling session.
"[inference]" marks interpretation, "[unverified]" marks claims not checked against a primary source.

## 1. web-interview (`~/ws/web-interview`): datoms as transactions

Source: read-only survey of the repo.

- **Datom shape**: 5-tuple `[entity, attribute, value, tx, op]` (`shared/src/types.ts:7`); `op` true = assert,
  false = retract. `tx` must be a ULID (`shared/src/datom.ts:87-94`). No timestamp, client id, vector clock or HLC.
  Time lives only in the ULID prefix of `tx`.
- **Hierarchical entity ids**: Todo List `L{ULID}`, Todo `L{list}/T{ULID}` (`shared/src/ulid.ts:25-26,94-101`), so a
  child cannot outlive its parent in the projection.
- **Defining attributes**: each entity type declares one defining attribute (`shared/src/datom.ts:39-69`). Asserting
  it creates the entity, retracting it deletes the entity (and hides its children), re-asserting it restores the
  entity with its other attributes (`docs/architecture.md:132-144`).
- **One datom = one transaction** (ADR 004 `docs/adr/004-single-datom-log.md:10-16`). `tx` is both transaction id
  and datom identity. Older multi-datom tx, `serverSeq`, `basis`, rebase and IndexedDB replica were removed
  (`docs/adr/archive/003-shared-datom-actor.md`).
- **Trusted clock**: client mints `tx` from server time + half RTT + monotonic elapsed, never the local wall clock
  (`frontend/src/todos/trustedClock.ts:22-24,59-63`). Editing is disabled until first server time. Server rejects `tx`
  more than 5s in the future (`backend/src/routes/datoms.ts:97-105`).
- **WAL**: JSONL, one bare array per line, `datasync()` before ack, torn last line truncated, earlier bad line fails
  startup (`backend/src/todos/datomJournal.ts`). Journal keeps losing datoms too; only winners applied.
  Epoch = `tx` of first datom; a new epoch makes clients resync.
- **Sync**: SSE down (`GET /api/datoms/stream`: epoch, compacted winners since cursor, clock, live, heartbeat; cursor
  = SSE id = `tx`), POST up with an outbox (`POST /api/datoms`, returns `serverTime`).
- **Conflicts**: LWW per (entity, attribute) on highest `tx`. Retractions carry the value they intend to remove,
  but only `tx` decides.
- **Rejection**: network error keeps outbox and retries after 1s; permanent rejection drops the batch, clears the
  store, rehydrates, then re-applies the remaining outbox (ADR 008).
- **UI convention** (ADR 007): three state owners (domain facts in the datom log, screen state in
  `todoListsUiState` with past-tense events, in-flight text in `useSettledText`). Only `todoListCommands.ts` may write
  datoms (ESLint enforced). `todoListsScreenView.ts` is a pure selector. Datoms are minted when a field settles
  (idle 500ms, blur, Enter), not per keystroke.
- **Documented limits** (`docs/architecture.md`): single process, replay cost grows, no auth, no tombstone horizon,
  full re-projection per datom (4.6s at 4000 datoms), offline edits lost on reload, no compaction.
- **No Effect usage**; XState was removed.

### web-interview validation and ownership ideas

- Two daily tiers: `watch` and `verify`. `verify` runs `static -> unit -> browser -> quality`, fail fast between
  stages, collect all failures within a stage. `verify help` is generated from the executed table.
- "Done" = green `verify`, with a mechanical path rule for docs-only diffs. Never loosen a gate to pass it.
- **Test-layer ownership** (ADR 005): unit owns pure logic and the fake server, Storybook play owns component states
  and a11y, Playwright owns process boundaries. Each behaviour lives on its lowest owning layer.
- **Evidence ownership** (ADR 010): every source file has exactly one evidence treatment in a reviewed registry
  (`scripts/source-evidence-registry.ts`), with rationale. Unclassified files fail.
- **Coverage lockfile**: `coverage-baseline.json` is a lockfile, not a target. Drops fail, unreviewed improvements
  fail too, provider name and version are part of the evidence.
- Consumer type-tests for published declarations, lint-enforced boundaries plus a `lint-scope` meta check,
  Lighthouse 100 budgets, story-based UI proof instead of coverage percentages.

## 2. complyj (`~/ws/complyj`): qualification

- Qualification = establishing facts about a stack before depending on them, as bounded experiments with stated
  pass conditions (`docs/teaching/L06-qualification-as-a-practice.md`). Validation is architecture
  (`docs/adr/0006-validation-as-architecture.md`). Flakiness is a defect; failures are classified as product bug,
  harness failure, or unsupported environment.
- **Gates** (Q01..Q13): a numbered check establishing one fact through a retained, rerunnable probe. The gate table
  is code (`tools/qualification/gates.ts`). Every denial has a positive control.
- **Ledger** (`tools/qualification/ledger.ts`): append-only, machine-written entries with `gate, status, recordedAt,
  commit, dirty, artifacts, exitCode, probe, probeSha256, inputsSha256, inputsChangedDuringRun`. Input fingerprint
  change makes all passes `stale`. Derived states: pass, fail, not run, stale.
- A full sequential run on an unchanged committed tree is required to close a stage; individual passes do not add
  up to closure.
- ADR status is separate from verification status ("proposed, unverified" -> "selected" with evidence; "qualified
  does not mean admitted"). ADR template has expected vs observed outcome sections.
- Lessons (`docs/teaching/L01..L07`) cite evidence and never become the source of a claim.
- DX as architecture (ADR 0012): three planes (agent context, host toolchain, runtime), each with one source of
  truth; a tool is admitted only for a measured gap.
- Apple Container 1.2.2 is the qualified local runtime (ADR 0007, 0010). Jaeger runs in it on port 31686
  (`tools/qualification/resources.ts:164`), with non-durable storage.

## 3. vivief (`~/ws/vivief`): predecessor concepts

- "Vision View Effect": a working code-analysis tool (DevAC) plus a platform vision.
- Concepts (`docs/contract/vivief-concepts-v6.md`): Datom, Projection, Surface, Contract, effectHandler.
- Datoms `[E,A,V,Tx,Op]`, append-only, schema as datoms, provenance on the tx entity. ADR 0047 uses ULIDs for `e` and
  `tx`, LWW on highest `tx` for scalars, `:contract/conflict` datoms for ref conflicts that need a human.
- Effect handlers `(state, intent) => (state', [intent'])`, implemented as code, LLM, XState or hybrid, with crashes
  recorded as datoms.
- "Observability IS Projection over effect datoms"; OTel spans from tests matched against extracted effects
  (`docs/fact/devac/otel-integration.md`).
- No durable execution engine and no use of the Effect library. [inference] durability was meant to come from the log
  plus replay.

## 4. BirVana (`~/ws/app/pietgk`): the app that started the question

- Expo SDK 56 / RN 0.85 app, on-device LLM, expo-sqlite behind ports, XState v5 actors orchestrate sessions
  (ADR 0014), one mic-owning voice actor (ADR 0017), agent-device drives and Maestro owns E2E (ADR 0010).
- `research/durable-execution.md` (2026-09-07) compares Temporal, Restate, DBOS, Inngest, Step Functions and Azure DF
  by how durability is achieved (replay, journaled RPC, checkpoints, memoisation, state transitions) and names the
  seam agent frameworks lack: durable timers, auto-recovery, in-flight versioning.
- A prior grilling session ("Durable workflows in React Native", complyj worktree, 2026-09-17) settled: device
  workflows serve a real product need, concepts not Temporal compatibility, RN and browser, local notification as
  the only guaranteed timer, versions shipped side by side, and a central sync server.

## 5. State machines and Effect

- Sandro Maglione, "State machines and Effect" and "Bringing state machines in Effect"
  (https://www.sandromaglione.com/newsletter/state-machines-and-effect,
  https://www.sandromaglione.com/newsletter/bringing-state-machines-in-effect):
  - `@typeonce/effect-machine` (github.com/typeonce-dev/effect-machine), beta with breaking changes expected.
    States and events are Schema tagged unions, `Machine.make(...).handle(...)`, `Machine.invokeEffect` for effects,
    compound, parallel and history states. No persistence or React integration described.
  - A `@xstate/effect` integration for XState v6 is in progress, with `fromEffect({ id, schemas, effect })`.
  - Neither is declared the winner.

## 6. Expo SDK 58 beta (https://expo.dev/changelog/sdk-58-beta, read 2026-09-19)

- React Native 0.88 RC. Stable expected 3 to 4 weeks after 2026-09-15.
- "iOS 27 required" [unverified whether minimum deployment target or build SDK; gate P01 checks it].
- Experimental Rust-based transformer (oxc) about 2x faster cold bundling; async routes default on web.
- expo-sqlite: libSQL support removed. Notifications: foreground shown by default, Android
  `delivery: 'alarmClock'` for time-critical alarms. TextDecoder rewritten for speed.
- Breaking: Node 22.13+, iOS scene-based lifecycle mandatory, `NODE_ENV` handling changed, R8 on by default.
- The Effect on RN research (research/02) was done on SDK 56 / RN 0.85 and must be rerun on SDK 58.

## 7. motel (https://github.com/kitlangton/motel, read 2026-09-19)

- `@kitlangton/motel`, MIT, needs Bun 1.1+, about 292 stars and 116 commits.
- Local OTLP/HTTP ingest at `http://127.0.0.1:27686/v1/traces` and `/v1/logs` [gRPC not documented, metrics not
  mentioned]. SQLite store at `${XDG_STATE_HOME:-~/.local/state}/motel/telemetry.sqlite`, 7 day retention, 1 GB cap.
- TUI, web UI, OpenAPI HTTP API (`/openapi.json`), and a `motel-debug` agent skill (`npx skills add`).
- Binds 127.0.0.1: the iOS simulator can reach it, a physical device cannot [LAN binding unverified; gate P07].

## 8. effect.institute and effect.website

See research/04 section 5. effect.institute (Kit Langton): "strange, semi-interactive lessons for learning Effect".
effect.website: versioned docs with concept pages, guides, API reference, Markdown twins of pages; no llms.txt
(the repo ships `LLMS.md` generated from `ai-docs/src`).
