# ADR-0011: Log store pattern, read models, compaction and analytics

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P04, P05

Related: D37, D44. [Architecture section 8](../plan/bootstrap/03-architecture.md),
[ADR 0005](0005-sqlite-drivers.md), [ADR 0006](0006-one-datom-log.md).

## Problem

Device SQLite, Node SQLite and server Postgres must obey one contract, or every
projector and the engine forks. Read-model migrations on an append-only log
fight D44. Analytics on the durable log would couple query shape to durability.

## Design

The log store is a pattern with swappable implementations under one
conformance suite: `sqliteNative` (op-sqlite), `sqliteWasm` (OPFS),
`sqliteNode`, `postgres` (optionally `sqlcipher`, ADR 0023).

Indicative tables until P04, except D58's `changesets` table which is decided:

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

Analytics is a projection to Parquet or DuckLake queried by DuckDB. DuckDB is
never the durable log. Effect v4 has no DuckDB `SqlClient`.

## Trade-offs

Several implementations, one suite, avoids lock-in. Incremental projection is
more code than full re-projection (web-interview's 4.6s at 4000 datoms is why).
History consolidation on a full-org replica is later than P09.

## Failure-handling

P04: store contract including compaction horizon. P05: full rebuild equals
incremental. Each implementation is qualified by running the suite.

## Outcome

### Expected

Swapping a store is a Layer line in an app. Read models can be dropped and
rebuilt.

### Observed

Not yet run. Named-slot projects exist; mechanisms are empty until P04/P05.
