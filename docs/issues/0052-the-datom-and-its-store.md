# I52: The datom and its store

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Is the log store contract ViViEfs's statement of what a datom needs from storage, and are vivief's provenance on the transaction, typed value columns and a read as of a `tx` left out on purpose? With it: ids and the clock (the HLC `tx` against vivief's ULIDs, hierarchical entity ids against flat ones, ids for other external identifiers) and the platform choices that sit beside the store.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (19): `vivief:datom`, `viviefs:one-datom-log`, `vivief:datom-store-needs`, `vivief:effect-store`, `vivief:typed-value-columns`, `vivief:ulid-identity`, `viviefs:hybrid-logical-clock`, `viviefs:entity-ids-and-strict-composition`, `viviefs:defining-attribute`, `vivief:artifact`, `vivief:scoped-name-entity-ids`, `vivief:external-identity-as-datoms`, `viviefs:acknowledged-cursor-and-compaction`, `viviefs:sqlite-drivers`, `viviefs:server-on-node`, `viviefs:expo-platform-baseline`, `viviefs:typescript-toolchain`, `vivief:second-language-for-a-measured-gap`, `vivief:final-protocol-from-day-one`.

## Answer

Decided with the human on 2026-10-08, from [the review page](../research/2026-10-08-datom-and-store-review.html) and in conversation. The log store contract is what a datom needs from storage; vivief's provenance (the origin, D58'), its queries (the Presenter) and its read as of a `tx` (I63) were settled by I49, and its schema as datoms is rejected (D118). `tx` stays a hybrid logical clock, now worded for whichever `node` holds authority (D119). Entity ids keep their path; each segment is minted by the HLC's encoder or derived from what identifies the thing (D120). Every attribute carries a value Schema in the catalog so each implementation gets a real column type, and the reference read model gets typed columns; checking this found that the type was declared nowhere and the one read model keeps `v` as text (D121). An external identifier is an ordinary attribute, with a declared uniqueness per ViViEfs organization checked on accept (D122). A final choice is the pattern, its contract and conformance check, with the human's note that its implementations stay free (D123). The decisions are D118-D123; ADR-0007, ADR-0010 and ADR-0011 are amended and ADR-0032 links them. The glossary gains Derived id and External identifier, and Attribute, HLC and Entity-keyed id are reworded.

| Row | Disposition |
| --- | --- |
| `vivief:datom-store-needs` | keep ours: the log store contract (D118); provenance as the origin in the envelope (D58', D115), queries and live delivery through the Presenter (D107-D109), a read as of a `tx` deferred, `Decide when:` I63; schema as datoms rejected |
| `vivief:ulid-identity` | keep ours for `tx` (D119); adopt "any peer mints offline" for entity id segments, minted by the HLC's encoder (D120) |
| `viviefs:hybrid-logical-clock` | stands, worded for the `node` holding authority (D119) |
| `viviefs:entity-ids-and-strict-composition` | stands, with minted or derived segments (D120) |
| `vivief:typed-value-columns` | keep ours: `v` stays text in the log; value Schemas in the catalog, typed columns in the reference read model, layout to I66 with I63 (D121) |
| `vivief:external-identity-as-datoms` | adopt as ordinary attributes, `unique: 'per-organization'` checked on accept, personal ones encrypted per subject with the blind index deferred on I54 (D122) |
| `vivief:final-protocol-from-day-one` | stands: the final choice is the pattern; implementations stay free (D123) |
| `vivief:scoped-name-entity-ids` | hand to map 5 (I25), with the derived-id rule (D120) |
| `vivief:effect-store` | keep ours: the log is mandatory and single (D31) |
| `vivief:datom` | stands |
| `viviefs:one-datom-log` | stands |
| `viviefs:defining-attribute` | stands |
| `vivief:artifact` | stands |
| `viviefs:acknowledged-cursor-and-compaction` | stands; the never-compacted log is the authority's (D119) |
| `viviefs:sqlite-drivers` | stands |
| `viviefs:server-on-node` | stands; no gate of its own until I7 |
| `viviefs:expo-platform-baseline` | stands; the Schedule's Expo SDK 58 trigger made precise (`latest` with a stable RN 0.88) |
| `viviefs:typescript-toolchain` | stands |
| `vivief:second-language-for-a-measured-gap` | stands |

- **Consequences:** I66 (attribute value types and the typed reference read model), I67 (minting entity id segments), I68 (uniqueness as an acceptance rule); comments on I19, I25, I54 (the blind index), I60 and I63; the Schedule's Expo entry.

## Comments
