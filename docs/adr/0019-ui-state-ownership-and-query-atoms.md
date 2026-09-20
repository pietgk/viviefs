# ADR-0019: UI state ownership and live reads with query atoms

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P05, P08

Related: D41, D42. web-interview ADR 007.
[Architecture section 12](../plan/bootstrap/03-architecture.md).

## Problem

If screens write datoms, or if query layers re-project the whole log, agents
and humans both slop: keystroke-per-datom, quadratic reads, tests that need a
real database to render a button.

## Design

Three state owners:

1. Domain facts in the datom log, read through read models.
2. Screen and interaction state in a machine or atom (decided by ADR 0020 / P08).
3. In-flight text in component state until it settles (idle, blur, Enter),
   which mints a datom.

Components are pure views over a **screen-view selector** (read model + UI
state + status). Storybook stories use fakes, scoped to web and shared
components. React Native Storybook is an open item, not a P01 requirement.

Live reads: query atoms (`@effect/atom-react`) run SQL against read models and
declare invalidation keys (entity prefixes plus attribute keys for
cross-cutting queries). After committing a changeset the projector calls
`Reactivity.invalidate` with the touched prefixes and attributes; only
matching atoms re-query. Two variants: committed, and committed + my open
changesets. A dev-mode check warns when an atom returns different data without
having been invalidated.

## Trade-offs

Replaces web-interview's quadratic full re-projection. Suitability of
`@effect/atom-react` and `Reactivity` for prefix/attribute invalidation is a
P05/P08 claim, not a fact yet.

## Failure-handling

P05 includes Reactivity keys. P08 requires all three interaction-state
variants to pass the same screen tests and stories using this split.

## Outcome

### Expected

Screens do not write datoms. Invalidation is prefix/attribute, not full
rebuild.

### Observed

Not yet run.
