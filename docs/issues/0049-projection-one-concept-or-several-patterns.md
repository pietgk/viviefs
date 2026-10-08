# I49: Projection: one concept or several patterns

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Does ViViEfs name one concept over its read models, the projector, query atoms and delivery, as vivief's `Projection` does for query, access, encryption, delivery, freshness and trust scope, or keep several patterns? With it: whether a read carries a filter that is also what a replica downloads, whether a read as of a `tx` belongs in the log store contract, and which shapes beyond relational read models and the analytics projection the stack names.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (17): `vivief:projection`, `vivief:projection-delivery`, `vivief:projection-needs`, `vivief:freshness`, `vivief:one-query-model`, `vivief:layered-query-architecture`, `vivief:virtual-projection-shapes`, `viviefs:read-model-and-projector`, `vivief:differential-dataflow`, `vivief:cold-tier-indexing`, `vivief:temperature-tiers`, `vivief:sql-first-queries`, `viviefs:analytics-as-projection`, `vivief:redaction`, `vivief:derived-never-authoritative`, `vivief:datom-indexes`, `vivief:subscription-as-replication-filter`.

## Answer

Decided with the human on 2026-10-08, from [the review page](../research/2026-10-07-projection-review.html) and in conversation; the human reframed the question twice, from vivief's `Projection` to a Presenter and then to a pattern whose implementations improve over time. A screen asks a **Presenter** for data with a query written as data and keeps a **frame subscription** to the **frame** it returns; reads never write. The **reference implementation** (SQLite read models with query atoms) is what every other implementation is checked against; implementations are **faster** (same answer, sooner) or **enriching** (outside sources and models, written to the log as ordinary changesets naming their **origin** before anything presents them). Trust belongs to an origin (**origin trust**), is derived when read, follows lineage and can be withdrawn from an origin at once. "Projection" keeps its ViViEfs meaning, deriving a store from the log. The decisions are D107-D117 and D58'; [ADR-0033](../adr/0033-the-presenter-pattern.md) and [ADR-0034](../adr/0034-origin-trust.md) state them, and ADR-0032 links both. The glossary gains Presenter, Frame, Frame subscription, Reference implementation, Enrichment, Origin, Origin trust and Trust level; Frame and Origin link on the docs site only when capitalised, because both are everyday words there.

| Row | Disposition |
| --- | --- |
| `vivief:projection` | adopt its read side as the Presenter pattern (D107), trust through origin trust (D115); access and encryption stay at their boundaries (I54) |
| `vivief:projection-delivery` | adopt snapshot and live as a one-off read and a frame subscription (D109); live-persistent keep ours (cursor consumers; durability sits with the gathering activity); replay and `asOf` defer, `Decide when:` I63 |
| `vivief:projection-needs` | adopt query, frame subscription and trust filtering (D107, D115); access and encryption are I54's |
| `vivief:freshness` | keep ours (committed, draft) plus the frame's status; in-flight deferred, `Decide when:` a screen needs output finer than a committed batch (D109) |
| `vivief:one-query-model` | adopt for reads (D108); not for access scope or invariants (I50, I54) |
| `vivief:layered-query-architecture` | adopt in part: L1's idea and entity operations are D108; L1's in-memory engine, L2 and L3 are implementations behind one contract, SQLite the reference and today's default (D110) |
| `vivief:virtual-projection-shapes` | adopt as implementations, built when a consumer app needs them (D111) |
| `viviefs:read-model-and-projector` | keep ours: what the reference implementation reads (D110) |
| `vivief:differential-dataflow` | keep ours for the reference (incremental projection, then the query again); incremental answer maintenance is a candidate faster implementation, `Decide when:` I63; no assert/retract cancelling on the server log (ADR-0011) |
| `vivief:cold-tier-indexing` | defer, `Decide when:` I63 |
| `vivief:temperature-tiers` | defer, `Decide when:` I63; a replica is durable state, not a cache |
| `vivief:sql-first-queries` | stands: SQL inside implementations |
| `viviefs:analytics-as-projection` | stands (D37), now one faster implementation over the columnar copy; DuckLake to I63, erasure to I54 |
| `vivief:redaction` | defer, `Decide when:` an app has an attribute something computes on that no screen may show; noted on I54 |
| `vivief:derived-never-authoritative` | stands, extended to intermediate presentations (D112) |
| `vivief:datom-indexes` | stands |
| `vivief:subscription-as-replication-filter` | adopt as direction: partial sync on demand (D114), under I12's new trigger with I53 |

- **Also settled** (map 6 rows, noted on I34): `vivief:provenance` and `vivief:trust-strategies`, adopted as origin trust and commit paths (D115-D117); the actor category for agents stays with I51.
- **Consequences:** [I62](0062-presenter-conformance-gate.md) (the Presenter conformance gate), [I63](0063-the-columnar-copy.md) (the columnar copy, carrying the human's one-wide-table design), [I64](0064-build-origin-trust.md) (build origin trust); comments on I12 (new trigger), I15, I16, I31, I34, I51, I53 and I54.

## Comments
