# I93: Naming facts

Status: ready-for-human

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Decide when: a consumer app is about to pin its first attribute names

Blocked by: [I88 Effect and the effect handler][I88], [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Decide whether attribute names follow a tense rule and whether each consumer app gets its own attribute namespace, before a consumer app pins its first names ([D44 Never rename, never migrate][D44]). Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Inputs:

- `vivief:past-tense-fact-naming`: every datom past tense or a noun, never imperative, even a request is a fact. Ours: an intent goes to a command and only the changeset is stored ([D36' Shared commands, as built][D36']); the pinned `viviefs/` names mix past tense and nouns (`viviefs/workflow/started`, `viviefs/membership/granted`, `viviefs/activity/exit`, `viviefs/clock/wake-at`), and [P05 Changesets and projections][P05] holds a vocabulary pass for attribute names. Whether a request is ever a fact follows from [I88 Effect and the effect handler][I88]'s intent.
- `vivief:cross-domain-references`: a namespace per domain and qualified ids across domains. Ours: the stack's attributes carry `viviefs/`, every entity lives under its organization's root ([D38 Entity ids and strict composition][D38]); nothing names an app's namespace.

Pinned names never change; a rule applies to new names.

Rows settled here, from [the vivief inventory](../research/2026-10-06-vivief-inventory.md), map 3: `vivief:past-tense-fact-naming`, `vivief:cross-domain-references`.

## Comments

2026-10-28: Deferred by [D198 Map 3 finishes lean][D198]: no consumer app pins names yet, and pinned names never change, so the rule is needed before the first one, not now.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D38]: ../plan/bootstrap/02-decision-log.md#d38
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
