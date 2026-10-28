# I21: Test the glossary with a reader outside software

Status: ready-for-human

Category: enhancement

Found: 2026-10-02

## What

The glossary was rewritten so every definition starts with one plain sentence ([D94 A glossary a newcomer can read][D94]), and a reader outside software should confirm that it now explains the terms that lost him before, such as "pattern". Read the docs site with him, hover the linked terms, and note every term or sentence that still confuses him in a comment here; each one is rewritten.

## Comments

2026-10-28: from [I89 How a word is chosen and written][I89]'s review ([D180 Diagram labels are prose][D180]). Five errors the human found on How a pattern is delivered, the page a newcomer reads first, are cases a reader or a review must catch, since no check can: an arrow from ADR to exemplar labelled "shapes", naming no relation; a gate that proves "one fact" (a fact is a datom; a gate proves a claim), in a diagram and in a table; an ADR lifecycle ending in Delivered, which is a pattern's state, and missing direct acceptance of an intent record ([D65' Intent records accepted directly][D65']); and accept called "Validation ... invariants" in the architecture diagram, words the glossary avoids for it. All were drift from later decisions, all are fixed. They are evidence for map 4's question of how an error in the language is caught: a reader, an agent review of a changed page against the glossary, or both.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D180]: ../plan/bootstrap/02-decision-log.md#d180
[D65']: ../plan/bootstrap/02-decision-log.md#d65p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I89]: 0089-how-a-word-is-chosen-and-written.md
