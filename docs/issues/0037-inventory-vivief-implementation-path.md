# I37: Inventory vivief's implementation path

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: [I35 Index vivief's ideas from its backbone][I35], [I36 Index ViViEfs's ideas from its sources][I36]

Found: 2026-10-05

Claimed: 2026-10-05

## What

Where does vivief's path from concepts to technology choices stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `contract/vivief-concepts-impl-kb.md`, `contract/vision/foundation-impl-guide.md` and `contract/vision/foundation-visual.md` (about 1,800 lines): the decision framework, what each concept needs from technology, the phases, the deferral triggers, the deterministic-first loop and the knowledge evolution path ([I34 vivief as the source of ViViEfs's concepts][I34] describes them).

Write its rows file, `I37.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of [I35 Index vivief's ideas from its backbone][I35] (vivief) and [I36 Index ViViEfs's ideas from its sources][I36] (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[42 rows](../plan/vivief-inventory/rows/I37.md) and a coverage line for every section of the KB (`vivief-concepts-impl-kb.md`), the foundation implementation guide and the foundation visual: 6 `taken`, 26 `different`, 9 `missing`, 1 `deferred`, none `rejected`. 40 rows are reference stack, 1 DevAC tooling, 1 product vision. 23 ids are new; 19 refine an earlier row (13 from [I35 Index vivief's ideas from its backbone][I35], 2 from [I36 Index ViViEfs's ideas from its sources][I36], 4 from [I40 Inventory vivief's ADRs][I40]), which [I45 Assemble the vivief inventory][I45] merges.

ViViEfs already runs much of vivief's decision framework under other names: decisions with a reason, then ADRs; gates in run order where vivief has phases; `Decide when:` where vivief has deferral triggers; `verify` as the deterministic pipeline; positive controls where vivief validates a rule before it activates. The two part on order and on agents. The KB builds the single-user core first and leaves sync to phase 20+, while ViViEfs proves sync in its foundation ([P09 Sync][P09]). The KB's deterministic-first loop (triggers, rule proposals with confidence and evidence, review, auto-promotion, trust scores) has no mechanism here: a person runs `retro` and decides, and nothing measures whether a written rule helps an agent. Those gaps feed map 6; the missing step from a concept to its needs and criteria (`vivief:concept-technology-mapping`, `vivief:decision-frame`, `vivief:implementation-phases`) feeds map 4.

The KB lags vivief's own ADRs: it still treats every technology as open (no D2TS, Loro one CRDT candidate among several) and defers peer-to-peer, while `vivief ADR 0051` takes MoQ from day one. `vivief ADR 0046` to 0049 link a KB path that does not exist, and REVIEW.md says the v6 KB was never created though the KB calls itself v6. The guide and the visual keep `.devac/state.json`, which `vivief ADR 0016`'s amendment removed, and the KB's confidence bands (0.7, 0.9) differ from `foundation.md` (80 %, 95 %). The rows file's Notes list the rest.

Not settled, for [I45 Assemble the vivief inventory][I45]: `vivief:knowledge-evolution-path` and `vivief:division-of-labor` are `missing` in [I35 Index vivief's ideas from its backbone][I35] but `different` here (ViViEfs has both in practice, unnamed); `vivief:domain` is `deferred` here through [I9 Product apps in this repository as app pairs][I9]; `vivief:confidence-thresholds` is `missing` but may be `rejected` by [D63 Acceptance on the guide][D63]; `vivief:implementation-phases` may merge into `viviefs:gate-order-and-closure`.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D63]: ../plan/bootstrap/02-decision-log.md#d63
[I34]: 0034-vivief-as-the-source-of-viviefs-concepts.md
[I35]: 0035-index-vivief-ideas-from-its-backbone.md
[I36]: 0036-index-viviefs-ideas-from-its-sources.md
[I40]: 0040-inventory-vivief-adrs.md
[I45]: 0045-assemble-the-vivief-inventory.md
[I9]: 0009-product-apps-as-app-pairs.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
