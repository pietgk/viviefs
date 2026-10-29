# Map: vocabulary

Wayfinder map 3 of [I34: vivief as the source of ViViEfs's concepts](../../issues/0034-vivief-as-the-source-of-viviefs-concepts.md).
Charted on 2026-10-27; the charting review is
[2026-10-27 Charting map 3: the words](../../research/2026-10-27-the-words-charting.html).
Done on 2026-10-29: the human accepted the glossary ([I96 Accept the vocabulary][I96]).
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
  communication clearer. Effect's names come first ([D135 Effect's names first][D135]). Decided in [I89 How a word is chosen and written][I89]: the
  libraries and the test are named, every term passes the rule, and a compound
  is written whole every time ([D170 One word only where it matches][D170]-[D172 The compound, every time][D172]).
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
  what old records meant by it. Decided, with code comments added to what is
  rewritten ([D173 What a word change rewrites, and where it is written][D173]).
- **Where a word decision is written.** A decision-log row (numbered on from
  [D162 Portability, two halves][D162]) for each rule and each word where alternatives were weighed. A mark that
  only says another project's sense goes in the glossary alone. No ADR unless a
  word changes what an architectural record means ([D173 What a word change rewrites, and where it is written][D173]).
- **How an entry is written.** The first line is the hover line ([D94' The hover line][D94']); then
  `_Like_`, `_Not_` and `_Avoid_` lines ([D174 Like, Not and Avoid lines][D174]); a retired word names its
  decision ([D175 A retired word names its decision][D175]); a new term goes in the group of the foundation concept it
  serves ([D177 Groups follow the one turn][D177]). How to write one: [`docs/agents/domain.md`](../../agents/domain.md).
- **Dispositions.** As map 2: _adopt_, _keep ours_, _reject_, _defer_ (with a
  `Decide when:`), _hand to map N_, or _stands_.
- **One session per ticket.** Skills `grilling` and `domain-modeling`; a review
  page with worked examples before deciding.
