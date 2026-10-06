# I39: Inventory vivief's domain contracts

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: I35, I36

Found: 2026-10-05

Claimed: 2026-10-05

## What

Where do vivief's datom architecture and its domain contracts stand in ViViEfs, and which of them are product vision? Read, under `~/ws/vivief/docs/`, `contract/datom/` (`architecture.md`, `d2ts-operator-state.md`, `query-layers.md`), `contract/p2p/lean-stack-v2.md`, `contract/counseling/platform-v2.md` and `contract/procurement/` (with `mvp/`), about 4,400 lines. The datom files are close to ViViEfs's log store and sync; read them closely. For counseling, procurement and peer-to-peer, separate the reference-stack ideas they carry from the product vision. Peer-to-peer is `deferred`, not `rejected`, if the [2026-09-30 communication research](../research/2026-09-30-communication-architecture.md) still holds it as a hypothesis.

Write its rows file, `I39.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of I35 (vivief) and I36 (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[38 rows](../plan/vivief-inventory/rows/I39.md) and a coverage line for every source (by section for the datom architecture, the lean stack and the counseling platform): 6 `taken`, 20 `different`, 7 `missing`, 5 `deferred`, none `rejected`. 36 rows are reference stack and 2 product vision: the counseling platform and procurement intelligence. Neither has an app yet, but both are candidate consumer apps (I9 Comments): their product-specific decisions are out of scope (`01-vision-and-scope.md`), and what they need is proof that a pattern is useful. 20 ids are new; 18 refine an earlier row (7 from I35, 3 from I36, 7 from I40, 1 from I38), which I45 merges.

The stacks meet on the log and on keeping derived state out of it: one append-only log as the truth, d2ts's operator state measured (2.8 to 10.3 times a minimal store) and kept out of the store as ADR-0006 keeps read models and operational state out, text that settles before it becomes a datom, analytics as a projection read by DuckDB, Schema at every boundary, a second language only for a measured gap, erasure by crypto-shredding. They part in three places. On replication and authority: vivief replicates peer to peer over Iroh and MoQ with payload-blind relays and end-to-end encryption, while ViViEfs has one server sequence over Effect RPC and a server that reads every value. On where rules live: vivief keeps contracts, handler registrations, feature flags and open decisions as datoms read at run time, while ViViEfs keeps rules in commands and records decisions once, with a trigger. On evidence: vivief keeps contracts checking in production, while ViViEfs proves claims with `verify` and gates before delivery.

Peer-to-peer is `deferred`, not `rejected`: the [2026-09-30 communication research](../research/2026-09-30-communication-architecture.md) still calls a server-independent mode "a hypothesis to discuss and qualify" and says it "changes none" of the scope freeze. Its five rows (the log as a CRDT, nodes, MoQ and Iroh, payload-blind relays, device identity) wait on I7, I12 and I15. The `missing` rows are `Surface` for map 5; the why-chain, model tiering and MCP per domain for map 6; embeddings as datoms for map 2. Map 2 takes 22 of the 36 reference-stack rows, map 4 six, map 6 six and map 5 two.

vivief drifts within a week: the datom architecture (v0.8) and the lean stack keep iroh-blobs and a SQLite warm tier that `vivief ADR 0051` drops on d2ts's measurement, and RELEVANCE still names the architecture as what superseded `vivief ADR 0047`. The counseling contract is v0.7 in a file named v2, partly rewritten for Iroh while its stack section still specifies PostgreSQL and NATS, and it puts Loro under structured data that `vivief ADR 0051` keeps out of Loro. Procurement's index lists files that are not in its folder. Several sections point to archived versions for "unchanged" content. The rows file's Notes list the rest.

Not settled, for I45: `vivief:datom-log-as-crdt`, `vivief:p2p-node-architecture` and `vivief:moq-iroh-transport` are `different` in I40 (against the frozen server authority) and `deferred` here (against the hypothesis). I45 either picks one status per id or splits each row, and notes that the hypothesis has a research record but no issue with a `Decide when:`. `vivief:trust-strategies` and `vivief:fix-escalation` are `missing` in I35 and `different` here: ViViEfs does this in practice but has no name for it, as in I37 and I38. The rows file's Notes list ten possible merges with earlier rows.

## Comments
