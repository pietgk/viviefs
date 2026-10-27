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

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I94]: 0094-words-in-another-projects-sense.md
