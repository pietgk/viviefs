# I56: One shape at every level?

Status: resolved

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

## Answer

Decided with the human from 2026-10-10 to 2026-10-24, over four rounds on [the review page](../research/2026-10-10-one-shape-review.html) and in conversation. The page wrote vivief's shape out on the real code level by level: it fits cleanly where the state is kept as data and the code is deterministic, stretches at `verify`, and fits only by renaming above that.

**Round 1.** The shape is a foundation concept at the data level, as two functions chained through the log: a command decides, authority accepts, the projector evolves; a workflow runs the same way over its journal, an activity is the only door to the world, and failure is data ([D130 One shape at the data level][D130]). Reads and pure helpers are outside it. The changeset is the step, the log after accept is `State'`, and read models are its views ([D131 The changeset is the step][D131]). Above the code the shape is a lens, [D98 Vision - View - Effects][D98]'s loop.

**Round 2.** Three ways to draw that loop were compared: by time, by how settled, and by roles in a turn. They converge: every level, from data to decisions, code, claims and patterns, passes the same four states, hot, the frontier, warm and cold, which are also decide, accept, keep and derive, and something cold that someone reads becomes a hot intent at another level ([D132 Four states at every level][D132], [D98' Vision - View - Effects, at every level][D98']). vivief's temperatures meant how settled, not how fast (`vivief ADR 0050`). "A passing tree" became a verified commit, a commit on which `pnpm verify` is green ([D133 Verified commit][D133]).

**Round 3.** Glossary entries only for words that do not clash: Verified commit; the shape's name, the four states and "abstraction" wait for map 3. The comments on [I30 Ideas batch: glossary entries written as effects][I30], [I33 Ideas batch: abstractions that constrain agents][I33] and [I51 Actors or the engine][I51] below.

**Round 4**, the human's challenges after sleeping on it. A frame reaches a person through a surface of any modality, a screen being one; the word waits for map 3 ([D134 Presenting in any modality][D134]). Intent comes in kinds from a WayFinder map down to a button press, and the more abstract, the longer its turn, which orders the levels ([D132 Four states at every level][D132]). An app is not a pattern, though the app's shape is a candidate pattern for the app shell. A concept Effect already names takes Effect's name and meaning ([D135 Effect's names first][D135]), and [I78 Research: Effect's vocabulary against ours][I78] compares Effect's vocabulary with ours before map 3.

| Row | Disposition |
| --- | --- |
| `viviefs:changeset` | keep ours: the changeset is the step, not `State'`; the log after accept is `State'`, read models are its views ([D131 The changeset is the step][D131]) |
| `vivief:fractal-factory` | adopt, narrowed, as a lens: four states at every level, the levels ordered by how abstract an intent is and how long a turn takes ([D132 Four states at every level][D132], [D98' Vision - View - Effects, at every level][D98']); datoms for development artifacts and "velocity compounds" as a claim not adopted, the latter map 4's evidence question |

- **Also decided:** the shape at the data level ([D130 One shape at the data level][D130]), verified commit ([D133 Verified commit][D133]), presenting in any modality ([D134 Presenting in any modality][D134]), Effect's names first ([D135 Effect's names first][D135]). [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] records them; the glossary gains Verified commit, and Changeset avoids "code changeset".
- **Consequences:** [I76 Verify's verdict is not kept per commit][I76] (verify's verdict is not kept per commit), [I77 The word change has two meanings][I77] ("change" has two meanings, for map 3), [I78 Research: Effect's vocabulary against ours][I78] (research: Effect's vocabulary against ours, before map 3); comments on [I26 Glossary links on words that are not our terms][I26], [I30 Ideas batch: glossary entries written as effects][I30], [I33 Ideas batch: abstractions that constrain agents][I33] and [I51 Actors or the engine][I51].

## Comments

2026-10-24: Resolved by [D130-D135 One shape at every level][D130-D135] and [D98' Vision - View - Effects, at every level][D98'], from [the review page](../research/2026-10-10-one-shape-review.html).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0011]: ../adr/0011-log-store-pattern.md
[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D130-D135]: ../plan/bootstrap/02-decision-log.md#d130-d135
[D131]: ../plan/bootstrap/02-decision-log.md#d131
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D133]: ../plan/bootstrap/02-decision-log.md#d133
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D2]: ../plan/bootstrap/02-decision-log.md#d2
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D93]: ../plan/bootstrap/02-decision-log.md#d93
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[D96]: ../plan/bootstrap/02-decision-log.md#d96
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D98']: ../plan/bootstrap/02-decision-log.md#d98p
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I47]: 0047-what-viviefs-is-about.md
[I51]: 0051-actors-or-the-engine.md
[I76]: 0076-verify-verdict-not-kept-per-commit.md
[I77]: 0077-change-has-two-meanings.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
