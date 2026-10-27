# I88: Effect and the effect handler

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Found: 2026-10-27

## What

Agree one description of effect and effect handler that holds for ViViEfs, for vivief's `effectHandler` and for Effect the library, the way [D137 One meaning of entity][D137] settled entity, before any other word of map 3. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

The human's framing (2026-10-27): the word effect can mean having an effect; that Effect defines an `Effect` as a description and runs it as another step is an implementation detail of the Effect library, so the effect handler and the effect can still be described in a single way.

The charting's draft, to test, not to adopt:

- **Effect**: "Something that happens and makes a difference: a fact written, a message sent, a screen redrawn, a model asked." Then: "Effect, the TypeScript library, writes an effect down as a value of its type `Effect` and runs it later; that describing and running are two steps is how the library works, not another meaning."
- **Effect handler**: "A step that takes what is known and an effect that comes in, and decides which effects follow." A command is the data level's effect handler (a read model and an intent in, a changeset or a typed error out, [D36' Shared commands, as built][D36'], [D130 One shape at the data level][D130]); the engine runs a workflow's steps the same way.

Start with a review page that tests the draft on a command, a workflow step, an activity that calls a model, and Vision - View - Effects ([D98 Vision - View - Effects][D98], [D98' Vision - View - Effects, at every level][D98']), and on [I78 Research: Effect's vocabulary against ours][I78]'s finding that in Effect what happened is an `Exit`.

Decide:

- the entries for effect, effect handler, and Vision, View and Effects, and how the glossary's Effect (the library) entry reads beside them;
- whether an intent is an effect asked for and not yet accepted, or stays "what the user asked for, before it is checked" (the glossary's Intent);
- the formula's names, `(State or Context, Intent or Effect) => (State', [Effects'])` ([I30 Ideas batch: glossary entries written as effects][I30]), avoiding `Context`, `Effect` and `Command` where Effect already uses them, or taking Effect's `Effect<A, E, R>` names;
- the verb "decide" for a command ([D130 One shape at the data level][D130]) beside `DecisionModel.decide`.

Rows settled here, from [the vivief inventory](../research/2026-10-06-vivief-inventory.md), map 3: `vivief:effect-handler` and `viviefs:command`, `vivief:intent`, `vivief:datom-in-motion`, `vivief:effects-as-data`, `viviefs:effect-v4-backbone`. [I78 Research: Effect's vocabulary against ours][I78]'s questions 2, 3 and 5 (in part). [I30 Ideas batch: glossary entries written as effects][I30] gets a comment confirming or narrowing what is left of it.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D98']: ../plan/bootstrap/02-decision-log.md#d98p
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
