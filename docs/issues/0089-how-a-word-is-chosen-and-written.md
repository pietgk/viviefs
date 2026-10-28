# I89: How a word is chosen and written

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I88 Effect and the effect handler][I88]

Found: 2026-10-27

## What

Decide the rules every other ticket of map 3 applies when it picks a word and writes its glossary entry, starting from the rule the charting set. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

The charting's rule (the human, 2026-10-27): a single-word term is used only where its meaning matches our own use and the libraries we use, inside and outside, as entity did ([D137 One meaning of entity][D137]); otherwise the term is a compound that names its context (a workflow runner, an OPFS worker, a test runner), and compounds are welcome where they make communication clearer. Effect's names come first ([D135 Effect's names first][D135]).

Decide, with worked entries from [I88 Effect and the effect handler][I88]'s result:

- the single-word rule as a decision, and whether a risky bare word is always written as its compound in prose too;
- what an entry carries beyond [D94 A glossary a newcomer can read][D94]'s plain sentence: a "like X, except Y" line for a newcomer ([D162 Portability, two halves][D162]), a "not Effect's X" line where Effect uses the word otherwise ([I78 Research: Effect's vocabulary against ours][I78]), and the reason a replaced word was replaced;
- whether the glossary opens with a thesis and keeps its groups;
- whether the growth of the glossary and the list of patterns is a risk to review, and by what measure.

Rows settled here, from [the vivief inventory](../research/2026-10-06-vivief-inventory.md), map 3: `vivief:glossary-shape`, `vivief:deprecated-terms`, `vivief:names-that-carry-context`, `viviefs:plain-glossary`, `vivief:surface-area-as-risk`.

## Comments

2026-10-28: from [I88 Effect and the effect handler][I88]. Worked entries to start from: effect and Effect handler ([D163 One meaning of effect, named by phase][D163]-[D169 A command decides][D169]), the first lower-case entry and the first with a "like X, except Y" line. Also for this ticket, from [I30 Ideas batch: glossary entries written as effects][I30]: vivief's quick reference lists each deprecated term with what replaced it and why (`Analyser` became `Extractor`, "clearer: it extracts data into seeds"); does an Avoid line say why?

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D162]: ../plan/bootstrap/02-decision-log.md#d162
[D163]: ../plan/bootstrap/02-decision-log.md#d163
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
