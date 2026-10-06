# I40: Inventory vivief's ADRs

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: I35, I36

Found: 2026-10-05

Claimed: 2026-10-05

## What

Where do vivief's ADRs stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `contract/adr/` (55 files, about 8,200 lines) with `RELEVANCE.md`, which marks each ADR Active, Transitional, Superseded or Context. ADRs about DevAC's parsing, hub, LikeC4 or browser tooling get a coverage line with scope `DevAC tooling` unless they carry a general idea (for example `0031-architecture-quality-improvement-loop.md`, `0043-hook-based-validation-triggering.md`, `0047-datom-store-sync.md`, and the two tech-stack ADRs `0050-tech-stack.md` and `0051-tech-stack.md`). vivief's ADR numbers collide with ViViEfs's ADR ids, so write a vivief ADR as `vivief ADR 0047` in the rows, never `ADR-0047`, which names ViViEfs's own; read those closely.

Write its rows file, `I40.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of I35 (vivief) and I36 (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[53 rows](../plan/vivief-inventory/rows/I40.md) and a coverage line for each of the 52 ADRs, `README.md`, `RELEVANCE.md` and `template.md`: 9 `taken`, 21 `different`, 17 `missing`, 6 `deferred`, none `rejected`. 51 rows are reference stack, 1 DevAC tooling, 1 product vision. 43 ids are new; 10 refine an index row (6 from I35, 4 from I36), which I45 merges.

At the datom level the two stacks mostly meet: an append-only log, EAVT and AEVT indexes, references sent to a person instead of LWW, DuckDB only for analytics, text settled before it becomes a datom. Below and above it they part: vivief's accepted stack (`vivief ADR 0051`) is peer-to-peer nodes that converge (`The datom log is already a CRDT.`), with in-memory indexes rehydrated from a relay and a web-only UI; ViViEfs is client and server with server authority, a durable log store on every replica and a native-first Expo app.

The six `deferred` rows wait on existing decisions: partial sync (I12), device identity and verified segments (I15), hosting (I7), P12's accessibility positive control and P13's routing. The `missing` rows cluster in two places: the UI layer (headless accessible primitives, design tokens, model-based testing, rich-text CRDT) for map 5, and vivief's working practice for agents in its DevAC ADRs (hooks that inject state, one diagnostics table, an answer-quality benchmark, LLM calls as effect handlers) for map 6.

RELEVANCE marks `vivief ADR 0047` Superseded, yet its datom shape, provenance, conflict table and Loro scoping carry forward unchanged into the Active `vivief ADR 0051`, so a row cites both. vivief's own indexes drift: neither lists `vivief ADR 0052`, both keep the superseded 0040 current, and RELEVANCE's Summary undercounts Transitional by one.

Not settled: `viviefs:adr-lifecycle` is `different` here while I35's `vivief:adr` is `taken`; I45 reconciles the two.

## Comments
