# Map: vocabulary

Wayfinder map 3 of [I34: vivief as the source of ViViEfs's concepts](../../issues/0034-vivief-as-the-source-of-viviefs-concepts.md).
Charted on 2026-10-27; the charting review is
[2026-10-27 Charting map 3: the words](../../research/2026-10-27-the-words-charting.html).
Tickets are the issues with `Effort: docs/plan/vocabulary/`
([issue tracker](../../agents/issue-tracker.md), Wayfinding operations).

## Destination

A glossary where each term means one thing. Every map-3 row of
[the vivief inventory](../../research/2026-10-06-vivief-inventory.md), every word
listed under Notes and [I78 Research: Effect's vocabulary against ours][I78]'s questions 1-11 have a disposition in a ticket's
Answer; every glossary term has one meaning in the stack, and where another
project (Effect first) uses the word otherwise, its entry says so; [I26 Glossary links on words that are not our terms][I26] is decided
and built; and the human has accepted the glossary as it stands ([I96 Accept the vocabulary][I96]).

## Notes

- **One word, or a compound.** A single-word term only where its meaning matches
  our own use and the libraries we use, inside and outside, as entity did
  ([D137 One meaning of entity][D137]); otherwise a compound that names its context (a workflow runner, an
  OPFS worker, a test runner). Compounds are welcome where they make
  communication clearer. Effect's names come first ([D135 Effect's names first][D135]). [I89 How a word is chosen and written][I89] makes this a
  decision.
- **Do, not only plan.** A ticket writes its glossary entries and edits the
  living documents its word decision forces, in the same commit, so the
  repository never holds both words. [I26 Glossary links on words that are not our terms][I26]'s linker is built inside the map
  ([I95 Build the glossary linker as decided][I95]). Any other code identifier a word touches becomes an issue for the
  Schedule's build phase; pinned names never change ([D44 Never rename, never migrate][D44], [D44' Never rename, never migrate, the RPC too][D44']).
- **What a word change rewrites.** The prose of the glossary, AGENTS.md, guides,
  ADR bodies, plan pages and open issues. Decision-log rows, resolved issues'
  Answers and research records are kept as written; the new entry's Avoid line
  names the old word so a reader of an old record can map it. Before a word is
  retired, the ticket checks and records in its Answer: (1) no persisted name or
  code identifier uses it in the retired sense, or an issue is opened; (2) no
  planned concept (open issues, maps 4-6, the Schedule) needs the bare word for
  another meaning; (3) if the word is later given a new meaning, its entry says
  what old records meant by it.
- **Where a word decision is written.** A decision-log row (numbered on from
  [D162 Portability, two halves][D162]) for each rule and each word where alternatives were weighed. A mark that
  only says another project's sense goes in the glossary alone. No ADR unless a
  word changes what an architectural record means.
- **Dispositions.** As map 2: _adopt_, _keep ours_, _reject_, _defer_ (with a
  `Decide when:`), _hand to map N_, or _stands_.
- **One session per ticket.** Skills `grilling` and `domain-modeling`; a review
  page with worked examples before deciding.
- **The words waiting** (from map 2 and [I78 Research: Effect's vocabulary against ours][I78]): `Contract`, `effectHandler`,
  intent, effect, Vision, View and Effects, the formula's names ([I30 Ideas batch: glossary entries written as effects][I30]), foundation
  concept, abstraction or pattern ([I33 Ideas batch: abstractions that constrain agents][I33]), `node`, surface, frame, trust level, the
  lab qualifier, hot, frontier, warm and cold, the kinds of intent, change ([I77 The word change has two meanings][I77]),
  Tool, Envelope, Journal, Entity, Decision, Prompt, Worker and runner, Deferred,
  `tx`, Command, session, model, Service, and a "like X, except Y" line per term
  where it helps a newcomer ([D162 Portability, two halves][D162]).
- **Sources.** The inventory record, section "Map 3: Vocabulary";
  [I78's record](../../research/2026-10-27-effect-vocabulary-against-ours.md);
  `repos/effect`; vivief (`~/ws/vivief`) on demand.

## Decisions so far

- [I88 Effect and the effect handler][I88] (2026-10-28): effect has one meaning, named by phase (asked for, proposed, happened); Effect and effect are told apart by case, and the docs linker matches case; the effect handler is a compound term (a command, accept, a workflow body), with no formula of its own; an intent is what someone asks to happen; Vision - View - Effects is one entry; a command decides, marked against `DecisionModel.decide` ([D163 One meaning of effect, named by phase][D163]-[D169 A command decides][D169]).

## Not yet specified

- Code identifiers a word decision touches, each an issue once found.
- Whether the glossary's groups change ([I89 How a word is chosen and written][I89] may answer it).

## Out of scope

- Alchemy's names ([I28 Alchemy: infrastructure as Effects][I28]): with [I7 Production hosting, deployment and telemetry backend][I7].
- The reader test ([I21 Test the glossary with a reader outside software][I21]): map 4, which judges this map's result.
- Building [I32 Ideas batch: explain any word on demand][I32]: only its trigger is checked ([I94 Words in another project's sense][I94]).
- [I78 Research: Effect's vocabulary against ours][I78]'s question 12 (tool calls, approval, a stored result, a model's name): map 6, carried on [I29 Ideas batch: agents that record a replayable run][I29].

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D135]: ../bootstrap/02-decision-log.md#d135
[D137]: ../bootstrap/02-decision-log.md#d137
[D162]: ../bootstrap/02-decision-log.md#d162
[D163]: ../bootstrap/02-decision-log.md#d163
[D169]: ../bootstrap/02-decision-log.md#d169
[D44]: ../bootstrap/02-decision-log.md#d44
[D44']: ../bootstrap/02-decision-log.md#d44p
[I21]: ../../issues/0021-test-the-glossary-with-a-reader.md
[I26]: ../../issues/0026-glossary-links-on-words-that-are-not-our-terms.md
[I28]: ../../issues/0028-alchemy-infrastructure-as-effects.md
[I29]: ../../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md
[I30]: ../../issues/0030-ideas-batch-glossary-entries-written-as-effects.md
[I32]: ../../issues/0032-ideas-batch-explain-any-word-on-demand.md
[I33]: ../../issues/0033-ideas-batch-abstractions-that-constrain-agents.md
[I7]: ../../issues/0007-production-hosting-and-telemetry-backend.md
[I77]: ../../issues/0077-change-has-two-meanings.md
[I78]: ../../issues/0078-research-effect-vocabulary-against-ours.md
[I88]: ../../issues/0088-effect-and-the-effect-handler.md
[I89]: ../../issues/0089-how-a-word-is-chosen-and-written.md
[I94]: ../../issues/0094-words-in-another-projects-sense.md
[I95]: ../../issues/0095-build-the-glossary-linker-as-decided.md
[I96]: ../../issues/0096-accept-the-vocabulary.md
