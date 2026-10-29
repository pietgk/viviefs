# I98: Diagram labels and named identifiers get the checks prose gets

Status: resolved

Category: enhancement

Found: 2026-10-28

## What

`verify` reads no Mermaid label, and checks no identifier the stack owns except a repository path, so a diagram or a document can keep a name a decision has since changed ([D180 Diagram labels are prose][D180]). Found in the human's review of [I89 How a word is chosen and written][I89]: the first diagram of How a pattern is delivered still named `metadata.guide` a month after [D84 Exemplar of several guides][D84] made it `metadata.guides`, and four of the five errors on that page were in diagrams, where the reference names ([D86' Named references in every living document][D86']), the repository paths ([D87 References resolved when rendered][D87]) and the glossary links ([D94 A glossary a newcomer can read][D94]) are never checked, because all three skip code blocks.

Build, test first, each with a failing case taken from that page:

- the reference and repository-path checks read Mermaid labels in every living document, as they read prose;
- the identifiers the stack owns are checked where a living document names them: `project.json` `metadata` keys, `pnpm` scripts, `verify` step names and the pinned `viviefs/...` attribute names; a name none of them has fails, so a rename fails wherever a document still uses the old name;
- a wrong meaning is not this issue's: no check can tell that a gate proves a claim and not a fact ([I21 Test the glossary with a reader outside software][I21]).

## Comments

2026-10-29: from [I94 Words in another project's sense][I94] ([D180' Retired words in code font][D180']): the retired-word check is `verify`'s `retired-words` step (`tools/verify/src/retired-words.ts`). It reads prose and skips fenced code, so a Mermaid label is not read yet; this issue adds diagram labels to it, as to the other prose checks. A label in another project's words is marked as prose is ([D204 Words in another project's sense][D204]).

2026-10-29: Built, test first. A Mermaid label is read as prose by one module, `libs/references/src/diagram-labels.ts`: flowchart node, edge and subgraph labels, state transitions and notes, sequence messages, participants and block titles, each with its source line; a node id, an arrow and a style line are structure. The checks read it:

- the site build fails an unknown id or a missing repository path in a label, as in prose; a label cannot hold a link, so the diagram stays as written, and an evidence note keeps a stale path, as in prose;
- `pnpm refs check` fails an unknown id in a label, with its line;
- the `retired-words` step reads a code span in a label;
- a new `identifiers` step (`tools/verify/src/named-identifiers.ts`) fails a `project.json` `metadata` key, a `pnpm` command that is neither a root script nor pnpm's own, a `verify` selector (`pnpm verify retire-words`, the `guide` step) and a `viviefs/` name the code does not define, in prose code font and in a label, outside a block quote and another project's words. The names come from the repository: every `project.json` `metadata` key and the key `verify` refuses there (`evidenceOwner`), the root scripts, the stages and steps, and every string literal outside tests that is wholly a `viviefs/` name. It reads the living documents, the glossary and the site's own pages, since How a pattern is delivered is one; the decision log and resolved issues are kept as written. It runs in the docs-only rule.

The failing cases are the page's: its exemplar arrow labelled `metadata.guide` fails the `identifiers` step at line 73, and an unknown id in its lifecycle diagram fails the site build. Found on the way: the log-store guide spec named `metadata.guide` twice, a month after [D84 Exemplar of several guides][D84], now worded without the old key; and a research note quotes Effect's `pnpm ai-docgen`, now marked as their words ([D204 Words in another project's sense][D204]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D180]: ../plan/bootstrap/02-decision-log.md#d180
[D180']: ../plan/bootstrap/02-decision-log.md#d180p
[D204]: ../plan/bootstrap/02-decision-log.md#d204
[D84]: ../plan/bootstrap/02-decision-log.md#d84
[D86']: ../plan/bootstrap/02-decision-log.md#d86p
[D87]: ../plan/bootstrap/02-decision-log.md#d87
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I21]: 0021-test-the-glossary-with-a-reader.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I94]: 0094-words-in-another-projects-sense.md
