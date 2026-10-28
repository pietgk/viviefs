# I94: Words in another project's sense

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Decide how a page, a quote or a table says that its words are not our terms, so the docs site links a word to its glossary entry only where the page means our sense ([I26 Glossary links on words that are not our terms][I26]). Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

[I26 Glossary links on words that are not our terms][I26] holds the observed cases and the questions: how a passage is marked, whether a mark stops glossary links only or ids of another repository too, whether quotes are detected without a mark, and what `verify` reports. Add:

- how the linker tells `node` from Node.js, and Effects from Effect ([I78 Research: Effect's vocabulary against ours][I78], question 2), once [I88 Effect and the effect handler][I88] and [I92 Map 2's new words][I92] have named them;
- whether [I89 How a word is chosen and written][I89]'s compound terms remove most of the need for a mark.

[I32 Ideas batch: explain any word on demand][I32]'s trigger is this decision: a comment there confirms or narrows it; nothing of it is built here. The linker change is built in [I95 Build the glossary linker as decided][I95].

## Comments

2026-10-28: [I88 Effect and the effect handler][I88] settled one of the two: the linker tells Effects in Vision - View - Effects from Effect by the phrase's own entry (the longest term wins), and Effect from effect by case ([D164 Effect and effect, told apart by case][D164]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D164]: ../plan/bootstrap/02-decision-log.md#d164
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I32]: 0032-ideas-batch-explain-any-word-on-demand.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I92]: 0092-map-2s-new-words.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
