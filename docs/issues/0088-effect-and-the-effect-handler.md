# I88: Effect and the effect handler

Status: resolved

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

## Answer

Decided with the human on 2026-10-28 in three rounds, on [the review page](../research/2026-10-27-effect-and-the-effect-handler-review.html), all as recommended. The page set the word's four sources side by side (plain English, Effect 4.0.5, vivief, and what a newcomer brings: algebraic effects, Elm, the Decider), vivief's `effectHandler` in one page, and four worked examples: `renameList`, the exit-replay workflow of [P06 Workflow engine crash matrix][P06], a sketch of an activity that calls `DecisionModel.decide`, and a gate as one turn of Vision - View - Effects.

**The finding.** The human's framing holds: neither Effect nor [D98 Vision - View - Effects][D98] uses the word for something other than a change something causes. They point at it at different moments, Effect before it runs (`Effect`) and after (`Exit`), [D98][D98] after. Read as phase, as vivief read the datom, it is one meaning.

**Round 1.** One meaning of effect, named by phase: asked for (an intent), proposed (a changeset), happened (a fact, a journaled exit) ([D163 One meaning of effect, named by phase][D163]). Vision - View - Effects is one glossary entry for the phrase; View and Effects are not terms alone ([D168 Vision - View - Effects, one entry][D168]). A command decides, in event sourcing's sense, marked against `DecisionModel.decide`, `effect/cli`'s `Command` and Effect's `Decision` ([D169 A command decides][D169]).

**Round 2.** The effect handler is a glossary term, the compound: a command, authority's accept and a workflow body are effect handlers; reads, pure helpers and the projector are not ([D165 The effect handler][D165]). An intent is what someone asks to happen, a person, an agent or an outside source ([D167 Intent: what someone asks to happen][D167]). Effect and effect are two entries, told apart by case; the docs site's linker now matches a term as written before any case, a name keeps its capitals in its anchor, and two entries may not share an anchor ([D164 Effect and effect, told apart by case][D164]).

**Round 3.** No formula with names of its own: the effect handler's sentence is the formula, and each handler keeps its signature in its own terms ([D166 No formula with names of its own][D166]). [I30 Ideas batch: glossary entries written as effects][I30] is narrowed: its names are answered; its fourth form waits for [I21 Test the glossary with a reader outside software][I21]; its "Avoid with a reason" goes to [I89 How a word is chosen and written][I89].

| Row | Disposition |
| --- | --- |
| `vivief:effect-handler`, `viviefs:command` | adopt as the effect handler, a compound term; keep ours for the command, one effect handler ([D165 The effect handler][D165]) |
| `vivief:intent` | keep ours, widened from the user to a person, an agent or an outside source; not any effect entering a handler ([D167 Intent: what someone asks to happen][D167]) |
| `vivief:datom-in-motion` | adopt its phase idea, for the word effect ([D163 One meaning of effect, named by phase][D163]); an intent stays not a datom ([D167 Intent: what someone asks to happen][D167]); its signature is not adopted ([D166 No formula with names of its own][D166]) |
| `vivief:effects-as-data` | adopt the sense: an effect described before it happens is the same effect ([D163 One meaning of effect, named by phase][D163]); the stack's own code as queryable effects stays map 5's ([I25 Ideas batch: understanding and maintaining code bases][I25]) |
| `viviefs:effect-v4-backbone` | stands; the library keeps the name Effect, told apart from effect by case ([D164 Effect and effect, told apart by case][D164]) |

[I78 Research: Effect's vocabulary against ours][I78]'s questions: 2 is answered by [D163 One meaning of effect, named by phase][D163], [D164 Effect and effect, told apart by case][D164] and [D168 Vision - View - Effects, one entry][D168], and the linker tells Effects in the phrase from Effect by the phrase entry and by case; 3 by [D166 No formula with names of its own][D166]; 5 by [D169 A command decides][D169], with the Decision entry's mark.

Checks before a word is retired (the map's Notes): no word is retired. The glossary's Intent loses "the user" only; no persisted name or code identifier carries `effectHandler`, intent or effect in a sense these decisions change, and no planned concept needs the bare word effect for another meaning. Living documents edited: `GLOSSARY.md` (effect, Effect handler, Vision - View - Effects, Intent, and the Effect, Command and Decision entries), [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s two sentences that left `effectHandler`'s name to map 3, and [I25 Ideas batch: understanding and maintaining code bases][I25]'s line on the formula. The docs linker change is in `apps/docs/src/lib/references.ts` with its tests.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D163]: ../plan/bootstrap/02-decision-log.md#d163
[D164]: ../plan/bootstrap/02-decision-log.md#d164
[D165]: ../plan/bootstrap/02-decision-log.md#d165
[D166]: ../plan/bootstrap/02-decision-log.md#d166
[D167]: ../plan/bootstrap/02-decision-log.md#d167
[D168]: ../plan/bootstrap/02-decision-log.md#d168
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D98']: ../plan/bootstrap/02-decision-log.md#d98p
[I21]: 0021-test-the-glossary-with-a-reader.md
[I25]: 0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
