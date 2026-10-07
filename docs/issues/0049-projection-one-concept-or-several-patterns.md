# I49: Projection: one concept or several patterns

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Does ViViEfs name one concept over its read models, the projector, query atoms and delivery, as vivief's `Projection` does for query, access, encryption, delivery, freshness and trust scope, or keep several patterns? With it: whether a read carries a filter that is also what a replica downloads, whether a read as of a `tx` belongs in the log store contract, and which shapes beyond relational read models and the analytics projection the stack names.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (17): `vivief:projection`, `vivief:projection-delivery`, `vivief:projection-needs`, `vivief:freshness`, `vivief:one-query-model`, `vivief:layered-query-architecture`, `vivief:virtual-projection-shapes`, `viviefs:read-model-and-projector`, `vivief:differential-dataflow`, `vivief:cold-tier-indexing`, `vivief:temperature-tiers`, `vivief:sql-first-queries`, `viviefs:analytics-as-projection`, `vivief:redaction`, `vivief:derived-never-authoritative`, `vivief:datom-indexes`, `vivief:subscription-as-replication-filter`.

## Comments
