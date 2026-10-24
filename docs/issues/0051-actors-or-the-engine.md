# I51: Actors or the engine

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I56 One shape at every level?][I56]

Found: 2026-10-07

## What

Is ViViEfs's datom-backed workflow engine (resume from the journal, one lease per execution, drain before close) its answer to vivief's actor runtime, so a durable workflow is the actor level and "actor" keeps its narrow meaning, and does anything that is not a workflow need supervision, or the stack an event bus beside Reactivity invalidation and the cursor stream?

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (13): `vivief:actor-runtime`, `vivief:handler-levels`, `vivief:effect-handler-runtime-needs`, `vivief:cross-cutting-needs`, `vivief:event-broker`, `viviefs:durable-workflow`, `viviefs:datom-backed-engine`, `viviefs:lease-and-fencing`, `viviefs:drain-before-close`, `viviefs:resume-on-next-launch`, `viviefs:browser-engine-leader`, `viviefs:service-and-layer`, `viviefs:quarantine-after-lost-lease`.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) decides that model output enters the log through an activity, as an ordinary changeset naming its origin (a model and its version) and its inputs' origins ([D111 Faster and enriching implementations][D111], [D115 Origin trust][D115]); vivief's trust strategies become commit paths for it ([D117 Trust strategies as commit paths][D117]). Whether the envelope needs an actor category for agents (`vivief:provenance`) stays here and with map 6.

2026-10-24: [I56 One shape at every level?][I56] settled the data level: a command decides, authority accepts, the projector evolves, a workflow runs over its journal, and activities are the only door to the world ([D130 One shape at the data level][D130]). So `vivief:handler-levels` asks only whether its actor level is the durable workflow; this ticket does not ask about the shape again. Read Effect's `cluster` first (Entity, Sharding, Singleton, ClusterWorkflowEngine in `repos/effect/packages/effect/src/cluster`): Cluster's Entity is Effect's own answer to an actor, and a concept Effect already names takes Effect's name ([D135 Effect's names first][D135], [I78 Research: Effect's vocabulary against ours][I78]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D111]: ../plan/bootstrap/02-decision-log.md#d111
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I47]: 0047-what-viviefs-is-about.md
[I56]: 0056-one-shape-at-every-level.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
