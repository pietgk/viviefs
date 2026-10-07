# I51: Actors or the engine

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Is ViViEfs's datom-backed workflow engine (resume from the journal, one lease per execution, drain before close) its answer to vivief's actor runtime, so a durable workflow is the actor level and "actor" keeps its narrow meaning, and does anything that is not a workflow need supervision, or the stack an event bus beside Reactivity invalidation and the cursor stream?

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (13): `vivief:actor-runtime`, `vivief:handler-levels`, `vivief:effect-handler-runtime-needs`, `vivief:cross-cutting-needs`, `vivief:event-broker`, `viviefs:durable-workflow`, `viviefs:datom-backed-engine`, `viviefs:lease-and-fencing`, `viviefs:drain-before-close`, `viviefs:resume-on-next-launch`, `viviefs:browser-engine-leader`, `viviefs:service-and-layer`, `viviefs:quarantine-after-lost-lease`.

## Comments
