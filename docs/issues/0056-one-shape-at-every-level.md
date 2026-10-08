# I56: One shape at every level?

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47]

Found: 2026-10-07

## What

Does one shape, vivief's `(State, intent) => (State', [Effects]')`, describe ViViEfs at every level, and where is the sweet spot before it becomes a rabbit hole? [I47](0047-what-viviefs-is-about.md) raised it and left it here on purpose: the human called it "close to an existential level discussion" that needs its own time.

The human's framing ([I47 What ViViEfs is about][I47], 2026-10-07): an `effectHandler` is something like `(State or Context, effect or command or intent) => (State' or Context', [Effects]')`. State can be read as the whole log store plus the output of the active projectors (the read models), with a local and a global context. [D36 Shared commands][D36]'s command, `(readModel, intent) -> changeset or DomainError`, is then one version of an `effectHandler`, at the level that creates changesets. That everything can be described this way is tempting; the session decides how far it holds.

Start with a review page that writes the shape out on ViViEfs's real code at each candidate level, so the human sees where it fits cleanly, where it stretches, and where it fits only by renaming:

- a command: read model and intent to a changeset ([D36 Shared commands][D36]);
- the projector: changeset to read models ([D37 Log store tables][D37], [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011]);
- an activity and a workflow: journaled results, replay ([D2 Temporal model][D2], [ADR-0012 Durable execution over one datom-backed engine][ADR-0012]);
- a change: a diff to `verify`'s verdict;
- a gate: a claim to evidence ([D93 Claims in front][D93]);
- a guide: a decision to a lesson a learner tries ([D96 Two verifications][D96]);
- an agent session;
- an app using a part, which improves the part ([D95 App creation][D95], [D55' Consumer apps live here][D55']).

The same question seen as a process is vivief's "the same loop at every scale" (`vivief:fractal-factory`): is ViViEfs's Vision - View - Effects loop ([D98 Vision - View - Effects][D98]) the same at each of these levels, and does each turn's output become the next one's input?

The names (`effectHandler`, intent, effect, the formula's terms) are map 3's ([I30 Ideas batch: glossary entries written as effects][I30]); this ticket decides whether the shape is foundation, not what it is called. [I51 Actors or the engine][I51] asks the same question at run time (`vivief:handler-levels`), so it waits for this one.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, an ADR where the decision is architectural ([ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] collects the foundation concepts), and a glossary entry for each concept adopted (a word that clashes waits for map 3). Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (2), both deferred here by [I47 What ViViEfs is about][I47]: `viviefs:changeset` (is the changeset the `State'` of the formula, the read model after projection, or the log?) and `vivief:fractal-factory`.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0011]: ../adr/0011-log-store-pattern.md
[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D2]: ../plan/bootstrap/02-decision-log.md#d2
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D93]: ../plan/bootstrap/02-decision-log.md#d93
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[D96]: ../plan/bootstrap/02-decision-log.md#d96
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I47]: 0047-what-viviefs-is-about.md
[I51]: 0051-actors-or-the-engine.md
