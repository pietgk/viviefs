# Bootstrap consistency check

Audit of every file in `docs/plan/bootstrap/` against what was actually decided in the grilling session of
2026-09-18/19 (decisions D1-D58). Written 2026-09-19, before any scaffolding.

## 2026-09-20 close

A second session audited this check (counts were wrong; triage lists incomplete; X08 and X31 overstated; X09 and
X26 miscategorized) and then grilled the remaining calls as G1-G11. Answers locked:

| G | Choice |
|---|---|
| G1 | (b) Keep P01-P14; amend D46: six themes, P01-P10 splits, P11-P14 follow-on |
| G2 | (a) Android first-class; P01, P02, P07 fail if the emulator fails |
| G3 | (a) Five verify stages, labelled elaboration of D48' |
| G4 | (a) Full-org cursor, Effect RPC; later: history consolidation and client data access |
| G5 | (a) Read-sync spike dead |
| G6 | (a) Quarantine remains open |
| G7 | (a) P08 comparative with a fail-able bar; no voice/affordance |
| G8 | (a) Inherited DX kept and labelled |
| G9 | (a) Gate JS bundle size; stories web+shared; `docs/evidence/` |
| G10 | (a) Names/numbers illustrative except D58 `changesets` |
| G11 | (a) Define worker; keep ADR grouping; D6 in ADR 0002 |

Those answers were applied to the bootstrap files. This document remains the original audit; do not treat its A/B/C
triage lists as the current work order.

---

**Method.** Each file was re-read line by line and compared with the session record. Cited sibling-repo paths in
`09-sources-to-reuse.md` were checked on disk. Research claims were compared with the notes in
`bootstrap/research/`.

**What this is not.** It does not re-open settled decisions and it does not check the research notes themselves
(they carry their own citations and "unverified" markers).

## Categories

| Code | Meaning | How to address |
|---|---|---|
| **C1** | Contradiction: the text conflicts with a decision, a research fact, or another bootstrap file | Fix the text. No decision needed. |
| **C2** | Invention: plausible detail that was never put to you | Confirm, change, or move to open items. Needs a call. |
| **C3** | Drift: decided, but restated in a way that changes or loses meaning | Reword. |
| **C4** | Gap: decided or implied, but missing from the docs | Add, or record as an open item. |

Headline: the design content is consistent. Every core decision (datom shape, HLC, changesets, ids, conflict
policies, commands, engine, sync, tracing, UI, repo rules, verify-qualify-teach) is recorded faithfully. The
findings are concentrated in the **elaboration layer** I added while writing: gate expansion, verify stage names,
schema and attribute names, lib and generator names, and a few wording slips.

Counts: **6 C1**, **17 C2**, **7 C3**, **9 C4**.

## Triage

### A. Fix without asking (C1 and C3)

`X01` `X05` `X09` `X12` `X16` `X17` `X21` `X26` `X30` `X33` `X36` `X38`

### B. Needs your decision (C2)

The scaffolding session will act on these, so they should be settled first:

1. **Gate expansion** (`X18`): D46 named six spikes; `06-qualification-gates.md` has fourteen gates. Keep 14, or
   fold P07 and P11-P14 into the six?
2. **Verify stages** (`X23`): I added an `integration` stage and specific stage contents that were never decided.
3. **Production budgets** (`X25`): which metrics are actually gated.
4. **Android** (`X08`): the session only ever discussed iOS and web. Is Android a first-class target from day one?
5. **Vendored skill list** (`X03`) and **`CLAUDE.md`** (`X04`).
6. **`docs/evidence/` naming** (`X28`): complyj uses `docs/implementation/`.
7. **Prefix subscriptions in sync** (`X34`): partial sync is a real feature, never decided.
8. **Storybook for native components** (`X24`): feasibility unknown, currently asserted.
9. **Names**: attribute names, table columns, lib names, generator names (`X31` `X32` `X39`): accept as indicative,
   or pin now.

### C. Gaps to close (C4)

`X06` domain read-sync engine status · `X13` quarantine of user content · `X19` no gate owns blobs ·
`X35` browser leader details · `X37` dev-mode staleness check · `X40` glossary additions · `X07` "worker" term ·
`X41` open-items additions · `X20` positive-control gap for P08

---

