# ADR-0011: Log store pattern, read models, compaction and analytics

Summary: One LogStore contract over SQL, many stores, one conformance suite; read models are disposable and the log of the sync node holding authority is never compacted.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P04 Log store conformance][P04], [P05 Changesets and projections][P05]

Related: [D37 Log store tables][D37], [D44 Never rename, never migrate][D44], [D118 What a datom needs from storage][D118], [D119 Time corrected by authority][D119], [D121 Attribute value types][D121]. [Architecture section 8](../plan/bootstrap/03-architecture.md),
[ADR 0005](0005-sqlite-drivers.md), [ADR 0006](0006-one-datom-log.md).

## Problem

Device SQLite, Node SQLite and server Postgres must obey one contract, or every
projector and the workflow engine forks. Read-model migrations on an append-only log
fight [D44 Never rename, never migrate][D44]. Analytics on the durable log would couple query shape to durability.

## Design

The log store is a pattern with swappable implementations under one
conformance suite: `sqliteNative` (op-sqlite), `sqliteWasm` (OPFS),
`sqliteNode`, `postgres` (optionally `sqlcipher`, [ADR-0023 Data at rest and crypto-shredding][ADR-0023]).

Indicative tables until [P04 Log store conformance][P04], except [D58 Envelope per changeset][D58]'s `changesets` table which is decided:

- `datoms(e, a, v, tx, op, cs)` append-only, indexes EAVT and AEVT (and on `cs`)
- `changesets(...)` one row per changeset, including self-committed datoms
- typed read-model tables per entity type, Schema-defined, updated
  incrementally in the same SQL transaction that applies a committed changeset
- `sync_cursor`, `hlc_state`, `outbox`

Read models are disposable: rebuilt from the log, never migrated. Attributes
are never renamed or retyped (new attribute + projector mapping). The server
refuses unknown attributes with a typed upgrade error.

Snapshots and compaction only past a horizon every device has acknowledged.
Finished workflow journals archive to the server.

The log of the sync node holding authority, today the server, is never compacted
([P11 Identity][P11] grilling, 2026-09-27; worded for any sync node by [D119 Time corrected by authority][D119], 2026-10-08). It is the
audit trail, and a future hash chain over accepted changesets must be able to
cover all of it. This holds until tamper-evidence is decided, before the first
consumer app that makes audit claims ([ADR-0022](0022-identity-and-organization-isolation.md)).
Device compaction is unaffected.

Analytics is a projection to Parquet or DuckLake queried by DuckDB. DuckDB is
never the durable log. Effect v4 has no DuckDB `SqlClient`.

**Left out on purpose** (amendment 2026-10-08, [D118 What a datom needs from storage][D118], [I52 The datom and its store][I52]). The contract above
is what a datom needs from storage. Three things vivief asks of a datom store
are not in it: provenance on the transaction (the origin is in the envelope,
[D58' Envelope names the origin][D58'], [D115 Origin trust][D115]); the schema stored as datoms (the Schema is code, [D8 Effect everywhere][D8], [D44 Never rename, never migrate][D44]); and a
read as of a `tx` (deferred to [I63 The columnar copy as a Presenter implementation][I63], the columnar copy). Queries and live
delivery go through the Presenter ([D107 The Presenter pattern][D107]-[D109 Frame and frame subscription][D109], [ADR-0033 The Presenter pattern][ADR-0033]), never to the `datoms`
table, so the log is never filtered by value and `v` stays text.

**Typed read models** (amendment 2026-10-08, [D121 Attribute value types][D121], [I52 The datom and its store][I52]). The typed read-model
tables above were not built: [P05 Changesets and projections][P05] qualified the generic
`projected_facts`, which keeps `v` as text, because every exemplar value is
text or a reference. Every attribute gets a value Schema in the catalog, each
implementation maps it to its column type, and the reference read model gets
typed columns derived from the catalog; the layout (one table per entity type,
or one table for all with an `entity_type` column under a checked cap below
Postgres's 1600 columns) is [I66 Attribute value types and the typed reference read model][I66]'s.

**The layout** (amendment 2026-10-30, [D210 The row store and the columnar copy differ][D210], [I66 Attribute value types and the typed reference read model][I66]).
The reference read model keeps one table per entity type. One table for all
types was measured and costs a row store a header byte per column, empty or
not; the wide table per organization belongs to the columnar copy ([I63 The columnar copy as a Presenter implementation][I63]).
The value Schema is a plain Effect Schema ([D209 The value is an Effect Schema][D209]), and a typed row
names the attributes in conflict ([D211 A typed row while an attribute is in conflict][D211]).

## Trade-offs

Several implementations, one suite, avoids lock-in. Incremental projection is
more code than full re-projection (web-interview's 4.6s at 4000 datoms is why).
History consolidation on a full-org replica is later than [P09 Sync][P09].

## Failure-handling

[P04 Log store conformance][P04]: store contract including compaction horizon. [P05 Changesets and projections][P05]: full rebuild equals
incremental. Each implementation is qualified by running the suite.

## Outcome

### Expected

Swapping a store is a Layer line in an app. Read models can be dropped and
rebuilt.

### Observed

2026-09-20. [P04 Log store conformance][P04] ledger pass
`2026-09-20T19-30-57.292Z-6aa3906d`. One `LogStore` over `SqlClient` on
`sqliteNative`, `sqliteWasm`, `sqliteNode` and `postgres` (PGlite in the probe).
Pinned tables: `datoms`, `changesets`, `hlc_state`, `device_cursors`. Compaction
horizon held. Evidence: [2026-09-20-p04.md](../evidence/2026-09-20-p04.md).

2026-09-20. [P05 Changesets and projections][P05] ledger pass
`2026-09-20T19-57-57.045Z-1dba2339`. Disposable read models
(`projected_facts`, `projection_conflicts`, `changeset_status`,
`projection_cursor`) rebuilt from the log equalled the incremental snapshot on
the same five stores. Evidence:
[2026-09-20-p05.md](../evidence/2026-09-20-p05.md).

2026-09-26, after [P10 Trace projection][P10]. The compaction horizon covers every consumer that
must see facts before they go: a device, or a trace sink registered as
`trace/<sink>` in `device_cursors` (name unchanged). `compact()` reports
`heldBy`, the consumer that sets the horizon, so a sink that stays down is
named instead of losing spans. `acknowledged(consumer)` reads an acknowledged cursor back,
and `streamFrom(cursor, limit)` bounds a read. The [P04 Log store conformance][P04] checks "cursor
streaming" and "compaction horizon" assert both; [P04][P04] re-runs at foundation
closure.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0023]: 0023-data-at-rest-and-crypto-shredding.md
[ADR-0033]: 0033-the-presenter-pattern.md
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D118]: ../plan/bootstrap/02-decision-log.md#d118
[D119]: ../plan/bootstrap/02-decision-log.md#d119
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D209]: ../plan/bootstrap/02-decision-log.md#d209
[D210]: ../plan/bootstrap/02-decision-log.md#d210
[D211]: ../plan/bootstrap/02-decision-log.md#d211
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D58]: ../plan/bootstrap/02-decision-log.md#d58
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[D8]: ../plan/bootstrap/02-decision-log.md#d8
[I52]: ../issues/0052-the-datom-and-its-store.md
[I63]: ../issues/0063-the-columnar-copy.md
[I66]: ../issues/0066-attribute-value-types.md
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
