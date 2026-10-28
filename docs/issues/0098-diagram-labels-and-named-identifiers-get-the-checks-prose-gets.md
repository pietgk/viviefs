# I98: Diagram labels and named identifiers get the checks prose gets

Status: ready-for-agent

Category: enhancement

Found: 2026-10-28

## What

`verify` reads no Mermaid label, and checks no identifier the stack owns except a repository path, so a diagram or a document can keep a name a decision has since changed ([D180 Diagram labels are prose][D180]). Found in the human's review of [I89 How a word is chosen and written][I89]: the first diagram of How a pattern is delivered still named `metadata.guide` a month after [D84 Exemplar of several guides][D84] made it `metadata.guides`, and four of the five errors on that page were in diagrams, where the reference names ([D86' Named references in every living document][D86']), the repository paths ([D87 References resolved when rendered][D87]) and the glossary links ([D94 A glossary a newcomer can read][D94]) are never checked, because all three skip code blocks.

Build, test first, each with a failing case taken from that page:

- the reference and repository-path checks read Mermaid labels in every living document, as they read prose;
- the identifiers the stack owns are checked where a living document names them: `project.json` `metadata` keys, `pnpm` scripts, `verify` step names and the pinned `viviefs/...` attribute names; a name none of them has fails, so a rename fails wherever a document still uses the old name;
- a wrong meaning is not this issue's: no check can tell that a gate proves a claim and not a fact ([I21 Test the glossary with a reader outside software][I21]).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D180]: ../plan/bootstrap/02-decision-log.md#d180
[D84]: ../plan/bootstrap/02-decision-log.md#d84
[D86']: ../plan/bootstrap/02-decision-log.md#d86p
[D87]: ../plan/bootstrap/02-decision-log.md#d87
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I21]: 0021-test-the-glossary-with-a-reader.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
