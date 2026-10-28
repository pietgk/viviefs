# I96: Accept the vocabulary

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I88 Effect and the effect handler][I88], [I89 How a word is chosen and written][I89], [I90 Pattern, concept, contract, abstraction][I90], [I91 Effect's names against ours][I91], [I92 Map 2's new words][I92], [I93 Naming facts][I93], [I94 Words in another project's sense][I94], [I95 Build the glossary linker as decided][I95]

Found: 2026-10-27

## What

Check that map 3 reached its destination and let the human accept the glossary as it stands. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Check, and write the result in the Answer:

- every map-3 row of [the vivief inventory](../research/2026-10-06-vivief-inventory.md), every waiting word (the map's list) and [I78 Research: Effect's vocabulary against ours][I78]'s questions 1-11 has a disposition in a ticket's Answer;
- every glossary term has one meaning in the stack, and where another project (Effect first) uses the word otherwise, its entry says so;
- no living document still uses a retired word in its retired sense, and the docs site links each term only in our sense ([I95 Build the glossary linker as decided][I95]);
- the open issues whose `Decide when:` was map 3 ([I26 Glossary links on words that are not our terms][I26], [I30 Ideas batch: glossary entries written as effects][I30], [I33 Ideas batch: abstractions that constrain agents][I33], [I77 The word change has two meanings][I77]) are resolved or narrowed.

The human accepts the glossary in this session. [I21 Test the glossary with a reader outside software][I21] (map 4) then tests it with a reader.

## Comments

2026-10-28: from [I89 How a word is chosen and written][I89]. Two more checks for the Answer: every glossary term has passed the single-word rule ([D171 Every term passes the rule][D171]; [I89][I89]'s Answer holds the first sweep), and the terms map 3 added are reviewed against `verify`'s `glossary` report, an unused term removed or justified ([D178 Growth watched, not capped][D178]). The first report (2026-10-28) found 123 terms and two that no living document uses; [I89][I89]'s Answer names them. Record what this review finds in this ticket's Answer, not in a comment: the report reads open issues, so naming an unused term here would count as using it.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D171]: ../plan/bootstrap/02-decision-log.md#d171
[D178]: ../plan/bootstrap/02-decision-log.md#d178
[I21]: 0021-test-the-glossary-with-a-reader.md
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I77]: 0077-change-has-two-meanings.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I90]: 0090-pattern-concept-contract-abstraction.md
[I91]: 0091-effects-names-against-ours.md
[I92]: 0092-map-2s-new-words.md
[I93]: 0093-naming-facts.md
[I94]: 0094-words-in-another-projects-sense.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
