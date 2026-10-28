# I90: Pattern, concept, contract, abstraction

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Give each of the architecture words a newcomer meets first, pattern, concept, foundation concept, contract and abstraction, one meaning, by [I89 How a word is chosen and written][I89]'s rules. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Inputs:

- "Foundation concept" ([D160 The foundation concepts][D160], [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]) against [D82 Patterns build on each other][D82]'s concept (a candidate that is not yet a pattern).
- "Abstraction" or "pattern" ([I33 Ideas batch: abstractions that constrain agents][I33]).
- Contract: ours is what a part promises, an Effect service and its types checked by suites; vivief's `Contract` is spec, test and runtime guard with a trust part ([D124-D129 Accepting a change][D124-D129] adopted its placement).
- Feature: ours is a vertical slice of the app; vivief's `Feature` slice is data and logic.

Rows settled here, from [the vivief inventory](../research/2026-10-06-vivief-inventory.md), map 3: `vivief:concept-vs-pattern` and `viviefs:pattern`, `vivief:contract` and `viviefs:contract`, `viviefs:project-kinds-and-boundaries`. [I33 Ideas batch: abstractions that constrain agents][I33] gets a comment confirming or narrowing what is left of it.

## Answer

Decided with the human on 2026-10-28 in two rounds, on [the review page](../research/2026-10-28-pattern-concept-contract-abstraction-review.html), all as recommended. The page set vivief's concept, pattern, `Contract` and Feature beside ours, with where each already landed, and counted each word in the living documents. The clash that mattered was inside our own text: [D82 Patterns build on each other][D82]'s "otherwise it is a concept" made concept mean "not a pattern", while Pattern is the first foundation concept and [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] called every foundation concept a pattern, the datom included.

**Round 1.** Concept is the wider word: a pattern is the kind of concept with a contract, a suite and a gate, and every other concept is owned by one pattern; the glossary gains Concept and Foundation concept, and [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] is amended where it called each foundation concept a pattern ([D181 Concept is the wider word][D181]). "Abstraction" stays plain English ([D182 Abstraction stays plain English][D182]). Pattern keeps its word with `_Like_` and `_Not_` lines, and the Effect notes in `.agents/patterns/` move to `.agents/extracts/`, so the repository holds one sense ([D183 Pattern keeps its word][D183]). Contract keeps its word, Effect's sense, with vivief's on its `_Not_` line ([D184 Contract keeps its word][D184]). Feature keeps its word, and "no feature code before its gate passes" becomes "no production code", as [D27 Bootstrap output][D27] said ([D185 Feature keeps its word][D185]).

**Round 2.** The rows below, and [I33 Ideas batch: abstractions that constrain agents][I33] narrowed to map 4.

| Row | Disposition |
| --- | --- |
| `vivief:concept-vs-pattern`, `viviefs:pattern` | keep ours, with concept as the wider word; no stage before a pattern: a candidate whose contract, suite and gate are planned is a pattern whose ADR is Proposed, unverified ([D181 Concept is the wider word][D181]) |
| `vivief:contract`, `viviefs:contract` | keep ours, one word; vivief's sense is on the `_Not_` line ([D184 Contract keeps its word][D184]) |
| `viviefs:project-kinds-and-boundaries` | stands; Feature keeps its word ([D185 Feature keeps its word][D185]) |

Checks before a word is retired ([D173 What a word change rewrites, and where it is written][D173]): no word is retired. The one name changed is the folder `.agents/patterns/`, which is no persisted name and no code reads; `skills-lock.json` does not cover it. Living documents edited: `GLOSSARY.md` (Concept and Foundation concept new; Pattern, Contract, Feature and Builds on), [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] (amended), [ADR-0026 Verify - Qualify - Teach][ADR-0026] and [ADR-0029 Effect reference subtree and language service][ADR-0029], AGENTS.md, the docs home page's diagram, the log-store guide spec, the open items, the bootstrap handover, map 3, [I33 Ideas batch: abstractions that constrain agents][I33] and next-session. Code: none.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0026]: ../adr/0026-verify-qualify-teach.md
[ADR-0029]: ../adr/0029-effect-reference-and-language-service.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D124-D129]: ../plan/bootstrap/02-decision-log.md#d124-d129
[D160]: ../plan/bootstrap/02-decision-log.md#d160
[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D181]: ../plan/bootstrap/02-decision-log.md#d181
[D182]: ../plan/bootstrap/02-decision-log.md#d182
[D183]: ../plan/bootstrap/02-decision-log.md#d183
[D184]: ../plan/bootstrap/02-decision-log.md#d184
[D185]: ../plan/bootstrap/02-decision-log.md#d185
[D27]: ../plan/bootstrap/02-decision-log.md#d27
[D82]: ../plan/bootstrap/02-decision-log.md#d82
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