## README.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X01 | L4 | "grilling session (57 numbered decisions)" | D58 was added on review; the index row says D1-D58 | C3 | Say "58 decisions (D1-D58)". |
| X02 | L34-40 "Conventions" | em dash rule, never hand-edit generated files, quality over cost, E2E-first bug fixes | These come from your global working agreements, not from this session | C2 | Keep, but label them as inherited working agreements so a reader does not look for a decision behind them. |

## 00-next-session.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X03 | L16-17 | Vendor skills: grilling, tdd, domain-modeling, codebase-design, writing-for-agents, scaffold-exercises, motel-debug | Only scaffold-exercises (D29) and motel-debug (D45') were named | C2 | Confirm the list or reduce it to the two named. |
| X04 | L18 | "`CLAUDE.md` pointing at `AGENTS.md`" | D30 names AGENTS.md only | C2 | Confirm. |
| X05 | L40 | "`apps/docs` (Starlight, ...)" as an instruction | `10-open-items` lists Starlight as an assumption | C3 | Write "a static docs generator (Starlight assumed, confirm in step 7)". |
| X06 | whole file | No step covers the domain read-sync engine question | Q21 deferred "read-sync engine (Zero, PowerSync or our own) to a spike"; D31 then put domain data in the same log, which may have removed the need | C4 | Decide: dead (D31 covers it) or still deferred. Record either way. |
| X07 | - | "worker" is used in D2 but nowhere else | Your Q2 phrasing was "workflows that have workers with retryable activities" | C4 | Either define "worker" in the glossary (the device or server process running executions) or drop the word. |
| X08 | L15, and `01` L38 | Android is listed as a target (Node pin, "iOS, Android, web") | The session discussed iOS (simulator, iOS 27, Keychain) and web (Web Locks, OPFS). Android appears only via `alarmClock` notifications and Keystore | C2 | Decide whether Android is in scope now, later, or best-effort. It changes P01, P02 and P07. |
| X09 | L12 | "Stop and report after step 5" | Not discussed | C3 | Harmless; keep but mark as a suggestion. |
| X10 | L33 | "Vitest + `@effect/vitest` as the only unit runner" | D48' says the only test runner, with Storybook, Maestro and Playwright as separate layers | C3 | Reword to "the only unit and integration test runner". |
| X11 | L50-51 | Licence-checking rule for new dependencies | Not decided, though it follows from choosing Apache-2.0 and from the licence findings in the earlier research | C2 | Keep as a rule, or drop. |

## 01-vision-and-scope.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X12 | L49 | "Several people editing the same workflow execution at once (D13c)" | "D13c" points at a rejected option of Q13, not a decision id | C3 | Write "(rejected in D13)". |
| X13 | L34, and `02` D15 | "lease handoff to another device" and D15's quarantine of user content | D15 says user content is never dropped and is quarantined for human resolution | C4 | The architecture never says what quarantine is. Design it (probably a conflict datom plus a review surface) or record it as open. |

## 02-decision-log.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X14 | D16, D19, D23, D27, D4/D5 rows | Appended at the end of the "Purpose, home and platform" table, out of numeric order, and D16 is a storage decision in a platform section | - | C3 | Reorder, or move D16 to the datom-log section. Cosmetic. |
| X15 | D4/D5 row | "Superseded" | Q5 was never answered; it was folded into Q11, which you did answer | C3 | Say "Q5 was not answered directly; D11 replaced it". Accuracy matters when a later session re-reads this. |
| X16 | D46 | "the spikes are qualification gates, in order: platform, log store, engine + crash matrix, UI prototype, sync, trace projection" | Matches the session | C1 | Inconsistent with `06`, which lists 14 gates. Fix whichever side loses: see `X18`. |
| X17 | D32 | "Trace context is written in each changeset's envelope (D58)" | Correct after the D58 fix | - | No action. Listed so the fix is traceable. |

