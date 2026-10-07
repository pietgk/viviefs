# I56: One shape at every level?

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47

Found: 2026-10-07

## What

Does one shape, vivief's `(State, intent) => (State', [Effects]')`, describe ViViEfs at every level, and where is the sweet spot before it becomes a rabbit hole? [I47](0047-what-viviefs-is-about.md) raised it and left it here on purpose: the human called it "close to an existential level discussion" that needs its own time.

The human's framing (I47, 2026-10-07): an `effectHandler` is something like `(State or Context, effect or command or intent) => (State' or Context', [Effects]')`. State can be read as the whole log store plus the output of the active projectors (the read models), with a local and a global context. D36's command, `(readModel, intent) -> changeset or DomainError`, is then one version of an `effectHandler`, at the level that creates changesets. That everything can be described this way is tempting; the session decides how far it holds.

Start with a review page that writes the shape out on ViViEfs's real code at each candidate level, so the human sees where it fits cleanly, where it stretches, and where it fits only by renaming:

- a command: read model and intent to a changeset (D36);
- the projector: changeset to read models (D37, ADR-0011);
- an activity and a workflow: journaled results, replay (D2, ADR-0012);
- a change: a diff to `verify`'s verdict;
- a gate: a claim to evidence (D93);
- a guide: a decision to a lesson a learner tries (D96);
- an agent session;
- an app using a part, which improves the part (D95, D55').

The same question seen as a process is vivief's "the same loop at every scale" (`vivief:fractal-factory`): is ViViEfs's Vision - View - Effects loop (D98) the same at each of these levels, and does each turn's output become the next one's input?

The names (`effectHandler`, intent, effect, the formula's terms) are map 3's (I30); this ticket decides whether the shape is foundation, not what it is called. I51 asks the same question at run time (`vivief:handler-levels`), so it waits for this one.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, an ADR where the decision is architectural (ADR-0032 collects the foundation concepts), and a glossary entry for each concept adopted (a word that clashes waits for map 3). Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (2), both deferred here by I47: `viviefs:changeset` (is the changeset the `State'` of the formula, the read model after projection, or the log?) and `vivief:fractal-factory`.

## Comments
