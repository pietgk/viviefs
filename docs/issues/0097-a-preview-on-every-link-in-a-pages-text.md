# I97: A preview on every link in a page's text

Status: ready-for-agent

Category: enhancement

Found: 2026-10-28

## What

A link a page's author wrote to another site page shows no preview card, while the site's own reference and glossary links do ([D90' A preview on every link in the text][D90']). Found in the human's review of [I89 How a word is chosen and written][I89] on How a pattern is delivered (`apps/docs/src/content/docs/index.mdx`): the first "ADRs" is a glossary link and previews; "shown next to it under ADRs", written `[ADRs](/reference/adr/)`, goes to the ADR list and does not. The page's text has 46 links with a preview and 7 without (glossary, ADRs twice, Evidence, Guides, Log store, a research page).

Build, test first:

- every link in a page's text to a site page carries the preview data `reference-links.ts` writes for references: kind Page, the page's title, and its first sentence (its frontmatter `description`, a rendered README's first sentence, an ADR's Summary);
- the sidebar and the page's table of contents stay plain;
- the first-use rule for glossary terms is unchanged ([D94 A glossary a newcomer can read][D94]);
- an end-to-end check on the docs site that hovering and focusing the second "ADRs" on How a pattern is delivered shows its card.

Builds alongside [I95 Build the glossary linker as decided][I95], which changes the same linker.

## Comments

2026-10-28: [D198 Map 3 finishes lean][D198]: moved to phase 3's first batch, with [I98 Diagram labels and named identifiers get the checks prose gets][I98] and [I99 Code names for map 3's retired words][I99]; it no longer waits for [I95 Build the glossary linker as decided][I95].

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D90']: ../plan/bootstrap/02-decision-log.md#d90p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
[I98]: 0098-diagram-labels-and-named-identifiers-get-the-checks-prose-gets.md
[I99]: 0099-code-names-for-map-3s-retired-words.md