## 03-architecture.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X30 | §9 table, §5 | Attribute names `:workflow/started`, `:activity/exit`, `:deferred/exit`, `:clock/wake-at`, `:lease/holder`, `:workflow/result`, entity segment `C{name}` for clocks | Only the shapes were decided (`O{org}/W{exec}`, `/A{activity}#{attempt}`, `/D{name}` from D40) | C2 | Mark the table as illustrative, or pin the vocabulary now. Note D44: once an attribute name ships it can never be renamed, so pinning deserves a deliberate pass. |
| X31 | §8 | `datoms`, `changesets`, `sync_cursor`, `hlc_state`, `outbox` tables and their columns | D37 decided "one append-only datom table with EAVT and AEVT indexes, typed read models, same transaction" | C2 | Mark as indicative schema for gate P04 to confirm. |
| X32 | §6 | "a `:conflict` datom raised" | D34 decided "a conflict datom"; vivief used `:contract/conflict` | C2 | Pin the attribute name with the vocabulary pass (`X30`). |
| X33 | §3 | "records measured gaps as trace events" | Q33' said the server flags the gap so it shows up in the trace | C3 | Fine, but say "flags it (visible in the trace)" rather than naming a mechanism. |
| X34 | §10 | "filtered by prefix subscriptions the identity is authorised for" | D18 decided authorization by prefix. Subscriptions as a sync feature (partial sync) were never decided, and research/03 lists partial sync as something Effect EventLog lacks | C2 | Decide: full-store sync per organization first, subscriptions later, or subscriptions from the start (larger protocol). |
| X35 | §9 "Browser" | "Web Locks leader tab runs the engine" | D25 also decided that other tabs render and forward events through BroadcastChannel | C4 | Add the follower behaviour. |
| X36 | §11 | "deterministic ids derived from `executionId + activity + attempt` (and changeset ids for commands)" | D32 decided the workflow form only | C3 | Keep the extension but mark it as new, or drop it. |
| X37 | §12 | Three owners, atoms, selectors | D42 also decided two atom variants (committed, and committed plus my open changesets) and a dev-mode staleness check | C4 | Add both to §12; they are currently only in the decision log. |
| X38 | §1 diagram | Commands write straight to the log; deferred completions, leases and the reviewer's path are not shown | D36, D40 | C3 | Either note the diagram is simplified or add the reviewer path, which is the exemplar's second actor. |
| X39 | §10 | "Effect RPC or HttpApi (SSE/WebSocket for the stream)" | Q21 decided "our own append-and-acknowledge protocol on Effect RPC" | C2 | Pin one transport at gate P09 rather than listing options. |

## 04-repo-structure.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X21 | L68 `layer:` rules | "client -> model, core, ui, adapter (via Layers provided by apps)" | D52: apps provide every implementation; features declare requirements in their `R` type | C1 | Contradiction: if a feature may import an adapter, the compile-time guarantee is gone. Change to "client -> model, core, ui" and state that adapters are referenced only by apps. |
| X22 | L16-30 lib list, L93 `@viviefs/<name>`, L100-108 generators, L87-88 evidence owners | Names and sets | D52-D57 decided kinds, tags, rules and that generators exist; none of these names | C2 | The file says lib names are indicative. Extend that note to generators and evidence owners, or pin them now. |
| X28 | L39 `docs/evidence/` | Evidence records location | complyj uses `docs/implementation/` for sanitized evidence (verified on disk); the session said "sanitized evidence records", no path | C2 | Pick a name deliberately: `docs/evidence/` is clearer, `docs/implementation/` keeps parity with complyj. |

## 05-verify-qualify-teach.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X23 | L26-32 | Stages `static -> unit -> integration -> ui -> quality` plus their contents (including `audit` and an ownership-registry check) | D48' decided a staged gate, fail fast between stages. web-interview's stages are `static -> unit -> browser -> quality` | C2 | Confirm the five stages and their contents. The `integration` stage exists because conformance suites and the crash matrix need a database and are slower than unit tests. |
| X24 | L31 | "Storybook play + a11y (native via web renderer where possible)" | Not discussed | C2 | React Native Storybook is a real unknown. Either scope stories to web and shared components, or add it to P01. |
| X25 | L40-41 | Budgets: JS bundle size, cold start, time to resume after a crash, sync round-trip | D48' decided "mobile production budgets" without naming metrics | C2 | Confirm the metric list. Bundle size is measurable today; the other three need a harness. |
| X26 | L34 | "with a path rule for docs-only diffs" | web-interview's rule, not decided here | C3 | Keep only if you want it; it is a real escape hatch that needs to stay mechanical. |
| X27 | L15-19 | Delivery definition lists ADR, exemplar, concept page, exercise, lesson | D29 also required a link from the exemplar to the teaching material | C4 | Add the link requirement. |

