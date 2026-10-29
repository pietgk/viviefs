# I95: Build the glossary linker as decided

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: task

Blocked by: [I94 Words in another project's sense][I94]

Found: 2026-10-27

## What

Change the docs site's glossary linker (`termFinder` in `apps/docs/src/lib/references.ts`, run by `apps/docs/src/lib/reference-links.ts`) to do what [I94 Words in another project's sense][I94] decided, inside map 3 so the closing review sees the site right. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Done when the cases in [I26 Glossary links on words that are not our terms][I26]'s Observed table, and the ones [I94 Words in another project's sense][I94] adds, are each covered by a test, `pnpm verify` is green, and the pages map 3 edited render with links only in our sense. A bug found on the way starts with an end-to-end reproduction on the docs site.

## Answer

Built on 2026-10-29, test first, as [I94 Words in another project's sense][I94] decided ([D204 Words in another project's sense][D204], [D180' Retired words in code font][D180']):

- `libs/references/src/their-words.ts` reads the markers and their pairing, and knows a block quote; the site, `pnpm refs` and `verify` all use it, so they agree on what is marked.
- The site's linker (`apps/docs/src/lib/reference-links.ts`) resolves nothing inside a block quote or a their-words passage, and fails a mark without a name, a nested mark, a stray close and a mark left open. `apps/docs/src/lib/reference-links.test.ts` has a test per row of [I26 Glossary links on words that are not our terms][I26]'s Observed table and per case of its comments and [I94 Words in another project's sense][I94]'s, in Markdown and in MDX.
- `pnpm refs fix` leaves bare ids inside a mark, still names reference-style links there, and `pnpm refs check` reports a broken pairing.
- `verify` has a `retired-words` step (`tools/verify/src/retired-words.ts`): a word the glossary retired in code font fails in a living document outside a mark. It is in the docs-only steps. Diagram labels join it in [I98 Diagram labels and named identifiers get the checks prose gets][I98].
- Three uses of a retired word in our sense were rewritten: [ADR-0013 Device durability][ADR-0013] (workflow engines, durable deferreds), [ADR-0016 Commands, server validation and rejection][ADR-0016] (workflow engine) and the architecture page (durable deferreds). How to mark a passage is in `docs/agents/domain.md`.

## Comments

2026-10-28: built by [I88 Effect and the effect handler][I88] because its entries needed it ([D164 Effect and effect, told apart by case][D164]): `termFinder` in `apps/docs/src/lib/references.ts` matches a term as written before any case, a name in `PROPER_NOUNS` keeps its capitals in its anchor (`#Effect`), and `parseGlossary` rejects two entries that share an anchor. This ticket builds the rest on it.

2026-10-28: from [I89 How a word is chosen and written][I89]'s review ([D180 Diagram labels are prose][D180]). Also build here: a word retired under [D175 A retired word names its decision][D175] (its new entry's `_Avoid_` line names the decision that retired it) fails `verify` wherever a living document uses it outside a passage [I94 Words in another project's sense][I94]'s mark sets apart, with a test per case. The linker already reads `_Not_` lines ([D174 Like, Not and Avoid lines][D174]); the retired words come from the `_Avoid_` lines the same parser reads.

2026-10-28: [D198 Map 3 finishes lean][D198]: built in the same session as [I94 Words in another project's sense][I94]'s decision, right after it.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0013]: ../adr/0013-device-durability.md
[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[D164]: ../plan/bootstrap/02-decision-log.md#d164
[D174]: ../plan/bootstrap/02-decision-log.md#d174
[D175]: ../plan/bootstrap/02-decision-log.md#d175
[D180]: ../plan/bootstrap/02-decision-log.md#d180
[D180']: ../plan/bootstrap/02-decision-log.md#d180p
[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D204]: ../plan/bootstrap/02-decision-log.md#d204
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I94]: 0094-words-in-another-projects-sense.md
[I98]: 0098-diagram-labels-and-named-identifiers-get-the-checks-prose-gets.md
