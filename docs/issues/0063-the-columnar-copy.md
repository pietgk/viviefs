# I63: The columnar copy as a Presenter implementation

Status: ready-for-human

Category: enhancement

Decide when: a Presenter's measured read misses its budget, or an organization's log passes a stated volume

Found: 2026-10-08

## What

A log store can grow very large; a derived, delayed columnar copy of it in Parquet would let a faster Presenter implementation ([D111 Faster and enriching implementations][D111]) read it with DuckDB or Polars, together with the log store's recent tail. Decide its shape, budget and gate when it is needed.

From [I49](0049-projection-one-concept-or-several-patterns.md) ([D110 The reference implementation][D110]-[D112 Intermediate presentations][D112], [ADR-0033](../adr/0033-the-presenter-pattern.md)). Decided already: the copy is derived from an acknowledged cursor and rebuildable, never a tier of the durable log ([D37 Log store tables][D37], [D112][D112]); a Presenter reads Parquet up to `tx` N and the tail after N.

### Notes from the I49 grilling (2026-10-08)

- **One wide table per organization** (the human's design): one column per attribute, typed from the catalog. Attribute names are globally unique and never renamed or retyped, and each attribute belongs to one entity type (`indexCatalog` in `libs/datom/src/catalog.ts`), so the union schema is the catalog itself. Parquet stores the sparse nulls almost for free and reads only the named columns; an added attribute is a new column, older files read it as null (DuckDB `union_by_name`), as [D44 Never rename, never migrate][D44]'s "rebuilt, never migrated" wants. One compaction job merges small files into big ones.
- **Conditions:** compaction sorts by entity type, then entity id, so row-group statistics skip other types; files are partitioned by organization ([D18 Organization isolation on the server][D18]); a view per entity type gives Presenters their typed frames; personal values stay ciphertext ([ADR-0023 Data at rest and crypto-shredding][ADR-0023]).
- **Row versions:** Parquet is immutable, so a change appends a row version carrying its `tx`. If compaction keeps every version, a read as of a past `tx` is the latest version at or before it (vivief's `asOf` and replay; `vivief:projection-delivery`).
- **The claim to qualify:** Parquet up to N plus the tail equals a full read.
- **Volume:** 10M datoms per organization as the lab planning volume ([D101 Lab and production][D101]), a number to correct with a consumer app's own.
- **Width:** Parquet's footer holds metadata per column per row group; revisit when a measured column count makes footer reads show in the gate, falling back to one wide table per attribute namespace (one per consumer app, [D106 Consumer app shape][D106]).
- **Also here:** where a DuckLake catalog would live and how its snapshots expire (`viviefs:analytics-as-projection`); a cold index and its rebuild budget (`vivief:cold-tier-indexing`, `vivief:temperature-tiers`); incremental answer maintenance (`D2TS`, differential dataflow) when a frame subscription's rerun misses its budget (`vivief:differential-dataflow`).

## Comments

2026-10-08: [I52](0052-the-datom-and-its-store.md) decides that every attribute carries a value Schema in the catalog, mapped by each implementation to its column type ([D121 Attribute value types][D121]), which the wide table's "typed from the catalog" needs. The reference read model faces the same layout choice, one table per entity type or one table for all types under a checked cap below Postgres's 1600 columns; [I66 Attribute value types and the typed reference read model][I66] decides it by measurement together with this issue, so both make the same choice. `vivief:datom-store-needs`'s read as of a `tx` stays deferred here ([D118 What a datom needs from storage][D118]).

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md): re-running a command on accept is deferred until an app needs proof that a changeset is exactly what its command makes, and needs a read as of a log position so authority can re-run it on the data the device saw ([D127 Registered commands][D127]).

2026-10-09: [I31 Ideas batch: DataFrames as a universal data format][I31] Ideas batch: DataFrames as a universal data format is merged here. Its remaining questions are this issue's: which DataFrame engines (DuckDB, Polars, Arrow) run on which sync node (native app, browser, server), and whether Arrow works on Hermes; its sources (Pinot, DuckDB, Polars, Arrow) stay in [I31][I31].

2026-10-29: [I66 Attribute value types and the typed reference read model][I66]: the human names this issue's wide table per organization (entity rows with an entity type, typed from the catalog) a serious option for the reference read model too, so it is the third layout [I66][I66] measures. The log keeps a text `v` either way.

2026-10-30: [I66 Attribute value types and the typed reference read model][I66] measured and decided: the reference keeps one table per entity type and this issue keeps its wide table per organization, in a columnar engine ([D210 The row store and the columnar copy differ][D210]), so the two no longer make the same choice. This issue's column types are Arrow's ([D209 The value is an Effect Schema][D209]).

2026-10-30: DuckDB on a device, from [the review page](../research/2026-10-29-attribute-value-types-review.html). The human's fork of `react-native-duckdb` (`pietgk/react-native-duckdb`, on DuckDB 1.4.5 and React Native 0.82.1) passes its suite on the iOS simulator and the Android emulator, not yet on a physical device; DuckDB 2.0 and Expo SDK 58 are work in progress and may not succeed. Unlike Polars, DuckDB is a database with a durable file. A wide table at 10M datoms on one Mac, with `@duckdb/node-api` 2.0.0-r.1: 159 MB at 400 attributes and 162 MB at 1500, so the file does not grow with the catalog. Reading by id takes 1.3 ms and 3.1 ms, 50 sorted children 7.7 ms and 17.2 ms, and updating a row 2.6 ms and 7.7 ms, against 25 µs, 150 µs and 63 µs in the SQLite tables at 400 attributes. Grouping one type's 62,500 rows takes 2.5 ms against 4.6 ms; a query over a whole organization was not measured. Open here: a run on a physical device, the size a linked app ships (the static archive is 101 MB with the example's eight extensions), and reading the read model directly through the `sqlite_scanner` extension with no copy at all. Polars on a device is out for now: no official build, no store, and a new binding to write and keep up with Polars' releases.

2026-10-30: TanStack DB, from [the review page](../research/2026-10-29-attribute-value-types-review.html). 1.0 RC1 was announced on 2026-10-29, though its README and docs still say beta; MIT. It is a candidate for this issue's "incremental answer maintenance": its live queries are `d2ts`, the `D2TS` this issue and [D110 The reference implementation][D110] name. A custom collection per entity type has a `sync` function that gets `begin`, `write`, `commit` and `markReady`, so the source behind it can be the read model, DuckDB on a device or another sync node; a frame from another sync node has the status `remote` ([D109 Frame and frame subscription][D109]), and what is kept for offline use still lands in the local log ([D114 Partial sync on demand][D114]). Conditions if it is adopted: reads only, with no `onInsert`, because its optimistic writes would be a second write path beside commands and the log, and a second draft view; on-demand collections, because a collection lives in the JavaScript heap; a run on Hermes first, because its docs do not mention Hermes; and as a declared Presenter implementation beside query atoms ([D113 Who chooses the implementation][D113], [D42 Live reads with query atoms][D42]), when a frame subscription's rerun misses its budget. Not confirmed: whether its `schema` option takes a Standard Schema, which Effect can give (`Schema.toStandardSchemaV1`).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0023]: ../adr/0023-data-at-rest-and-crypto-shredding.md
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D106]: ../plan/bootstrap/02-decision-log.md#d106
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D110]: ../plan/bootstrap/02-decision-log.md#d110
[D111]: ../plan/bootstrap/02-decision-log.md#d111
[D112]: ../plan/bootstrap/02-decision-log.md#d112
[D113]: ../plan/bootstrap/02-decision-log.md#d113
[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D118]: ../plan/bootstrap/02-decision-log.md#d118
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D127]: ../plan/bootstrap/02-decision-log.md#d127
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[D209]: ../plan/bootstrap/02-decision-log.md#d209
[D210]: ../plan/bootstrap/02-decision-log.md#d210
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D42]: ../plan/bootstrap/02-decision-log.md#d42
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I31]: 0031-ideas-batch-dataframes-as-a-universal-data-format.md
[I66]: 0066-attribute-value-types.md
