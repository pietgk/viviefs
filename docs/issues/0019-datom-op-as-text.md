# I19: Datom op stored as text

Status: ready-for-human

Category: enhancement

Decide when: a storage or performance budget exists

## What

A datom's `op` is stored as the text `assert` or `retract`, which costs storage next to `e`, `a` and `v`; a boolean would be smaller, and the change re-runs P04-P09.

## Direction

Keep (deferred 2026-09-22).

## Comments