## 06-qualification-gates.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X18 | whole file | 14 gates (P01-P14) | D46 decided six: platform, log store, engine + crash matrix, UI prototype, sync, trace projection | C2 | I split platform into P01-P03, engine into P06-P07, and added P11 identity, P12 encrypted store, P13 crypto-shredding, P14 browser leader. Decide: keep 14 (then amend D46), or fold the extras into the six and let the later four be follow-on gates. |
| X19 | P06, P09 | No gate mentions content-hash files | D43 decided files by content hash with commit-time manifest checks | C4 | Add file cases to P06 (upload activity idempotency) and P09 (a changeset waits for its file). |
| X20 | P08 | Positive control "-" | Every gate has a positive control (complyj rule, restated in D48') | C4 | Either give P08 a pass condition that can fail (for example: all three variants must pass the same screen tests and stories) or mark it explicitly as a comparative study, not a gate. |
| X17b | P06 | "every case resumes with each side effect applied at most once (with idempotency keys)" | The model is at-least-once execution made safe by idempotency keys | C1 | Reword: "every case resumes, and every external effect is observable at most once thanks to idempotency keys". As written it promises exactly-once, which the design does not provide. |
| X29 | P08 | Compared on "voice/affordance fit" | D55 keeps product-specific concerns (BirVana's voice ADR) out of the reference | C1 | Drop the criterion here, or state it as a future-consumer consideration. |
| X42 | P01 | "on a real iOS simulator and Android emulator" | See `X08` | C2 | Follows the Android decision. |
| X43 | P02 | "a 10k-datom append" | Arbitrary | C2 | Set a threshold deliberately, or express it as "a volume that exercises index behaviour". |

## 07-glossary-seed.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X40 | whole file | Missing terms | - | C4 | Add: Command, Intent, Outbox, Cursor, Organization (the `O{org}` root and isolation unit), Conflict datom, Crypto-shredding, Personal attribute, Blob, Screen-view selector, Changeset abort, Lease epoch, and Worker (see `X07`). |
| X44 | "Envelope", "Commit datom" | Match D58 | - | - | No action. |

## 08-adr-backlog.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X45 | 27 rows | Grouping of decisions into ADRs | D27 asked for ADRs; the grouping is mine | C2 | Accept as a plan. Note that ADR 0008 now also carries D58. |
| X46 | - | No ADR carries D6 (decisions inherited from the earlier session) | - | C4 | Either fold D6 into ADR 0002, or note it in ADR 0013 where the notification guarantee lives. |

## 09-sources-to-reuse.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X47 | complyj and web-interview rows | Paths | Verified on disk: `.agents/skills/`, `docs/teaching/L01-L07`, `docs/adr/template.md`, `scripts/verify.ts`, `scripts/source-evidence-registry.ts`, `docs/adr/005/007/008/010`, BirVana `.maestro/` all exist | - | No action. complyj has no `docs/evidence/`; its evidence lives in `docs/implementation/` (see `X28`). |

## 10-open-items-and-risks.md

| ID | Where | What it says | What was decided | Cat | Proposed resolution |
|---|---|---|---|---|---|
| X48 | L15 | "Effect ships a DuckDB `SqlClient` - not checked" | research/01 section 3 lists the v4 drivers: clickhouse, d1, libsql, mssql, mysql2, pg, pglite, sqlite-bun, sqlite-do, sqlite-node, sqlite-react-native, sqlite-wasm. No DuckDB | C1 | Correct it: there is no DuckDB driver, so the analytics projection writes Parquet or DuckLake files that DuckDB reads, which is what D37 says anyway. |
| X41 | "Deferred decisions" | Six items | Missing several raised by this check | C4 | Add: domain read-sync engine status (`X06`), Android scope (`X08`), physical-device testing, RN Storybook (`X24`), sync subscriptions (`X34`), attribute vocabulary pass (`X30`), quarantine design (`X13`). |
| X49 | Risks | Eight risks | - | - | No action. They match the research findings. |

---

## Suggested order of work

1. Apply the **A** fixes (mechanical, no decisions).
2. Answer the **B** questions, in this order: gate set (`X18`), Android (`X08`), verify stages (`X23`), sync
   subscriptions (`X34`), budgets (`X25`), then the naming items.
3. Close the **C** gaps in the files they belong to, and add the missing open items.
4. Re-run this check after the scaffolding session, treating it as the first item of the qualification ledger's
   documentation trail.
