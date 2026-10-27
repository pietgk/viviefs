# I55: Accept the foundation concepts

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I48 The server-independent goal, and what an app is to a device and a node][I48], [I49 Projection: one concept or several patterns][I49], [I50 Contracts checked as data or by commands][I50], [I51 Actors or the engine][I51], [I52 The datom and its store][I52], [I53 Sync and conflict][I53], [I54 Trust, encryption and who may sign in][I54], [I56 One shape at every level?][I56]

Found: 2026-10-07

## What

Does the human accept ViViEfs's foundation concepts? Decide which of vivief's five `concepts` (`Datom`, `Projection`, `Surface`, `Contract`, `effectHandler`) are ViViEfs's foundation, whether its libs map onto them, and whether a mapping from its terms to conventional equivalents helps newcomers. Check that every one of the inventory's 101 map-2 rows has a disposition in an Answer of I47-[I55 Accept the foundation concepts][I55], then walk the foundation ADR with the human: what ViViEfs is about and its foundation concepts, linking the decisions that chose them. When it is accepted the map is done, and [I34 vivief as the source of ViViEfs's concepts][I34] gets a comment pointing at the ADR.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (3): `vivief:five-concepts`, `vivief:concept-aligned-packages`, `vivief:portability`.

## Answer

Decided with the human on 2026-10-27 in two rounds, on [the review page](../research/2026-10-27-accept-the-foundation-concepts-review.html) and in conversation. The page set vivief's five `concepts` beside where each landed in I49-[I56 One shape at every level?][I56], and showed the inversion: vivief has a closed set of concepts that patterns compose, ViViEfs an open set of patterns, each with a contract, a suite and a gate, with a concept living in one pattern's guide ([D82 Patterns build on each other][D82]).

**Round 1.** All five of vivief's `concepts` are adopted, each in the form it landed, and the set stays open; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] lists twelve foundation concepts in one table read as one turn, each with a plain sentence, what it came from in vivief, its decisions, its owning pattern and the gate that shows it or the issue that will ([D160 The foundation concepts][D160]). Libs stay one per pattern core and implementation, mapped to the concepts by the pattern id ([D161 Libs stay one per pattern and implementation][D161]). Portability's lock-in half is ours already; its newcomer half, a "like X, except Y" glossary line, goes to map 3 and is judged by [I21 Test the glossary with a reader outside software][I21] ([D162 Portability, two halves][D162]). An intent record with no pattern and no gate is accepted directly, as [D65 Guide inventory and order][D65] already did for 0001 and 0002 ([D65' Intent records accepted directly][D65']); `verify`'s list of ADRs accepted directly gains 0032.

**Round 2**, the walk through [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]. Its Summary names the foundation; "Nodes and authority" moves to just after the table, because every paragraph after it uses `node` and authority; Trade-offs gains the Out-of-scope items bullet the template has asked for since [I57 Out-of-scope items in an ADR's trade-offs][I57] (none made harder); Failure-handling and Outcome say how it was accepted. The human accepted [ADR-0032][ADR-0032], and [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] as amended by [I59 Bring ADR-0002 and the vision page in line with I47][I59], on 2026-10-27.

**Row check.** A script over the inventory's "Map 2: Foundation (101)" and every Answer of I47-[I59 Bring ADR-0002 and the vision page in line with I47][I59] found 98 rows disposed of before this ticket; the three left were this ticket's own, settled below. Six inventory lines carry two ids and are disposed of under their first; `viviefs:changeset` and `vivief:fractal-factory`, deferred by [I47 What ViViEfs is about][I47] to [I56 One shape at every level?][I56], are disposed of by [I56][I56].

| Row | Disposition |
| --- | --- |
| `vivief:five-concepts` | adopt, open: all five in the forms they landed, twelve foundation concepts in [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s table ([D160 The foundation concepts][D160]) |
| `vivief:concept-aligned-packages` | keep ours: libs per pattern core and implementation, mapped by the pattern id ([D161 Libs stay one per pattern and implementation][D161]) |
| `vivief:portability` | keep ours for lock-in; the newcomer's "like X, except Y" lines handed to map 3, judged by [I21 Test the glossary with a reader outside software][I21] ([D162 Portability, two halves][D162]) |

Consequences, for map 3: the words foundation concept (it clashes with [D82 Patterns build on each other][D82]'s concept) and the "like X, except Y" glossary lines join `Contract`, `effectHandler`, surface and `node`. For map 4: [I21 Test the glossary with a reader outside software][I21]'s reader test judges whether those lines help.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: ../adr/0002-purpose-scope-and-exemplar.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D160]: ../plan/bootstrap/02-decision-log.md#d160
[D161]: ../plan/bootstrap/02-decision-log.md#d161
[D162]: ../plan/bootstrap/02-decision-log.md#d162
[D65]: ../plan/bootstrap/02-decision-log.md#d65
[D65']: ../plan/bootstrap/02-decision-log.md#d65p
[D82]: ../plan/bootstrap/02-decision-log.md#d82
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I21]: 0021-test-the-glossary-with-a-reader.md
[I34]: 0034-vivief-as-the-source-of-viviefs-concepts.md
[I47]: 0047-what-viviefs-is-about.md
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I49]: 0049-projection-one-concept-or-several-patterns.md
[I50]: 0050-contracts-checked-as-data-or-by-commands.md
[I51]: 0051-actors-or-the-engine.md
[I52]: 0052-the-datom-and-its-store.md
[I53]: 0053-sync-and-conflict.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I55]: 0055-accept-the-foundation-concepts.md
[I56]: 0056-one-shape-at-every-level.md
[I57]: 0057-out-of-scope-items-in-adr-trade-offs.md
[I59]: 0059-bring-adr-0002-and-the-vision-in-line-with-i47.md
