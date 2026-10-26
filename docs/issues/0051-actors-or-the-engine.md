# I51: Actors or the engine

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I56 One shape at every level?][I56]

Found: 2026-10-07

## What

Is ViViEfs's datom-backed workflow engine (resume from the journal, one lease per execution, drain before close) its answer to vivief's actor runtime, so a durable workflow is the actor level and "actor" keeps its narrow meaning, and does anything that is not a workflow need supervision, or the stack an event bus beside Reactivity invalidation and the cursor stream?

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (13): `vivief:actor-runtime`, `vivief:handler-levels`, `vivief:effect-handler-runtime-needs`, `vivief:cross-cutting-needs`, `vivief:event-broker`, `viviefs:durable-workflow`, `viviefs:datom-backed-engine`, `viviefs:lease-and-fencing`, `viviefs:drain-before-close`, `viviefs:resume-on-next-launch`, `viviefs:browser-engine-leader`, `viviefs:service-and-layer`, `viviefs:quarantine-after-lost-lease`.

## Answer

Decided with the human from 2026-10-24 to 2026-10-26, over three rounds on [the review page](../research/2026-10-24-actors-or-the-engine-review.html) and in conversation. The page read Effect's `cluster` first (Entity, Sharding, Singleton, ClusterCron, MessageStorage, ClusterWorkflowEngine) and set vivief's actor, Effect's Entity and our execution side by side: every actor property has an answer in the execution, and Effect itself builds its durable workflow on its Entity. It found that a lease never expires, that any member device may take one, and that accept's lease check is not atomic with the append ([I71 An append can land after a revocation][I71]).

**Round 1**, the human's challenges before answering. Could Cluster replace the lease? A device cannot be a Cluster runner (offline, a shard holds other organizations' runs, a fence by time only), and `MessageStorage` fits the log poorly (claims rewritten on every read, deletes, a compare-and-delete), so it would not give one journal format. "Entity" is one meaning, not a clash: a thing with an identity that facts are about, and some entity types act. `actor` was defined by today's list (a person or the server) instead of its meaning, the identity authority checked.

