# ADR-0010: Entity ids, defining attributes and strict-composition prefixes

Status: Qualified

Date: 2026-09-20

Qualifying gate: P05

Related: D38. [Architecture section 5](../plan/bootstrap/03-architecture.md).

## Problem

Hierarchical ids give cheap tree deletes and prefix scans, and they freeze
parentage: an id that encodes a parent cannot move. GRC and ERP have entities
that move (a finding reassigned, a line moved). A single rule for all ids is
wrong.

## Design

Entity ids encode their parent **only for strict composition**: part of the
parent, shared lifetime, can never move. Declared per entity type. Guideline:
"can it ever move? then it is a reference".

- Root: `O{org}/...`. Organization is the isolation unit.
- Composition examples: list -> todo, order -> line, execution -> journal
  entries (`O{org}/W{exec}/A{activity}#{attempt}`), deferreds
  (`O{org}/W{exec}/D{name}`).
- Everything else uses reference attributes.

Separator `/`. Ids are branded Schema types.

**Defining attribute:** one per entity type. Asserted = exists, retracted =
deleted (subtree hidden), re-asserted = restored with its other attributes.

**Projection rule:** visible iff the defining attribute is asserted and the
owner (id parent or owner reference) is visible. Orphaned writes to
user-content types raise a human conflict (never silent loss).

Prefix power: authorization, compaction, export and Reactivity keys all work by
prefix. First sync is full-store per organization (one cursor), not prefix
subscriptions.

## Trade-offs

Keeps one-datom tree deletes where composition is real, avoids immutable ids
that cannot move. The cost is a per-type declaration and the discipline of the
guideline.

## Failure-handling

P05: defining-attribute lifecycle, prefix-id cascade, orphan conflict.
Positive control lives with changesets (P05).

## Outcome

### Expected

`O{org}/` is the backbone for isolation and sync. Moveable things are
references.

### Observed

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Retracting a
defining attribute hid the entity; re-asserting restored its other attributes.
Retracting a list hid composed items; restoring the list restored them. A
user-content write under a deleted owner raised an orphan conflict rather than
dropping the write. Evidence:
[2026-09-20-p05.md](../evidence/2026-09-20-p05.md).
