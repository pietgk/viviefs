# I63: The columnar copy as a Presenter implementation

Status: ready-for-human

Category: enhancement

Decide when: a Presenter's measured read misses its budget, or an organization's log passes a stated volume

Found: 2026-10-08

## What

A log store can grow very large; a derived, delayed columnar copy of it in Parquet would let a faster Presenter implementation (D111) read it with DuckDB or Polars, together with the log store's recent tail. Decide its shape, budget and gate when it is needed.

From [I49](0049-projection-one-concept-or-several-patterns.md) (D110-D112, [ADR-0033](../adr/0033-the-presenter-pattern.md)). Decided already: the copy is derived from a cursor and rebuildable, never a tier of the durable log (D37, D112); a Presenter reads Parquet up to `tx` N and the tail after N.

### Notes from the I49 grilling (2026-10-08)

- **One wide table per organization** (the human's design): one column per attribute, typed from the catalog. Attribute names are globally unique and never renamed or retyped, and each attribute belongs to one entity type (`indexCatalog` in `libs/datom/src/catalog.ts`), so the union schema is the catalog itself. Parquet stores the sparse nulls almost for free and reads only the named columns; an added attribute is a new column, older files read it as null (DuckDB `union_by_name`), as D44's "rebuilt, never migrated" wants. One compaction job merges small files into big ones.
- **Conditions:** compaction sorts by entity type, then entity id, so row-group statistics skip other types; files are partitioned by organization (D18); a view per entity type gives Presenters their typed frames; personal values stay ciphertext (ADR-0023).
- **Row versions:** Parquet is immutable, so a change appends a row version carrying its `tx`. If compaction keeps every version, a read as of a past `tx` is the latest version at or before it (vivief's `asOf` and replay; `vivief:projection-delivery`).
- **The claim to qualify:** Parquet up to N plus the tail equals a full read.
- **Volume:** 10M datoms per organization as the lab planning volume (D101), a number to correct with a consumer app's own.
- **Width:** Parquet's footer holds metadata per column per row group; revisit when a measured column count makes footer reads show in the gate, falling back to one wide table per attribute namespace (one per consumer app, D106).
- **Also here:** where a DuckLake catalog would live and how its snapshots expire (`viviefs:analytics-as-projection`); a cold index and its rebuild budget (`vivief:cold-tier-indexing`, `vivief:temperature-tiers`); incremental answer maintenance (`D2TS`, differential dataflow) when a frame subscription's rerun misses its budget (`vivief:differential-dataflow`).

## Comments

2026-10-08: [I52](0052-the-datom-and-its-store.md) decides that every attribute carries a value Schema in the catalog, mapped by each implementation to its column type (D121), which the wide table's "typed from the catalog" needs. The reference read model faces the same layout choice, one table per entity type or one table for all types under a checked cap below Postgres's 1600 columns; I66 decides it by measurement together with this issue, so both make the same choice. `vivief:datom-store-needs`'s read as of a `tx` stays deferred here (D118).