**Round 2.** The actor level is the durable workflow, one execution per actor, with no actor runtime, supervision tree or event bus; commands and the engine are the handler runtime ([D136 The actor level is the durable workflow][D136], [D138 A workflow, or a cursor][D138]-[D140 Commands and the engine are the handler runtime][D140]). One meaning of entity ([D137 One meaning of entity][D137]). The actor is the accountable identity, and the model an origin ([D141 The actor is the accountable identity][D141]). For one way to own a run the human asked for the lease explained, then proposed that a takeover is always allowed and overlap is detected in the journal, with no heartbeat. Verified on the page: write-once facts alone let a spliced history in (an offline phone's later steps on top of another device's step), so the fence moved from facts to history: every engine fact names the fact it follows and is accepted only on the run's head. The human's B, A, B scenario is one valid history. The journal is the fence, and Cluster is not needed ([D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39'], [ADR-0036 The journal is the fence][ADR-0036]).

**Round 3.** The rows as below; the comments on [I8 Engine scale-out and a multi-runner server][I8] and [I29 Ideas batch: agents that record a replayable run][I29]; a new ADR for the fence that supersedes [ADR-0014 Leases, fencing and server authority][ADR-0014]'s lease design once qualified; the `actor` and Entity glossary entries now, the lease entries until [I80 Build the journal fence][I80] is built; [I80][I80] in phase 3, after [I71 An append can land after a revocation][I71] and beside [I69 Accept checks every change][I69].

| Row | Disposition |
| --- | --- |
| `vivief:actor-runtime` | keep ours: no actor runtime; supervision is resume from the journal, failure as data, interrupt ([D136 The actor level is the durable workflow][D136], [D138 A workflow, or a cursor][D138]) |
| `vivief:handler-levels` | adopt, as Command and Workflow: the actor level is the durable workflow, one execution per actor ([D136 The actor level is the durable workflow][D136]) |
| `vivief:effect-handler-runtime-needs` | keep ours: commands and the engine are the handler runtime; a model call is an activity; a handler written as instructions is a skill ([D140 Commands and the engine are the handler runtime][D140]) |
| `vivief:cross-cutting-needs` | keep ours: Schema and content hashes; key derivation is [I54 Trust, encryption and who may sign in][I54]'s; the bus is rejected ([D139 No event bus][D139]) |
| `vivief:event-broker` | reject ([D139 No event bus][D139]) |
| `viviefs:durable-workflow` | stands: its question was [D130 One shape at the data level][D130]'s; the workflow is the actor level ([D136 The actor level is the durable workflow][D136]) |
| `viviefs:datom-backed-engine` | keep ours, amended: one engine, one journal, one fence; Cluster not needed ([D39' One engine, one journal, one fence][D39']) |
| `viviefs:lease-and-fencing` | keep ours, changed: the journal head replaces the lease as the fence ([D14' The journal is the fence][D14'], [ADR-0036 The journal is the fence][ADR-0036]), built by [I80 Build the journal fence][I80] |
| `viviefs:drain-before-close` | keep ours: a rule for owned resources; a workflow needs no drain, because an interrupted run resumes ([D138 A workflow, or a cursor][D138]) |
| `viviefs:resume-on-next-launch` | stands: the device's restart policy, the holder's own sweep under [D14' The journal is the fence][D14'] |
| `viviefs:browser-engine-leader` | stands: one engine per local database ([D25 Browser engine leader][D25]); vivief's failure modes go to [P17 Browser engine leader][P17]'s grilling |
| `viviefs:service-and-layer` | stands: a loop that is not a workflow is a scoped Layer ([D138 A workflow, or a cursor][D138]) |
| `viviefs:quarantine-after-lost-lease` | stands: [I53 Sync and conflict][I53] reviews [I11 Quarantine of user content after a lost lease][I11]; under [D14' The journal is the fence][D14'] the stranded content is an offline history that was refused |

- **Also decided:** one meaning of entity ([D137 One meaning of entity][D137]), the actor is the accountable identity ([D141 The actor is the accountable identity][D141]). [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] records [D136-D141 Actors or the engine][D136-D141]; [ADR-0036 The journal is the fence][ADR-0036] records [D14' The journal is the fence][D14'] and [D39' One engine, one journal, one fence][D39']; [ADR-0012 Durable execution over one datom-backed engine][ADR-0012] and [ADR-0014 Leases, fencing and server authority][ADR-0014] amended.
- **Consequences:** [I80 Build the journal fence][I80] (build the journal fence, phase 3, blocked by [I71 An append can land after a revocation][I71]). Comments on [I8 Engine scale-out and a multi-runner server][I8] (direction rewritten), [I29 Ideas batch: agents that record a replayable run][I29], [I71][I71], [I11 Quarantine of user content after a lost lease][I11], [I54 Trust, encryption and who may sign in][I54] and [I78 Research: Effect's vocabulary against ours][I78].

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) decides that model output enters the log through an activity, as an ordinary changeset naming its origin (a model and its version) and its inputs' origins ([D111 Faster and enriching implementations][D111], [D115 Origin trust][D115]); vivief's trust strategies become commit paths for it ([D117 Trust strategies as commit paths][D117]). Whether the envelope needs an actor category for agents (`vivief:provenance`) stays here and with map 6.

2026-10-24: [I56 One shape at every level?][I56] settled the data level: a command decides, authority accepts, the projector evolves, a workflow runs over its journal, and activities are the only door to the world ([D130 One shape at the data level][D130]). So `vivief:handler-levels` asks only whether its actor level is the durable workflow; this ticket does not ask about the shape again. Read Effect's `cluster` first (Entity, Sharding, Singleton, ClusterWorkflowEngine in `repos/effect/packages/effect/src/cluster`): Cluster's Entity is Effect's own answer to an actor, and a concept Effect already names takes Effect's name ([D135 Effect's names first][D135], [I78 Research: Effect's vocabulary against ours][I78]).

2026-10-26: Resolved by [D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'] and [D39' One engine, one journal, one fence][D39'] ([ADR-0036 The journal is the fence][ADR-0036]), from [the review page](../research/2026-10-24-actors-or-the-engine-review.html).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0014]: ../adr/0014-leases-fencing-and-server-authority.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D111]: ../plan/bootstrap/02-decision-log.md#d111
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D136]: ../plan/bootstrap/02-decision-log.md#d136
[D136-D141]: ../plan/bootstrap/02-decision-log.md#d136-d141
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D138]: ../plan/bootstrap/02-decision-log.md#d138
[D139]: ../plan/bootstrap/02-decision-log.md#d139
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D140]: ../plan/bootstrap/02-decision-log.md#d140
[D141]: ../plan/bootstrap/02-decision-log.md#d141
[D25]: ../plan/bootstrap/02-decision-log.md#d25
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I11]: 0011-quarantine-after-a-lost-lease.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I47]: 0047-what-viviefs-is-about.md
[I53]: 0053-sync-and-conflict.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I56]: 0056-one-shape-at-every-level.md
[I69]: 0069-accept-checks-every-change.md
[I71]: 0071-an-append-can-land-after-a-revocation.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I8]: 0008-engine-scale-out.md
[I80]: 0080-build-the-journal-fence.md
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
