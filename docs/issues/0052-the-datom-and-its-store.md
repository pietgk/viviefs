# I52: The datom and its store

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47]

Found: 2026-10-07

## What

Is the log store contract ViViEfs's statement of what a datom needs from storage, and are vivief's provenance on the transaction, typed value columns and a read as of a `tx` left out on purpose? With it: ids and the clock (the HLC `tx` against vivief's ULIDs, hierarchical entity ids against flat ones, ids for other external identifiers) and the platform choices that sit beside the store.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (19): `vivief:datom`, `viviefs:one-datom-log`, `vivief:datom-store-needs`, `vivief:effect-store`, `vivief:typed-value-columns`, `vivief:ulid-identity`, `viviefs:hybrid-logical-clock`, `viviefs:entity-ids-and-strict-composition`, `viviefs:defining-attribute`, `vivief:artifact`, `vivief:scoped-name-entity-ids`, `vivief:external-identity-as-datoms`, `viviefs:acknowledged-cursor-and-compaction`, `viviefs:sqlite-drivers`, `viviefs:server-on-node`, `viviefs:expo-platform-baseline`, `viviefs:typescript-toolchain`, `vivief:second-language-for-a-measured-gap`, `vivief:final-protocol-from-day-one`.

## Answer

Decided with the human on 2026-10-08, from [the review page](../research/2026-10-08-datom-and-store-review.html) and in conversation. The log store contract is what a datom needs from storage; vivief's provenance (the origin, [D58' Envelope names the origin][D58']), its queries (the Presenter) and its read as of a `tx` ([I63 The columnar copy as a Presenter implementation][I63]) were settled by [I49 Projection: one concept or several patterns][I49], and its schema as datoms is rejected ([D118 What a datom needs from storage][D118]). `tx` stays a hybrid logical clock, now worded for whichever `node` holds authority ([D119 Time corrected by authority][D119]). Entity ids keep their path; each segment is minted by the HLC's encoder or derived from what identifies the thing ([D120 Minted and derived id segments][D120]). Every attribute carries a value Schema in the catalog so each implementation gets a real column type, and the reference read model gets typed columns; checking this found that the type was declared nowhere and the one read model keeps `v` as text ([D121 Attribute value types][D121]). An external identifier is an ordinary attribute, with a declared uniqueness per ViViEfs organization checked on accept ([D122 External identifiers][D122]). A final choice is the pattern, its contract and conformance check, with the human's note that its implementations stay free ([D123 The final choice is the pattern][D123]). The decisions are [D118-D123 The datom and its store][D118-D123]; [ADR-0007 Hybrid logical clock for tx][ADR-0007], [ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010] and [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] are amended and [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] links them. The glossary gains Derived id and External identifier, and Attribute, HLC and Entity-keyed id are reworded.

| Row | Disposition |
| --- | --- |
| `vivief:datom-store-needs` | keep ours: the log store contract ([D118 What a datom needs from storage][D118]); provenance as the origin in the envelope ([D58' Envelope names the origin][D58'], [D115 Origin trust][D115]), queries and live delivery through the Presenter ([D107 The Presenter pattern][D107]-[D109 Frame and frame subscription][D109]), a read as of a `tx` deferred, `Decide when:` [I63 The columnar copy as a Presenter implementation][I63]; schema as datoms rejected |
| `vivief:ulid-identity` | keep ours for `tx` ([D119 Time corrected by authority][D119]); adopt "any peer mints offline" for entity id segments, minted by the HLC's encoder ([D120 Minted and derived id segments][D120]) |
| `viviefs:hybrid-logical-clock` | stands, worded for the `node` holding authority ([D119 Time corrected by authority][D119]) |
| `viviefs:entity-ids-and-strict-composition` | stands, with minted or derived segments ([D120 Minted and derived id segments][D120]) |
| `vivief:typed-value-columns` | keep ours: `v` stays text in the log; value Schemas in the catalog, typed columns in the reference read model, layout to [I66 Attribute value types and the typed reference read model][I66] with [I63 The columnar copy as a Presenter implementation][I63] ([D121 Attribute value types][D121]) |
| `vivief:external-identity-as-datoms` | adopt as ordinary attributes, `unique: 'per-organization'` checked on accept, personal ones encrypted per subject with the blind index deferred on [I54 Trust, encryption and who may sign in][I54] ([D122 External identifiers][D122]) |
| `vivief:final-protocol-from-day-one` | stands: the final choice is the pattern; implementations stay free ([D123 The final choice is the pattern][D123]) |
| `vivief:scoped-name-entity-ids` | hand to map 5 ([I25 Ideas batch: understanding and maintaining code bases][I25]), with the derived-id rule ([D120 Minted and derived id segments][D120]) |
| `vivief:effect-store` | keep ours: the log is mandatory and single ([D31 One datom log][D31]) |
| `vivief:datom` | stands |
| `viviefs:one-datom-log` | stands |
| `viviefs:defining-attribute` | stands |
| `vivief:artifact` | stands |
| `viviefs:acknowledged-cursor-and-compaction` | stands; the never-compacted log is the authority's ([D119 Time corrected by authority][D119]) |
| `viviefs:sqlite-drivers` | stands |
| `viviefs:server-on-node` | stands; no gate of its own until [I7 Production hosting, deployment and telemetry backend][I7] |
| `viviefs:expo-platform-baseline` | stands; the Schedule's Expo SDK 58 trigger made precise (`latest` with a stable RN 0.88) |
| `viviefs:typescript-toolchain` | stands |
| `vivief:second-language-for-a-measured-gap` | stands |

- **Consequences:** [I66 Attribute value types and the typed reference read model][I66] (attribute value types and the typed reference read model), [I67 Minting entity id segments][I67] (minting entity id segments), [I68 Uniqueness as an acceptance rule][I68] (uniqueness as an acceptance rule); comments on [I19 Datom op stored as text][I19], [I25 Ideas batch: understanding and maintaining code bases][I25], [I54 Trust, encryption and who may sign in][I54] (the blind index), [I60 Server-independent mode][I60] and [I63 The columnar copy as a Presenter implementation][I63]; the Schedule's Expo entry.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0007]: ../adr/0007-hybrid-logical-clock.md
[ADR-0010]: ../adr/0010-entity-ids-and-defining-attributes.md
[ADR-0011]: ../adr/0011-log-store-pattern.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D118]: ../plan/bootstrap/02-decision-log.md#d118
[D118-D123]: ../plan/bootstrap/02-decision-log.md#d118-d123
[D119]: ../plan/bootstrap/02-decision-log.md#d119
[D120]: ../plan/bootstrap/02-decision-log.md#d120
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D122]: ../plan/bootstrap/02-decision-log.md#d122
[D123]: ../plan/bootstrap/02-decision-log.md#d123
[D31]: ../plan/bootstrap/02-decision-log.md#d31
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I19]: 0019-datom-op-as-text.md
[I25]: 0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I47]: 0047-what-viviefs-is-about.md
[I49]: 0049-projection-one-concept-or-several-patterns.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I60]: 0060-server-independent-mode.md
[I63]: 0063-the-columnar-copy.md
[I66]: 0066-attribute-value-types.md
[I67]: 0067-minting-entity-id-segments.md
[I68]: 0068-uniqueness-as-an-acceptance-rule.md
[I7]: 0007-production-hosting-and-telemetry-backend.md
