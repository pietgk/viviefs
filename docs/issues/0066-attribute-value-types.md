# I66: Attribute value types and the typed reference read model

Status: ready-for-human

Category: enhancement

Decide when: before the first attribute that is neither text nor a reference, at the latest the app shell (P12, P13)

Found: 2026-10-08

## What

An attribute's type is declared nowhere a machine can read it: `AttributeSpec` in `libs/datom/src/catalog.ts` has a name, a conflict policy, a defining flag and an authority, but no value Schema, and the one read model, `projected_facts` in `libs/datom/src/read-models.ts`, keeps `v` as text, so a quantity of 10 sorts before 9. Build D121: a value Schema per attribute in the catalog, each implementation's mapping to its column type, and a reference read model with typed columns derived from the catalog.

From [I52](0052-the-datom-and-its-store.md) (D121). The glossary already calls an attribute Schema-typed and D37 already promises typed read-model tables; P05 never needed a type because every exemplar value is text or a reference.

### What to build

1. **A value Schema per attribute** in the catalog, fixed when the attribute ships (D44). `v` in the log stays text: the Schema's one canonical encoding.
2. **A mapping per implementation** from the Schema to a column type: SQLite `INTEGER`, Postgres `BIGINT`, DuckDB `BIGINT`, Parquet `INT64`, and the same for text, booleans, dates, references and bytes.
3. **The typed reference read model**: typed columns derived from the catalog, rebuilt when an attribute is added, never migrated (D44); it replaces `projected_facts` as what queries read (D108, D110). The defining attribute and the projection rule (ADR-0010) decide visibility as today.
4. **Re-run** P05 and P08 on it.

### Decide here: the layout

- **One table per entity type** (D37 as written).
- **One table for all types** with an `entity_type` column. Postgres allows at most 1600 columns per table, dropped ones included, and SQLite 2000 by default (`SQLITE_MAX_COLUMN`), so this caps the attributes per table; if chosen, the cap is a stated number below 1600, checked by `verify` on the catalog, and D37 is amended.

Decide by measurement together with I63's wide table, so the reference and the columnar copy make the same choice. Both layouts return the same frames, so D110's conformance check holds either way.

## Comments
