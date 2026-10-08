# I19: Datom op stored as text

Status: ready-for-human

Category: enhancement

Decide when: a storage or performance budget exists

## What

A datom's `op` is stored as the text `assert` or `retract`, which costs storage next to `e`, `a` and `v`; a boolean would be smaller, and the change re-runs P04-P09.

## Direction

Keep (deferred 2026-09-22).

## Comments

2026-10-08: [I52](0052-the-datom-and-its-store.md) keeps `v` and `op` as text in the log (D121): the log is never filtered by value, so typed columns go where values are queried, the typed reference read model (I66) and the columnar copy (I63). This issue's trigger is unchanged.