- **The words waiting** (from map 2 and [I78 Research: Effect's vocabulary against ours][I78]): `Contract`, `effectHandler`,
  intent, effect, Vision, View and Effects, the formula's names ([I30 Ideas batch: glossary entries written as effects][I30]), foundation
  concept, abstraction or pattern ([I33 Ideas batch: abstractions that constrain agents][I33]), node (now Sync node, [D199 Sync node][D199]), surface (now Presentation surface, [D200 Presentation surface and screen][D200]), frame, trust level (keeps its word, with encryption level, [D205 Trust level and encryption level keep their words][D205]), the
  lab qualifier, hot, frontier, warm and cold, the kinds of intent, change ([I77 The word change has two meanings][I77]),
  Tool, Envelope, Journal, Entity, Decision, Prompt, Worker and runner, Deferred,
  `tx`, Command, session, model, Service, and a "like X, except Y" line per term
  where it helps a newcomer ([D162 Portability, two halves][D162]).
- **Sources.** The inventory record, section "Map 3: Vocabulary";
  [I78's record](../../research/2026-10-27-effect-vocabulary-against-ours.md);
  `repos/effect`; vivief (`~/ws/vivief`) on demand.

## Decisions so far

- [I88 Effect and the effect handler][I88] (2026-10-28): effect has one meaning, named by phase (asked for, proposed, happened); Effect and effect are told apart by case, and the docs linker matches case; the effect handler is a compound term (a command, accept, a workflow body), with no formula of its own; an intent is what someone asks to happen; Vision - View - Effects is one entry; a command decides, marked against `DecisionModel.decide` ([D163 One meaning of effect, named by phase][D163]-[D169 A command decides][D169]).
- [I89 How a word is chosen and written][I89] (2026-10-28): a single word only where it matches, the libraries and the test named; every term passes the rule, and six clashes no ticket held joined [I91 Effect's names against ours][I91]; the compound every time; the rewrite rules with code comments; `_Like_`, `_Not_` and `_Avoid_` lines; a retired word names its decision; the glossary opens with its thesis and Start here, and its groups follow the one turn; the first line is the hover line, after the preview was found cut mid-sentence; growth watched, not capped, reported by `verify`; a definition names the general thing, a device and not a phone ([D170 One word only where it matches][D170]-[D180 Diagram labels are prose][D180], [D94' The hover line][D94']).
- [I90 Pattern, concept, contract, abstraction][I90] (2026-10-28): concept is the wider word, a pattern the kind with a contract, a suite and a gate, and a foundation concept one of the twelve; "abstraction" stays plain English; Pattern, Contract and Feature keep their words with `_Like_` and `_Not_` lines; `.agents/patterns/` became `.agents/extracts/`; "no feature code" became "no production code"; [I33 Ideas batch: abstractions that constrain agents][I33] narrowed to map 4 ([D181 Concept is the wider word][D181]-[D185 Feature keeps its word][D185]).
- [I91 Effect's names against ours][I91] (2026-10-28): Workflow engine and Workflow runner, Worker retired; Durable deferred; Changeset manifest; Sync cursor; Evidence registry; Journal and Envelope keep their words with `_Not_` lines; Origin, Intent and actor with `_Like_` lines; Tool is [D102 Tools are apps][D102]'s app; "prompt" is not a term; entity type and entity id in Effect's sense; code names and [P17 Browser engine leader][P17]'s name in [I99 Code names for map 3's retired words][I99] ([D186 Workflow engine and workflow runner][D186]-[D197 Evidence registry, and the code names follow in one issue][D197]).

- [D198 Map 3 finishes lean][D198] (2026-10-28): map 3 finishes lean: [I92 Map 2's new words][I92] only the app shell's words, [I94 Words in another project's sense][I94] and [I95 Build the glossary linker as decided][I95] in one session, [I96 Accept the vocabulary][I96]; [I93 Naming facts][I93] deferred; [I97 A preview on every link in a page's text][I97] to phase 3; a grilling opens a new issue only for build work its decisions force.
- [I92 Map 2's new words][I92] (2026-10-28): Sync node, bare node left to Node.js; Presentation surface and Screen, [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] amended; Frame keeps its word with a `_Not_` line; change stays plain English, [I77 The word change has two meanings][I77] resolved; the lab qualifier, the four states and the kinds of intent wait ([D199 Sync node][D199]-[D203 The lab qualifier, the four states and the kinds of intent wait][D203]).
- [I94 Words in another project's sense][I94] and [I95 Build the glossary linker as decided][I95] (2026-10-29): a block quote, and a passage, table or phrase between `<!-- their words: whose -->` and `<!-- /their words -->`, resolve nothing against this repository (no glossary link, bare id or path check; a reference-style link still resolves); `verify` fails a retired word only in the code-font form its `_Avoid_` line writes (one word today, Sync node's), since the count found about 230 correct plain uses of the retired words; built with a test per case of [I26 Glossary links on words that are not our terms][I26] ([D204 Words in another project's sense][D204], [D180' Retired words in code font][D180']).
- [I96 Accept the vocabulary][I96] (2026-10-29), the destination reached and the glossary accepted as it stands: trust level and encryption level keep their words; Authority and Sync get entries, Log store defines the log and bare log has no entry; accept keeps both senses, told apart by what is accepted, with a `_Not_` line on Accepted; Lease and Lease epoch are marked as decided to go, and [I80 Build the journal fence][I80] retires them; the two unused terms are kept, justified; the linker now finds a compound across a line break ([D205 Trust level and encryption level keep their words][D205]-[D208 The lease is marked, and goes with the journal fence][D208]).

## Not yet specified

- Code identifiers a word decision touches, each an issue once found.

## Out of scope

- [I93 Naming facts][I93]: deferred until a consumer app is about to pin its first attribute names ([D198 Map 3 finishes lean][D198]).
- The lab qualifier ([D101 Lab and production][D101]): named when [I58 Several servers in the lab][I58] or [I8 Workflow engine scale-out and more workflow runners on the server][I8] is picked up ([D203 The lab qualifier, the four states and the kinds of intent wait][D203]).
- Hot, frontier, warm and cold ([D132 Four states at every level][D132]): `Decide when:` a page, tool or gate shows a thing's state by name ([D203 The lab qualifier, the four states and the kinds of intent wait][D203]).
- The kinds of intent ([D132 Four states at every level][D132]): named when a tool records an intent's kind or map 6 is charted, without the bare word "prompt" ([D195 Prompt is not a term][D195], [D203 The lab qualifier, the four states and the kinds of intent wait][D203]).

- Alchemy's names ([I28 Alchemy: infrastructure as Effects][I28]): with [I7 Production hosting, deployment and telemetry backend][I7].
- The reader test ([I21 Test the glossary with a reader outside software][I21]): map 4, which judges this map's result.
- Building [I32 Ideas batch: explain any word on demand][I32]: only its trigger is checked ([I94 Words in another project's sense][I94]).
- [I78 Research: Effect's vocabulary against ours][I78]'s question 12 (tool calls, approval, a stored result, a model's name): map 6, carried on [I29 Ideas batch: agents that record a replayable run][I29].

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../../adr/0032-what-viviefs-is-about.md
[D101]: ../bootstrap/02-decision-log.md#d101
[D102]: ../bootstrap/02-decision-log.md#d102
[D132]: ../bootstrap/02-decision-log.md#d132
[D135]: ../bootstrap/02-decision-log.md#d135
[D137]: ../bootstrap/02-decision-log.md#d137
[D162]: ../bootstrap/02-decision-log.md#d162
[D163]: ../bootstrap/02-decision-log.md#d163
[D169]: ../bootstrap/02-decision-log.md#d169
[D170]: ../bootstrap/02-decision-log.md#d170
[D172]: ../bootstrap/02-decision-log.md#d172
[D173]: ../bootstrap/02-decision-log.md#d173
[D174]: ../bootstrap/02-decision-log.md#d174
[D175]: ../bootstrap/02-decision-log.md#d175
[D177]: ../bootstrap/02-decision-log.md#d177
[D180]: ../bootstrap/02-decision-log.md#d180
[D180']: ../bootstrap/02-decision-log.md#d180p
[D181]: ../bootstrap/02-decision-log.md#d181
[D185]: ../bootstrap/02-decision-log.md#d185
[D186]: ../bootstrap/02-decision-log.md#d186
[D195]: ../bootstrap/02-decision-log.md#d195
[D197]: ../bootstrap/02-decision-log.md#d197
[D198]: ../bootstrap/02-decision-log.md#d198
[D199]: ../bootstrap/02-decision-log.md#d199
[D200]: ../bootstrap/02-decision-log.md#d200
[D203]: ../bootstrap/02-decision-log.md#d203
[D204]: ../bootstrap/02-decision-log.md#d204
[D205]: ../bootstrap/02-decision-log.md#d205
[D208]: ../bootstrap/02-decision-log.md#d208
[D44]: ../bootstrap/02-decision-log.md#d44
[D44']: ../bootstrap/02-decision-log.md#d44p
[D94']: ../bootstrap/02-decision-log.md#d94p
[I21]: ../../issues/0021-test-the-glossary-with-a-reader.md
[I26]: ../../issues/0026-glossary-links-on-words-that-are-not-our-terms.md
[I28]: ../../issues/0028-alchemy-infrastructure-as-effects.md
[I29]: ../../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md
[I30]: ../../issues/0030-ideas-batch-glossary-entries-written-as-effects.md
[I32]: ../../issues/0032-ideas-batch-explain-any-word-on-demand.md
[I33]: ../../issues/0033-ideas-batch-abstractions-that-constrain-agents.md
[I58]: ../../issues/0058-several-servers-in-the-lab.md
[I7]: ../../issues/0007-production-hosting-and-telemetry-backend.md
[I77]: ../../issues/0077-change-has-two-meanings.md
[I78]: ../../issues/0078-research-effect-vocabulary-against-ours.md
[I8]: ../../issues/0008-engine-scale-out.md
[I80]: ../../issues/0080-build-the-journal-fence.md
[I88]: ../../issues/0088-effect-and-the-effect-handler.md
[I89]: ../../issues/0089-how-a-word-is-chosen-and-written.md
[I90]: ../../issues/0090-pattern-concept-contract-abstraction.md
[I91]: ../../issues/0091-effects-names-against-ours.md
[I92]: ../../issues/0092-map-2s-new-words.md
[I93]: ../../issues/0093-naming-facts.md
[I94]: ../../issues/0094-words-in-another-projects-sense.md
[I95]: ../../issues/0095-build-the-glossary-linker-as-decided.md
[I96]: ../../issues/0096-accept-the-vocabulary.md
[I97]: ../../issues/0097-a-preview-on-every-link-in-a-pages-text.md
[I99]: ../../issues/0099-code-names-for-map-3s-retired-words.md
[P17]: ../bootstrap/06-qualification-gates.md#p17
