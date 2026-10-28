# ADR-0008: Single-datom transactions with changesets

Summary: Each datom is its own transaction; changesets make several datoms visible at once with a commit datom.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P05 Changesets and projections][P05]

Related: [D35'' Single-datom transactions with changesets][D35''], [D58 Envelope per changeset][D58]. [Architecture sections 2 and 4](../plan/bootstrap/03-architecture.md).

## Problem

web-interview's one-datom wire is simple but cannot express atomic
multi-attribute or cross-entity changes, or drafts. A dual mechanism (commit
datom vs columns) was never decided. The changeset is the unit of intent (one
command, one actor, one trace).

## Design

Each datom is its own transaction on the wire and in storage. Atomicity across
several datoms comes from **changesets**. A changeset becomes visible when its
commit datom arrives, carrying a changeset manifest (count + hash of members, and file
references). Conflicts are ordered by the commit `tx`. The commit records its
basis; the server checks, per attribute policy, whether touched attributes
changed since.

`cs == tx` means self-committed (a checkbox toggle stays one datom). Commit and
abort are write-once; open changesets may expire. Authors see a "committed + my
open changesets" view. Journal entries of the workflow engine are always
self-committed.

**Envelope ([D58 Envelope per changeset][D58]):** one fixed-shape record per changeset, keyed by `cs`: actor,
device, lease epoch, trace context, command name. Stored in the `changesets`
table, not as datoms. On the wire it travels with the commit datom, or with the
datom when `cs == tx`. A self-committed datom is a changeset of one and has its
own envelope record. Queryable by joining datoms on `cs`. The `changesets`
table name is decided; other column names are indicative until [P04 Log store conformance][P04].

Attribute names for commit/abort are pinned by [P05 Changesets and projections][P05]: `viviefs/changeset/commit`
and `viviefs/changeset/abort` ([D44 Never rename, never migrate][D44]).

## Trade-offs

Keeps the one-datom shorthand, adds atomic multi-attribute changes enforced
once by the projector, and makes drafts native. The cost is changeset manifest gating and
basis checks, which are subtle on long-lived open changesets.

## Failure-handling

[P05 Changesets and projections][P05]: changeset manifest gating, commit ordering, basis check per policy, `cs == tx`
shorthand, abort and expiry. Positive control: a changeset missing one member
stays invisible; completing it makes all members visible at once.

## Outcome

### Expected

One mechanism for every changeset size. Drafts are open changesets. Envelope
always keyed by `cs`.

### Observed

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Fourteen checks on
sqlite-node, PGlite, iOS, Android and web. An incomplete changeset stayed
invisible; completing the changeset manifest made all members visible at once. `cs == tx`
self-commits, abort, and 24h expiry held. Evidence:
[2026-09-20-p05.md](../evidence/2026-09-20-p05.md).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D35'']: ../plan/bootstrap/02-decision-log.md#d35pp
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D58]: ../plan/bootstrap/02-decision-log.md#d58
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
