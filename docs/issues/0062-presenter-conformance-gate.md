# I62: The Presenter conformance gate

Status: ready-for-human

Category: enhancement

Decide when: a second Presenter implementation is built (the columnar copy of I63, in-memory datom indexes, or another), or the Presenter pattern's guide is scheduled

Found: 2026-10-08

## What

The Presenter pattern has no gate yet: write its conformance suite and qualify the reference implementation against a second implementation, so [ADR-0033](../adr/0033-the-presenter-pattern.md) can leave `Proposed, unverified`.

From [I49](0049-projection-one-concept-or-several-patterns.md) (D107-D113). The claim to qualify (D110): every implementation returns the reference's frame for the same query at the same `tx`. The reference is SQLite read models with query atoms (ADR-0019, already shown by P05 and P08). The suite also covers a frame subscription rerunning only on matching keys, frame status, and the query as data (D108) translated by more than one implementation. Which second implementation runs first (in-memory datom indexes, DuckDB over the columnar copy of I63, or another) is decided when this gate is scheduled. Named in the gate order of [06-qualification-gates](../plan/bootstrap/06-qualification-gates.md) when it is picked up.

## Comments
