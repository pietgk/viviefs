# I19: Datom op stored as text

Status: ready-for-human

Category: enhancement

Decide when: a storage or performance budget exists

## What

A datom's `op` is stored as the text `assert` or `retract`, which costs storage next to `e`, `a` and `v`; a boolean would be smaller, and the change re-runs [P04 Log store conformance][P04]-[P09 Sync][P09].

## Direction

Keep (deferred 2026-09-22).

## Comments

2026-10-08: [I52](0052-the-datom-and-its-store.md) keeps `v` and `op` as text in the log ([D121 Attribute value types][D121]): the log is never filtered by value, so typed columns go where values are queried, the typed reference read model ([I66 Attribute value types and the typed reference read model][I66]) and the columnar copy ([I63 The columnar copy as a Presenter implementation][I63]). This issue's trigger is unchanged.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D121]: ../plan/bootstrap/02-decision-log.md#d121
[I63]: 0063-the-columnar-copy.md
[I66]: 0066-attribute-value-types.md
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
