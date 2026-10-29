# I62: The Presenter conformance gate

Status: ready-for-human

Category: enhancement

Decide when: a second Presenter implementation is built (the columnar copy of [I63 The columnar copy as a Presenter implementation][I63], in-memory datom indexes, or another), or the Presenter pattern's guide is scheduled

Found: 2026-10-08

## What

The Presenter pattern has no gate yet: write its conformance suite and qualify the reference implementation against a second implementation, so [ADR-0033](../adr/0033-the-presenter-pattern.md) can leave `Proposed, unverified`.

From [I49](0049-projection-one-concept-or-several-patterns.md) ([D107 The Presenter pattern][D107]-[D113 Who chooses the implementation][D113]). The claim to qualify ([D110 The reference implementation][D110]): every implementation returns the reference's frame for the same query at the same `tx`. The reference is SQLite read models with query atoms ([ADR-0019 UI state ownership and live reads with query atoms][ADR-0019], already shown by [P05 Changesets and projections][P05] and [P08 UI three-way prototype][P08]). The suite also covers a frame subscription rerunning only on matching keys, frame status, and the query as data ([D108 The query is data][D108]) translated by more than one implementation. Which second implementation runs first (in-memory datom indexes, DuckDB over the columnar copy of [I63 The columnar copy as a Presenter implementation][I63], or another) is decided when this gate is scheduled. Named in the gate order of [06-qualification-gates](../plan/bootstrap/06-qualification-gates.md) when it is picked up.

## Comments

2026-10-28: [I92 Map 2's new words][I92]: what a Presenter answers is a presentation surface, of any modality, and a screen is its visual kind ([D200 Presentation surface and screen][D200]); a frame keeps its word ([D201 Frame keeps its word][D201]). The gate's claim names no modality.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0019]: ../adr/0019-ui-state-ownership-and-query-atoms.md
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D108]: ../plan/bootstrap/02-decision-log.md#d108
[D110]: ../plan/bootstrap/02-decision-log.md#d110
[D113]: ../plan/bootstrap/02-decision-log.md#d113
[D200]: ../plan/bootstrap/02-decision-log.md#d200
[D201]: ../plan/bootstrap/02-decision-log.md#d201
[I63]: 0063-the-columnar-copy.md
[I92]: 0092-map-2s-new-words.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
