# Verify - Qualify - Teach (D28-D30, D46, D48')

One pattern, three questions a delivery must answer, each with its own mechanism. It merges web-interview's verify
gate and ownership ideas with complyj's qualification practice and the effect.website / effect.institute way of
teaching.

| Mode | Question | Mechanism | When |
|---|---|---|---|
| **Verify** | Does the code keep its contract? | Staged `verify` gate, registry of file treatments, evidence lockfile, lint boundaries, budgets | Every change. Done = green. |
| **Qualify** | Is this claim about the stack or a pattern true? | Numbered gates with retained probes, positive controls, fingerprinted append-only ledger, sequential full run | Before depending on a claim, and whenever its inputs change |
| **Teach** | Can a human or an LLM learn it from what we wrote? | Concept page, exercise whose solution passes in `verify`, lesson citing gate evidence | Before a pattern counts as delivered |

What separates Verify from Qualify is what a check needs and what it produces, not its speed (D70, ADR-0026 amended
2026-09-29). Verify runs every check that needs only the host and changes no file. Qualify records claims in the
ledger and runs the device and lab legs. A probe's host part is one function both call. There is no third mode;
`pnpm verify baseline` is the one command that writes the lockfile.

## Delivery definition

A pattern is delivered when:

1. its ADR is **accepted** and links **qualification** evidence,
2. its exemplar passes **verify**,
3. it has a guide: concept page, exercise and lesson in the guide template (**accepted** on that guide),
4. the exemplar links to that teaching material (D29).

ADR status lifecycle: `proposed, unverified` -> `qualified` (gate evidence linked) -> `accepted`. Acceptance is given
on the pattern's guide, the teaching material in one guide template, so "taught" is part of it (ADR-0026, amended
2026-09-29). "Qualified" does not mean "admitted" (complyj ADR 0013).

## Verify

- One command, `pnpm verify`, staged: `static -> unit -> integration -> ui -> quality`. These stage names are an
  elaboration of D48' (staged, fail-fast), not a grilling decision.
  - static: typecheck (incl. docs samples), lint (boundaries, determinism rules, Schema at every boundary), lint-scope,
    ownership (project tags, one file treatment per production file), skill tree against `skills-lock.json`
    (ADR-0027), audit.
  - unit: one Vitest run from the root over every project's unit tests, with coverage (D77).
  - integration: one Vitest run over the suites and tests that need a real store or server: log-store and changesets
    suites on each store, the engine suites and the projection suite on sqlite-node and PGlite.
  - ui: stories with play + a11y (jsdom until P12, D72), Playwright web smoke (from P13).
  - quality: production builds, gated JS bundle size, docs site, diagrams, and `evidence`: this run's coverage,
    suites and stories judged against the registry and the evidence lockfile.
- Fail fast between stages, collect all failures within a stage. `verify help` is generated from the executed table.
- "Done" is mechanical: green `verify`, with a path rule for docs-only diffs (inherited from web-interview; the
  escape hatch must stay a path rule, not judgment).
- Never loosen a gate to make it pass. Disputes about a gate go to a human.
- **Registry** (D75, D76): every production file has one file treatment, the verify step that produces its evidence
  and the verdict applied, with a rationale. A file is judged only by its owning producer; another producer reaching
  it is informational. Suites are named `<pattern>/<aspect>` and live with their contract (D80, 04-repo-structure).
- **Evidence lockfile** (`evidence-baseline.json`, D77): each owning producer's exact per-file coverage, the coverage
  provider, the registry digest and the bundle-size references. It is a lockfile, not a target: a regression fails,
  and an unrecorded improvement fails until `pnpm verify baseline` records it. Baseline runs every producer three
  times and refuses to write when a tuple differs, because a varying tuple is a flaky test.
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
- From P09 on, the dated evidence note includes a Review section: reading order, the probe's `Effect.fn` span tree recorded with `Tracer.make`, and a state diagram taken from span attributes. The probe fails when the committed diagram differs from the run. P01-P08 notes stay as they were written. The diagram reviews the probe and is not a second source of the claim.

## Teach

- **Docs site** (`apps/docs`, Starlight, D59-D61) in the effect.website shape: concept pages (durability, services
  and ports, workflows vs machines, datoms, changesets, HLC), guides ("add a workflow", "add an activity", "add a
  screen"), ADRs as the why, generated API reference from TSDoc, generated llms.txt. Every sample is type-checked in
  `verify`.
- **Guides** (D62-D65): one per pattern in `guides/<pattern>/`, in the one guide template; a pattern is accepted on
  its guide.
- **Exercises** (`exercises/`, effect.institute spirit): a stub, a failing test, a reference solution that passes in
  `verify`. Layout and checks in D66.
- **Lessons** cite gate evidence and never become the source of a claim (complyj rule).
- **One source**: docs pages are canonical; AGENTS.md is a short map; skills are thin procedures linking to guides.
- Key lessons to plan early: the determinism rule, the basis check in changesets, HLC edge cases, "can it ever move?
  then it is a reference", deferreds vs machines, crash and resume seen in the trace.
