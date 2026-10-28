# I53: Sync and conflict

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I48 The server-independent goal, and what an app is to a device and a node][I48]

Found: 2026-10-07

## What

Is sync in the foundation a deliberate difference from vivief, which defers it until a single user is handled well, and should the foundation's story say why (device switching, server authority)? With it: whether an attribute needs a cardinality, with many-valued attributes resolved as a set, whether text ever needs a CRDT beside last-writer-wins and human conflict, and whether server validation of every changeset is the stack's one trust strategy.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (5): `viviefs:sync-as-datom-replication`, `vivief:sync-contract`, `vivief:sync-after-core`, `viviefs:conflict-policy`, `viviefs:server-authoritative-validation`.

## Answer

Decided with the human on 2026-10-26, over two rounds on [the review page](../research/2026-10-26-sync-and-conflict-review.html). The page read vivief's sync and Effect's `EventLog` (4.0.5) against ours, and found that human conflict is not built as decided: the basis is a sequence number in whichever log projects it and every changeset outside [P05 Changesets and projections][P05] sends `0`; a conflict is a row each projector derives, never a fact; the server checks write-once only (`BasisRejected`); and a human-conflict attribute keeps every value ever asserted, so a retract removes nothing and no conflict can be resolved. No gate put two devices on human conflict.

**Round 1.** Sync is in the foundation on purpose ([D142 Sync from the start][D142]); vivief's Sync Contract is three parts ViViEfs has ([D143 The sync contract as three parts][D143]); authority decides a human conflict at accept against the cursor its writer had pulled and writes it as a fact, and per value the later of assert and retract wins, so a command resolves it ([D34' Per-attribute conflict policies, decided at accept][D34']); no text CRDT until two people type in one text at the same time ([D145 Text without a CRDT][D145]); one checkpoint enforces trust ([D146 One checkpoint enforces trust][D146]). The human asked for a fuller explainer of cardinality and of quarantine.

**Round 2**, after sections 8 and 9 of the page. A set is entities, one per member, with no cardinality ([D144 A set is entities][D144]). User content never lives only in a journal value ([D147 User content outside the journal][D147]), and quarantine keeps the user content of a rejected changeset on the device until a person keeps it as new or discards it ([D148 Quarantine is rejected user content][D148]).

| Row | Disposition |
| --- | --- |
| `vivief:sync-after-core` | keep ours: sync from the start, a difference in build order, not design; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] says why ([D142 Sync from the start][D142]) |
| `vivief:sync-contract` | keep ours, as three parts: the conflict policy, the organization as scope, the journal fence as the claim; its text CRDT deferred ([D143 The sync contract as three parts][D143], [D145 Text without a CRDT][D145], [I83 Live co-editing of text][I83]) |
| `viviefs:conflict-policy` | keep ours, amended: decided by authority at accept and kept as a fact; a set is entities ([D34' Per-attribute conflict policies, decided at accept][D34'], [D144 A set is entities][D144]; with `vivief:conflict-resolution-by-cardinality`) |
| `viviefs:server-authoritative-validation` | keep ours: one checkpoint enforces trust; `vivief:peer-validation-as-contract` handed to [I54 Trust, encryption and who may sign in][I54] ([D146 One checkpoint enforces trust][D146]) |
| `viviefs:sync-as-datom-replication` | stands: outbox up, one cursor stream down; partial-sync details wait for [I12 Partial sync, history consolidation and client data access][I12]'s trigger ([D143 The sync contract as three parts][D143], [D114 Partial sync on demand][D114]) |

- **Also decided:** user content outside the journal ([D147 User content outside the journal][D147]) and quarantine as rejected user content ([D148 Quarantine is rejected user content][D148]), which answer [I11 Quarantine of user content after a lost lease][I11] under [D14' The journal is the fence][D14']. [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] records [D142-D148 Sync and conflict][D142-D148]; [ADR-0009 Per-attribute conflict policies][ADR-0009] records [D34' Per-attribute conflict policies, decided at accept][D34'] (Observed: the findings); [ADR-0016 Commands, server validation and rejection][ADR-0016], [ADR-0017 Sync: outbox and sync cursor stream over Effect RPC][ADR-0017] and [ADR-0036 The journal is the fence][ADR-0036] amended.
- **Consequences:** [I81 Build conflicts decided at accept][I81] (build conflicts decided at accept, phase 3), [I82 Blobs no fact refers to][I82] (blobs no fact refers to), [I83 Live co-editing of text][I83] (live co-editing of text). Comments on [I11 Quarantine of user content after a lost lease][I11] (direction rewritten), [I12 Partial sync, history consolidation and client data access][I12], [I17 Local deletion after a revoked membership][I17], [I54 Trust, encryption and who may sign in][I54], [I69 Accept checks every change][I69] and [I80 Build the journal fence][I80].

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) hands over partial sync on demand ([D114 Partial sync on demand][D114]): when [I12 Partial sync, history consolidation and client data access][I12]'s new trigger fires, the sync details (what the server sends for a Presenter's query, cursors per query or per organization, what a partial `node` may accept) are decided here.

2026-10-26: Resolved by [D142-D148 Sync and conflict][D142-D148] and [D34' Per-attribute conflict policies, decided at accept][D34'], from [the review page](../research/2026-10-26-sync-and-conflict-review.html).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0009]: ../adr/0009-per-attribute-conflict-policies.md
[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[ADR-0017]: ../adr/0017-sync-outbox-and-cursor-stream.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D142]: ../plan/bootstrap/02-decision-log.md#d142
[D142-D148]: ../plan/bootstrap/02-decision-log.md#d142-d148
[D143]: ../plan/bootstrap/02-decision-log.md#d143
[D144]: ../plan/bootstrap/02-decision-log.md#d144
[D145]: ../plan/bootstrap/02-decision-log.md#d145
[D146]: ../plan/bootstrap/02-decision-log.md#d146
[D147]: ../plan/bootstrap/02-decision-log.md#d147
[D148]: ../plan/bootstrap/02-decision-log.md#d148
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I11]: 0011-quarantine-after-a-lost-lease.md
[I12]: 0012-partial-sync-and-history.md
[I17]: 0017-local-deletion-after-revoked-membership.md
[I47]: 0047-what-viviefs-is-about.md
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I69]: 0069-accept-checks-every-change.md
[I80]: 0080-build-the-journal-fence.md
[I81]: 0081-build-conflicts-decided-at-accept.md
[I82]: 0082-blobs-no-fact-refers-to.md
[I83]: 0083-live-co-editing-of-text.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
