# I90: Pattern, concept, contract, abstraction

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Give each of the architecture words a newcomer meets first, pattern, concept, foundation concept, contract and abstraction, one meaning, by [I89 How a word is chosen and written][I89]'s rules. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Inputs:

- "Foundation concept" ([D160 The foundation concepts][D160], [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]) against [D82 Patterns build on each other][D82]'s concept (a candidate that is not yet a pattern).
- "Abstraction" or "pattern" ([I33 Ideas batch: abstractions that constrain agents][I33]).
- Contract: ours is what a part promises, an Effect service and its types checked by suites; vivief's `Contract` is spec, test and runtime guard with a trust part ([D124-D129 Accepting a change][D124-D129] adopted its placement).
- Feature: ours is a vertical slice of the app; vivief's `Feature` slice is data and logic.

Rows settled here, from [the vivief inventory](../research/2026-10-06-vivief-inventory.md), map 3: `vivief:concept-vs-pattern` and `viviefs:pattern`, `vivief:contract` and `viviefs:contract`, `viviefs:project-kinds-and-boundaries`. [I33 Ideas batch: abstractions that constrain agents][I33] gets a comment confirming or narrowing what is left of it.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D124-D129]: ../plan/bootstrap/02-decision-log.md#d124-d129
[D160]: ../plan/bootstrap/02-decision-log.md#d160
[D82]: ../plan/bootstrap/02-decision-log.md#d82
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
