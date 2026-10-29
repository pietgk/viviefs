# I94: Words in another project's sense

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Decide how a page, a quote or a table says that its words are not our terms, so the docs site links a word to its glossary entry only where the page means our sense ([I26 Glossary links on words that are not our terms][I26]). Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

[I26 Glossary links on words that are not our terms][I26] holds the observed cases and the questions: how a passage is marked, whether a mark stops glossary links only or ids of another repository too, whether quotes are detected without a mark, and what `verify` reports. Add:

- how the linker tells node from Node.js, and Effects from Effect ([I78 Research: Effect's vocabulary against ours][I78], question 2), once [I88 Effect and the effect handler][I88] and [I92 Map 2's new words][I92] have named them;
- whether [I89 How a word is chosen and written][I89]'s compound terms remove most of the need for a mark.

[I32 Ideas batch: explain any word on demand][I32]'s trigger is this decision: a comment there confirms or narrows it; nothing of it is built here. The linker change is built in [I95 Build the glossary linker as decided][I95].

## Answer

Decided with the human on 2026-10-29 in one round, on [the review page](../research/2026-10-29-words-in-another-projects-sense-review.html), confirming [D198 Map 3 finishes lean][D198]'s defaults; all five questions as recommended. The page ran [I26 Glossary links on words that are not our terms][I26]'s cases, and the ones this issue added, through the real linker, and counted the retired words in the living documents.

- **The compounds did not remove the need for a mark.** They removed 2 of [I26 Glossary links on words that are not our terms][I26]'s 10 wrong links (Cursor, now Sync cursor). The other 8 are words we keep on purpose (Workflow, Builds on, App, Attribute, Pattern, Gate step, Effect, actor, Decision), and `P95` still failed the build.
- **The mark** ([D204 Words in another project's sense][D204]): every block quote, and a comment pair around a passage, a table or a phrase, `<!-- their words: whose -->` and `<!-- /their words -->` (JSX comments in MDX). Inside, nothing is resolved against this repository: no glossary link, no bare id, no path check, URL links kept as written; a reference-style link still resolves. A mark without a name, nested, stray or left open fails the build and `verify`.
- **Retired words** ([D180' Retired words in code font][D180']): `verify` fails a retired word only in the form its `_Avoid_` line writes it, in code font; today `node`. The count found about 230 uses of the eight retired words outside their compounds, nearly all correct; three meant the retired sense ([ADR-0013 Device durability][ADR-0013] twice, [ADR-0016 Commands, server validation and rejection][ADR-0016], the architecture page) and were rewritten.
- **[I26 Glossary links on words that are not our terms][I26]'s other questions**: no front-matter or folder mark, no detection beyond block quotes, no report of ambiguous senses, no more `EVERYDAY_TERMS`. Node from Node.js and Effects from Effect were settled by [D199 Sync node][D199] and [D164 Effect and effect, told apart by case][D164].
- **[I32 Ideas batch: explain any word on demand][I32]**: its trigger fired; a comment there narrows it.

Built in [I95 Build the glossary linker as decided][I95] in the same session.

## Comments

2026-10-28: [I88 Effect and the effect handler][I88] settled one of the two: the linker tells Effects in Vision - View - Effects from Effect by the phrase's own entry (the longest term wins), and Effect from effect by case ([D164 Effect and effect, told apart by case][D164]).

2026-10-28: [I91 Effect's names against ours][I91] left these bare words to other projects, so a passage that uses one in their sense is the case to mark: engine (a JavaScript or database engine), worker (a worker thread, Effect's `workers/Worker`), runner (an Effect Cluster or test runner), deferred (Effect's `Deferred`), manifest (Expo's and the web app manifest), cursor (a database cursor, Cursor the editor), registry (Effect's `AtomRegistry`), tool in a model's sense (Effect's `Tool`), prompt, session (Effect's `Chat`) and scope ([D186 Workflow engine and workflow runner][D186]-[D197 Evidence registry, and the code names follow in one issue][D197]). The case [I26 Glossary links on words that are not our terms][I26] observed, Cursor the editor linked to our entry, is gone: the term is Sync cursor ([D193 Sync cursor][D193]). Tool joined the linker's everyday terms, so "a model's tool" does not link ([D194 Tool is an app for those who build apps][D194]); Deferred and Worker left them.

2026-10-28: [D198 Map 3 finishes lean][D198]: decided and built with [I95 Build the glossary linker as decided][I95] in one session. The human confirms defaults in one round: a block quote, and one explicit mark around a passage or table in another project's words, switch off glossary links and ids inside it; a retired word fails `verify` outside such a passage; a test per case of [I26 Glossary links on words that are not our terms][I26]'s table.

2026-10-28: [I92 Map 2's new words][I92] named the words this issue was waiting on. The case of node against Node.js is gone: the term is Sync node, and bare node is left to Node.js, the DOM's `Node`, React's `ReactNode` and a Kubernetes node ([D199 Sync node][D199]). Bare surface is left to React Native's surface, Android's and Material's `Surface`, and an API or attack surface; the term is Presentation surface ([D200 Presentation surface and screen][D200]). Frame keeps its word, so a passage about animation frames, iframes, stack frames or WebSocket frames is a case to mark ([D201 Frame keeps its word][D201]). The one retired form `verify` fails is `node` in code font, outside a marked passage; bare node and bare surface are never checked ([D199][D199]). Dated comments in open issues that quote the old words ([I26 Glossary links on words that are not our terms][I26], [I34 vivief as the source of ViViEfs's concepts][I34]) are records, kept as written.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0013]: ../adr/0013-device-durability.md
[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[D164]: ../plan/bootstrap/02-decision-log.md#d164
[D180']: ../plan/bootstrap/02-decision-log.md#d180p
[D186]: ../plan/bootstrap/02-decision-log.md#d186
[D193]: ../plan/bootstrap/02-decision-log.md#d193
[D194]: ../plan/bootstrap/02-decision-log.md#d194
[D197]: ../plan/bootstrap/02-decision-log.md#d197
[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D199]: ../plan/bootstrap/02-decision-log.md#d199
[D200]: ../plan/bootstrap/02-decision-log.md#d200
[D201]: ../plan/bootstrap/02-decision-log.md#d201
[D204]: ../plan/bootstrap/02-decision-log.md#d204
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I32]: 0032-ideas-batch-explain-any-word-on-demand.md
[I34]: 0034-vivief-as-the-source-of-viviefs-concepts.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I91]: 0091-effects-names-against-ours.md
[I92]: 0092-map-2s-new-words.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
