# I42: Inventory DevAC's fact docs

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: I35, I36

Found: 2026-10-05

Claimed: 2026-10-06

## What

Which of the ideas DevAC built stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `fact/devac/` (18 files, about 7,900 lines): parsing, data model, storage, federation, rules that lift effects, views, OTel integration, the eval framework. Most is `DevAC tooling`; the rows that matter are the general ideas, such as rules that lift effects, matching traces against extracted effects (named in ViViEfs's `docs/plan/bootstrap/09-sources-to-reuse.md`), the eval framework and views. Cross-link I25 and I31 where they apply.

Write its rows file, `I42.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of I35 (vivief) and I36 (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[33 rows](../plan/vivief-inventory/rows/I42.md) and a coverage line for each of the 17 files in `fact/devac/` (the ticket says 18): 4 `taken`, 14 `different`, 13 `missing`, 1 `deferred`, 1 `rejected`. 25 rows are reference stack, 8 DevAC tooling; the reference-stack rows go mostly to map 5 (12) and map 2 (6). 17 ids are new; 16 refine an earlier row (12 from I35, 1 from I36, 1 from I37, 2 from I40), which I45 merges.

The two stacks meet where DevAC's ideas are general and ViViEfs already holds its own form of them: trace context carried in the envelope (D58, `taken`), implementations behind one model, a single writer that hands over when it dies (P17), observation kept apart from the meaning derived from it, and ids every copy computes the same way. They part on code itself: DevAC turns code into a graph, effects, rules that lift effects, C4 views and dynamic views that people and agents query, and ViViEfs has none of that (I25 "Not taken"). They part again on joining design to run time: vivief would copy test spans into its own query store through the OpenTelemetry SDK, where ViViEfs derives spans from the log, exports through Effect and keeps the sinks as viewers (the SDK is `rejected` by ADR-0018). DevAC's eval has a model score answers 1-5; every ViViEfs check passes or fails.

The folder is less built than its README says (`What we HAVE built`): `otel-integration.md` is a guide whose exporter is a stub, so the trace matching that ViViEfs's `09-sources-to-reuse.md` takes from vivief was never built there; `hub-ipc.md` is an analysis and `roadmap.md` a plan, which also lists the rules engine as a future phase while three other files describe it as built. The files disagree on the effect columns, the entity-id hash, the TypeScript parser (ts-morph or Babel), the hub's path and commands, and whether a repository must be registered; every link out of the folder points at vivief's old layout.

Not settled, for I45: `vivief:effect-telemetry` is `missing` in I35 and `different` in I38 (this file follows I38); `vivief:content-addressed-cache` is `verified (P05)` here and `implemented` in I35; `vivief:effects-as-data` takes map 3 here for its naming part where I35 gave map 5, and may split; `vivief:performance-targets` is `deferred` on budgets "listed, not gated", which a strict reading of D70 makes `rejected`; `vivief:implementations-behind-one-model` is `taken`, though DevAC has no shared suite across languages. Further possible merges are in the rows file's Notes.

## Comments
