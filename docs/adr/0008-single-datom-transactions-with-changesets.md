# ADR-0008: Single-datom transactions with changesets

Status: Qualified

Date: 2026-09-20

Qualifying gate: P05

Related: D35'', D58. [Architecture sections 2 and 4](../plan/bootstrap/03-architecture.md).

## Problem

web-interview's one-datom wire is simple but cannot express atomic
multi-attribute or cross-entity changes, or drafts. A dual mechanism (commit
datom vs columns) was never decided. The changeset is the unit of intent (one
command, one actor, one trace).

## Design

Each datom is its own transaction on the wire and in storage. Atomicity across
several datoms comes from **changesets**. A changeset becomes visible when its
commit datom arrives, carrying a manifest (count + hash of members, and file
references). Conflicts are ordered by the commit `tx`. The commit records its
basis; the server checks, per attribute policy, whether touched attributes
changed since.

`cs == tx` means self-committed (a checkbox toggle stays one datom). Commit and
abort are write-once; open changesets may expire. Authors see a "committed + my
open changesets" view. Journal entries of the workflow engine are always
self-committed.

**Envelope (D58):** one fixed-shape record per changeset, keyed by `cs`: actor,
device, lease epoch, trace context, command name. Stored in the `changesets`
table, not as datoms. On the wire it travels with the commit datom, or with the
datom when `cs == tx`. A self-committed datom is a changeset of one and has its
own envelope record. Queryable by joining datoms on `cs`. The `changesets`
table name is decided; other column names are indicative until P04.

Attribute names for commit/abort are pinned by P05: `viviefs/changeset/commit`
and `viviefs/changeset/abort` (D44).

## Trade-offs

Keeps the one-datom shorthand, adds atomic multi-attribute changes enforced
once by the projector, and makes drafts native. The cost is manifest gating and
basis checks, which are subtle on long-lived open changesets.

## Failure-handling

P05: manifest gating, commit ordering, basis check per policy, `cs == tx`
shorthand, abort and expiry. Positive control: a changeset missing one member
stays invisible; completing it makes all members visible at once.

## Outcome

### Expected

One mechanism for every changeset size. Drafts are open changesets. Envelope
always keyed by `cs`.

### Observed

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Fourteen checks on
sqlite-node, PGlite, iOS, Android and web. An incomplete changeset stayed
invisible; completing the manifest made all members visible at once. `cs == tx`
self-commits, abort, and 24h expiry held. Evidence:
[2026-09-20-p05.md](../evidence/2026-09-20-p05.md).
