# I95: Build the glossary linker as decided

Status: ready-for-agent

Category: enhancement

Effort: docs/plan/vocabulary/

Type: task

Blocked by: [I94 Words in another project's sense][I94]

Found: 2026-10-27

## What

Change the docs site's glossary linker (`termFinder` in `apps/docs/src/lib/references.ts`, run by `apps/docs/src/lib/reference-links.ts`) to do what [I94 Words in another project's sense][I94] decided, inside map 3 so the closing review sees the site right. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Done when the cases in [I26 Glossary links on words that are not our terms][I26]'s Observed table, and the ones [I94 Words in another project's sense][I94] adds, are each covered by a test, `pnpm verify` is green, and the pages map 3 edited render with links only in our sense. A bug found on the way starts with an end-to-end reproduction on the docs site.

## Comments

2026-10-28: built by [I88 Effect and the effect handler][I88] because its entries needed it ([D164 Effect and effect, told apart by case][D164]): `termFinder` in `apps/docs/src/lib/references.ts` matches a term as written before any case, a name in `PROPER_NOUNS` keeps its capitals in its anchor (`#Effect`), and `parseGlossary` rejects two entries that share an anchor. This ticket builds the rest on it.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D164]: ../plan/bootstrap/02-decision-log.md#d164
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I88]: 0088-effect-and-the-effect-handler.md
[I94]: 0094-words-in-another-projects-sense.md
