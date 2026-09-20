# Verify - Qualify - Teach (D28-D30, D46, D48')

One pattern, three questions a delivery must answer, each with its own mechanism. It merges web-interview's verify
gate and ownership ideas with complyj's qualification practice and the effect.website / effect.institute way of
teaching.

| Mode | Question | Mechanism | When |
|---|---|---|---|
| **Verify** | Does the code keep its contract? | Staged `verify` gate, ownership registry, ratchet lockfile, lint boundaries, budgets | Every change. Done = green. |
| **Qualify** | Is this claim about the stack or a pattern true? | Numbered gates with retained probes, positive controls, fingerprinted append-only ledger, sequential full run | Before depending on a claim, and whenever its inputs change |
| **Teach** | Can a human or an LLM learn it from what we wrote? | Concept page, exercise whose solution passes in `verify`, lesson citing gate evidence | Before a pattern counts as delivered |

## Delivery definition

A pattern is delivered when:

1. its ADR is **accepted** and links **qualification** evidence,
2. its exemplar passes **verify**,
3. it has a concept page, an exercise and a lesson (**taught**),
4. the exemplar links to that teaching material (D29).

ADR status lifecycle: `proposed, unverified` -> `qualified` (gate evidence linked) -> `accepted` -> `taught`.
"Qualified" does not mean "admitted" (complyj ADR 0013).

## Verify

- One command, `pnpm verify`, staged: `static -> unit -> integration -> ui -> quality`. These stage names are an
  elaboration of D48' (staged, fail-fast), not a grilling decision.
  - static: typecheck (incl. docs samples), lint (boundaries, determinism rules), lint-scope, ownership registry
    check, audit.
  - unit: Vitest + `@effect/vitest` (domain, commands, engine unit, exercise solutions).
  - integration: conformance suites against SQLite and Postgres, crash matrix (engine level).
  - ui: Storybook play + a11y for web and shared components, Playwright web smoke. React Native Storybook is an
    open item, not a P01 requirement.
  - quality: production builds, gated JS bundle size, ratchet lockfile.
- Fail fast between stages, collect all failures within a stage. `verify help` is generated from the executed table.
- "Done" is mechanical: green `verify`, with a path rule for docs-only diffs (inherited from web-interview; the
  escape hatch must stay a path rule, not judgment).
- Never loosen a gate to make it pass. Disputes about a gate go to a human.
- **Ownership registry**: every project declares its evidence owner (see 04-repo-structure). Each behaviour is proven
  on its lowest owning layer; layers do not permanently overlap.
- **Ratchet lockfile**: coverage and budget baselines are a lockfile, not a target. Regressions fail, unreviewed
  improvements fail until the baseline is updated through one command. Producer name and version are recorded.
- **Budgets** (mobile): JS bundle size is gated now (Effect deep imports vs barrel measured in research/02). Cold
  start, time to resume after a crash, and sync round-trip are intended budgets, not gated until a harness exists.
  Web keeps Lighthouse budgets.
- **Flakiness is a defect.** No retries in CI. Failures are classified as product, harness or unsupported environment.
- Reproduce a bug end to end first, with a failing test at the lowest owning layer.
- CI: GitHub Actions runs `verify`. The simulator crash E2E (Maestro via agent-device) is gated before a release, not
  on every PR.

## Qualify

- A **gate** is a numbered check establishing one fact through a retained, rerunnable **probe**. The gate table is
  code (`tools/qualification/gates.ts`). Unknown gate ids fail.
- Every negative claim has a **positive control** (a fencing rejection test also shows a fenced write accepted).
- **Ledger**: append-only, machine-written, never hand-edited. Fields as in complyj: `gate, status, recordedAt,
  commit, dirty, artifacts, exitCode, probe, probeSha256, inputsSha256, inputsChangedDuringRun`. Derived states:
  pass, fail, not run, stale. Any change to harness inputs makes passes stale.
- A stage closes only with one sequential full run on unchanged committed inputs.
- **Patterns with several implementations** (log store, telemetry sink, identity, encrypted store) share one
  conformance probe; each implementation is qualified by running it.
- Bulky artifacts stay out of Git; sanitized, dated evidence records go to `docs/evidence/` (complyj uses
  `docs/implementation/` for the same kind of record).
- The ledger is a plain file, not datoms: you cannot qualify the log store with evidence stored in the log store.

## Teach

- **Docs site** (`apps/docs`) in the effect.website shape: concept pages (durability, services and ports, workflows vs
  machines, datoms, changesets, HLC), guides ("add a workflow", "add an activity", "add a screen"), ADRs as the why,
  generated API reference from TSDoc, generated llms.txt. Every sample is type-checked in `verify`.
- **Exercises** (`exercises/`, effect.institute spirit): a stub, a failing test, a reference solution that passes in
  `verify`. Standard layout via the scaffold-exercises skill.
- **Lessons** cite gate evidence and never become the source of a claim (complyj rule).
- **One source**: docs pages are canonical; AGENTS.md is a short map; skills are thin procedures linking to guides.
- Key lessons to plan early: the determinism rule, the basis check in changesets, HLC edge cases, "can it ever move?
  then it is a reference", deferreds vs machines, crash and resume seen in the trace.
