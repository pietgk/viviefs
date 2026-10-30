# I66: Attribute value types and the typed reference read model

Status: resolved

Category: enhancement

Decide when: before the first attribute that is neither text nor a reference, at the latest the app shell ([P12 UI on every platform][P12], [P13 Links and routing][P13])

Found: 2026-10-08

## What

An attribute's type is declared nowhere a machine can read it: `AttributeSpec` in `libs/datom/src/catalog.ts` has a name, a conflict policy, a defining flag and an authority, but no value Schema, and the one read model, `projected_facts` in `libs/datom/src/read-models.ts`, keeps `v` as text, so a quantity of 10 sorts before 9. Build [D121 Attribute value types][D121]: a value Schema per attribute in the catalog, each implementation's mapping to its column type, and a reference read model with typed columns derived from the catalog.

From [I52](0052-the-datom-and-its-store.md) ([D121 Attribute value types][D121]). The glossary already calls an attribute Schema-typed and [D37 Log store tables][D37] already promises typed read-model tables; [P05 Changesets and projections][P05] never needed a type because every exemplar value is text or a reference.

### What to build

1. **A value Schema per attribute** in the catalog, fixed when the attribute ships ([D44 Never rename, never migrate][D44]). `v` in the log stays text: the Schema's one canonical encoding.
2. **A mapping per implementation** from the Schema to a column type, over `Schema.toRepresentation` ([D209 The value is an Effect Schema][D209]): SQLite, Postgres, and Arrow for the columnar side.
3. **The typed reference read model**: typed columns derived from the catalog, rebuilt when an attribute is added, never migrated ([D44 Never rename, never migrate][D44]); it replaces `projected_facts` as what queries read ([D108 The query is data][D108], [D110 The reference implementation][D110]). The defining attribute and the projection rule ([ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010]) decide visibility as today.
4. **Re-run** [P05 Changesets and projections][P05] and [P08 UI three-way prototype][P08] on it.

### The human's challenge (2026-10-29)

- **The log stays one table with a text `v`.** No table per value type and no value-type column on the datom table: either would exist only to give `v` a different SQL column type, and the log does not need one. This keeps [D121 Attribute value types][D121]'s "vivief's typed value columns are not adopted".
- **Sorting the log by value is not a proven need.** The case for typed `v` was "a quantity of 10 sorts before 9"; that holds for a read model a query reads, not for the log, which is never filtered by value ([ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011]). No requirement so far sorts or filters the `datoms` table by `v`.
- **The type lives in the attribute's Schema, in code.** A Schema per attribute in the catalog says the type once, so a column saying it again on every datom adds nothing. The Schema carries more than the type: a description, a range, and whether the attribute is required, so it is needed either way. The range and the required flag are acceptance rules ([D125 Acceptance rules][D125]) that [I69 Accept checks every change][I69] runs.
- **The read model is where types land.** A read model is already column per attribute, so each column takes its SQL type from the Schema (item 2 above applies to read models and the columnar copy, never to the log).
- **A column store per organization is a serious option.** Mapping an organization's attributes to one columnar table of entity rows with an entity type, typed from the catalog (Parquet, DuckLake), is [I63 The columnar copy as a Presenter implementation][I63]'s wide table per organization; it is a candidate for the reference read model too, below.
- **Typed SQL on the log is a last resort.** If an attribute ever needs a typed SQL column against the log, try an index first: an index on an expression, partial on that attribute (`CAST(v AS INTEGER) WHERE a = '...'`, which SQLite and Postgres both support), before any change to the datom table. Investigate this only when a measured query needs it.

### Decided: the layout

One table per entity type, [D37 Log store tables][D37] as written ([D210 The row store and the columnar copy differ][D210]). A typed row while an attribute is in conflict is [D211 A typed row while an attribute is in conflict][D211]; required comes with [I69 Accept checks every change][I69] ([D212 Required comes with its check][D212]). The measurements and the options not chosen are on [the review page](../research/2026-10-29-attribute-value-types-review.html).

## Comments

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md): the value Schema is an acceptance rule ([D125 Acceptance rules][D125]); it plugs into the rule runner [I69 Accept checks every change][I69] builds, judged no worse ([D126 No worse][D126]). `renameList`'s blank title moves into the value rule of `evidence/list-title` as [I69][I69]'s first positive control.

2026-10-29: the human, before the build: the log keeps one table and a text `v`, with no table or column per value type, and typed SQL on the log is a last resort through an expression index; the attribute's Schema carries the type, a description, a range and whether it is required; a columnar table per organization is a third layout to measure. See "The human's challenge" above.

2026-10-30: decided with the human, from [the review page](../research/2026-10-29-attribute-value-types-review.html): [D209 The value is an Effect Schema][D209]-[D212 Required comes with its check][D212]. The challenge's column store per organization was measured: it holds in a columnar engine and not in a row store, so it stays [I63 The columnar copy as a Presenter implementation][I63]'s. The build is test first.

2026-10-30: Built test first. `libs/datom/src/values.ts` holds the text and column forms of a value, `libs/datom/src/typed-rows.ts` the tables (`rm_<entity type>`), and `Projector.rows` reads them, committed or draft. `changesets/conformance` gains seven checks ([P05 Changesets and projections][P05] goes from 14 to 21). Left to the Presenter: filters and limits (a query today has a prefix and an `orderBy`) and rows typed at compile time (`values` is a record of decoded values, and the `Schema.Struct` per entity type on the review page is not built). `projected_facts` stays as the fact versions the projector reduces. The projector still reads every fact per run, so [D210 The row store and the columnar copy differ][D210]'s measured tables say nothing yet about projecting at that volume. A changed catalog replays the log when the projector starts.

2026-10-30: Resolved. [P05 Changesets and projections][P05] passes its 21 checks on `sqlite-node`, Postgres (PGlite), iOS, Android and web, and [P08 UI three-way prototype][P08] passes, both in the ledger on `f2c0f0586`. That commit's message says 20 checks; it is 21. [P01 Platform on SDK 58][P01]-[P11 Identity][P11] then pass in one sequential run on `241635670`, clean tree. The Hermes run of `Schema.toRepresentation` and the typed tables is [P05][P05]'s iOS and Android runs.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0010]: ../adr/0010-entity-ids-and-defining-attributes.md
[ADR-0011]: ../adr/0011-log-store-pattern.md
[D108]: ../plan/bootstrap/02-decision-log.md#d108
[D110]: ../plan/bootstrap/02-decision-log.md#d110
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D126]: ../plan/bootstrap/02-decision-log.md#d126
[D209]: ../plan/bootstrap/02-decision-log.md#d209
[D210]: ../plan/bootstrap/02-decision-log.md#d210
[D211]: ../plan/bootstrap/02-decision-log.md#d211
[D212]: ../plan/bootstrap/02-decision-log.md#d212
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I63]: 0063-the-columnar-copy.md
[I69]: 0069-accept-checks-every-change.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
