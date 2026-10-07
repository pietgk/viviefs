# I52: The datom and its store

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Is the log store contract ViViEfs's statement of what a datom needs from storage, and are vivief's provenance on the transaction, typed value columns and a read as of a `tx` left out on purpose? With it: ids and the clock (the HLC `tx` against vivief's ULIDs, hierarchical entity ids against flat ones, ids for other external identifiers) and the platform choices that sit beside the store.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (19): `vivief:datom`, `viviefs:one-datom-log`, `vivief:datom-store-needs`, `vivief:effect-store`, `vivief:typed-value-columns`, `vivief:ulid-identity`, `viviefs:hybrid-logical-clock`, `viviefs:entity-ids-and-strict-composition`, `viviefs:defining-attribute`, `vivief:artifact`, `vivief:scoped-name-entity-ids`, `vivief:external-identity-as-datoms`, `viviefs:acknowledged-cursor-and-compaction`, `viviefs:sqlite-drivers`, `viviefs:server-on-node`, `viviefs:expo-platform-baseline`, `viviefs:typescript-toolchain`, `vivief:second-language-for-a-measured-gap`, `vivief:final-protocol-from-day-one`.

## Comments
