# I35: Index vivief's ideas from its backbone

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Found: 2026-10-05

Claimed: 2026-10-05

## What

Which ideas make up vivief's core, named once so every later slice of the inventory uses the same names? Read vivief's backbone (`~/ws/vivief/docs`): `contract/vivief-concepts-v6.md` (including its glossary, section 11), `contract/concepts-quick-ref.md` and `contract/foundation.md`, about 1,700 lines.

Write `docs/plan/vivief-inventory/rows/I35.md`: one row per idea with a `vivief:<kebab-slug>` id, and for each its ViViEfs side, cited by source (glossary term, decision, ADR, gate), because I36 runs beside this ticket and its ids do not exist yet. Follow the row format and the rules in the [map](../plan/vivief-inventory/map.md) Notes, with a coverage line per file. This index fixes the vivief names the slices I37-I44 reuse, so prefer vivief's own terms and one id per idea.

## Answer

[103 rows](../plan/vivief-inventory/rows/I35.md) with `vivief:` ids, and a coverage line for every section of the three files: 7 `taken` (datom, effects over actions, observability as projection, artifact, ADR, derived never authoritative, executable spec), 46 `different`, 50 `missing`, none `deferred` or `rejected`, because no ViViEfs decision, slot, hypothesis or `Decide when:` covers a vivief idea itself. 86 rows are reference stack, 15 DevAC tooling, 2 product vision.

The biggest gaps are the trust model (provenance categories, trust score, trust strategies, sandbox, trust signals), `Surface`, the creation loop and its fix escalation, and effects as data with the rules that lift them. Many differences are same-word clashes: `Contract`, `Intent`, `concept` and `pattern`, `Feature` slice, `skill`, actor, compaction, `Changeset`, `Effect`, `Workflow`. ViViEfs splits `Projection` into read models, query atoms, membership and crypto-shredding, and keeps provenance in the envelope, outside the datoms (D58).

Not settled: whether the DevAC-side ideas that I25 raises (effect telemetry, gap analysis, effect hierarchy, core equivalence) are reference stack or DevAC tooling. They are scoped reference stack here, with map 5.

## Comments
