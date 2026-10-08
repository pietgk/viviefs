# I53: Sync and conflict

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47, I48

Found: 2026-10-07

## What

Is sync in the foundation a deliberate difference from vivief, which defers it until a single user is handled well, and should the foundation's story say why (device switching, server authority)? With it: whether an attribute needs a cardinality, with many-valued attributes resolved as a set, whether text ever needs a CRDT beside last-writer-wins and human conflict, and whether server validation of every changeset is the stack's one trust strategy.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (5): `viviefs:sync-as-datom-replication`, `vivief:sync-contract`, `vivief:sync-after-core`, `viviefs:conflict-policy`, `viviefs:server-authoritative-validation`.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) hands over partial sync on demand (D114): when I12's new trigger fires, the sync details (what the server sends for a Presenter's query, cursors per query or per organization, what a partial `node` may accept) are decided here.
