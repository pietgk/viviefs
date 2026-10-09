# I66: Attribute value types and the typed reference read model

Status: ready-for-human

Category: enhancement

Decide when: before the first attribute that is neither text nor a reference, at the latest the app shell ([P12 UI on every platform][P12], [P13 Links and routing][P13])

Found: 2026-10-08

## What

An attribute's type is declared nowhere a machine can read it: `AttributeSpec` in `libs/datom/src/catalog.ts` has a name, a conflict policy, a defining flag and an authority, but no value Schema, and the one read model, `projected_facts` in `libs/datom/src/read-models.ts`, keeps `v` as text, so a quantity of 10 sorts before 9. Build [D121 Attribute value types][D121]: a value Schema per attribute in the catalog, each implementation's mapping to its column type, and a reference read model with typed columns derived from the catalog.

From [I52](0052-the-datom-and-its-store.md) ([D121 Attribute value types][D121]). The glossary already calls an attribute Schema-typed and [D37 Log store tables][D37] already promises typed read-model tables; [P05 Changesets and projections][P05] never needed a type because every exemplar value is text or a reference.

### What to build

1. **A value Schema per attribute** in the catalog, fixed when the attribute ships ([D44 Never rename, never migrate][D44]). `v` in the log stays text: the Schema's one canonical encoding.
2. **A mapping per implementation** from the Schema to a column type: SQLite `INTEGER`, Postgres `BIGINT`, DuckDB `BIGINT`, Parquet `INT64`, and the same for text, booleans, dates, references and bytes.
3. **The typed reference read model**: typed columns derived from the catalog, rebuilt when an attribute is added, never migrated ([D44 Never rename, never migrate][D44]); it replaces `projected_facts` as what queries read ([D108 The query is data][D108], [D110 The reference implementation][D110]). The defining attribute and the projection rule ([ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010]) decide visibility as today.
4. **Re-run** [P05 Changesets and projections][P05] and [P08 UI three-way prototype][P08] on it.

### Decide here: the layout

- **One table per entity type** ([D37 Log store tables][D37] as written).
- **One table for all types** with an `entity_type` column. Postgres allows at most 1600 columns per table, dropped ones included, and SQLite 2000 by default (`SQLITE_MAX_COLUMN`), so this caps the attributes per table; if chosen, the cap is a stated number below 1600, checked by `verify` on the catalog, and [D37 Log store tables][D37] is amended.

Decide by measurement together with [I63 The columnar copy as a Presenter implementation][I63]'s wide table, so the reference and the columnar copy make the same choice. Both layouts return the same frames, so [D110 The reference implementation][D110]'s conformance check holds either way.

## Comments

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md): the value Schema is an acceptance rule ([D125 Acceptance rules][D125]); it plugs into the rule runner [I69 Accept checks every change][I69] builds, judged no worse ([D126 No worse][D126]). `renameList`'s blank title moves into the value rule of `evidence/list-title` as [I69][I69]'s first positive control.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0010]: ../adr/0010-entity-ids-and-defining-attributes.md
[D108]: ../plan/bootstrap/02-decision-log.md#d108
[D110]: ../plan/bootstrap/02-decision-log.md#d110
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D126]: ../plan/bootstrap/02-decision-log.md#d126
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I63]: 0063-the-columnar-copy.md
[I69]: 0069-accept-checks-every-change.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
