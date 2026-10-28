# I89: How a word is chosen and written

Status: resolved

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

## Answer

Decided with the human on 2026-10-28 in three rounds, on [the review page](../research/2026-10-28-how-a-word-is-chosen-and-written-review.html), all as recommended, Q5 with a note. The page set vivief's quick reference (its thesis, glossary groups, replaced-words table and the reviews that named surface area the biggest risk) beside the glossary, and ran the charting's rule on every single-word term.

**Round 1.** A single word is a term only where it matches: the libraries named (Effect fully, then the web platform, Node.js, React Native and Expo, SQLite, Postgres, OpenTelemetry, TypeScript, and the vocabularies of Temporal and event sourcing), and "matches" is [D137 One meaning of entity][D137]'s shared core with the difference stated ([D170 One word only where it matches][D170]). Every term passes the rule, today's included ([D171 Every term passes the rule][D171]). Where a term is a compound, prose writes the compound every time ([D172 The compound, every time][D172]). The map's rewrite and record rules, plus code comments and JSDoc ([D173 What a word change rewrites, and where it is written][D173]).

**Round 2.** An entry may end with `_Like_`, `_Not_` and `_Avoid_` lines, once each and in that order; the build fails a `_Like_` line without "except" ([D174 Like, Not and Avoid lines][D174]). A retired word names the decision that retired it, whose row holds the reason ([D175 A retired word names its decision][D175]). The glossary opens with [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s thesis, how to read an entry, and Start here ([D176 The glossary opens with its thesis][D176]); its groups follow the one turn ([D177 Groups follow the one turn][D177]). The human's note on Q5: the hover preview was designed to show a short, easy line, and that had fallen through the cracks. Reproduced on the docs site: the preview showed the first source line of an entry, cut mid-sentence for 67 of 123 terms, because the parser stopped a definition at its first line break (since 2026-10-02). The first line is now the hover line, one plain sentence of at most 120 characters with no code font and no reference, checked by the build ([D94' The hover line][D94']).

**Round 3.** Growth is watched, not capped: what a newcomer must hold is Start here; `verify`'s new `glossary` step reports the number of terms and any term no living document uses, and each map's acceptance reviews the terms it added ([D178 Growth watched, not capped][D178]).

**Review after the rounds.** The human found "kept on their phone" in Quarantine sloppy where browsers and laptops are devices too: a definition names the general thing, and a platform appears only as an example ([D179 A definition names the general thing][D179]). Eight entries were corrected, and at the human's request the living documents were swept the same way ([ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032], [ADR-0033 The Presenter pattern][ADR-0033], [ADR-0036 The journal is the fence][ADR-0036], the log-store lesson on time, [I11 Quarantine of user content after a lost lease][I11], [I14 Physical devices, and a notification tap that completes a deferred][I14], [I28 Alchemy: infrastructure as Effects][I28], [I32 Ideas batch: explain any word on demand][I32], [I61 Rename evidence-mobile to evidence-client][I61], [I63 The columnar copy as a Presenter implementation][I63], [I67 Minting entity id segments][I67], [I80 Build the journal fence][I80]); Frame subscription, which had only a hover line, got a precise part from [D109 Frame and frame subscription][D109]. The same review found that a hand-written link to a site page shows no preview while a glossary link with the same words does: every link in a page's text previews ([D90' A preview on every link in the text][D90']), built in [I97 A preview on every link in a page's text][I97]. And five errors on that page's diagrams and table, all drift from later decisions ("shapes", a gate proving "one fact", `metadata.guide`, an ADR lifecycle ending in Delivered, accept called "Validation"), were fixed; what can be checked mechanically is [D180 Diagram labels are prose][D180], built in [I98 Diagram labels and named identifiers get the checks prose gets][I98] and [I95 Build the glossary linker as decided][I95], and the rest is evidence for [I21 Test the glossary with a reader outside software][I21].

| Row | Disposition |
| --- | --- |
| `vivief:glossary-shape` | adopt the thesis-first opening ([D176 The glossary opens with its thesis][D176]); groups follow the one turn, not vivief's concepts ([D177 Groups follow the one turn][D177]) |
| `vivief:deprecated-terms` | adopt the reason, kept in the decision row that retired the word ([D175 A retired word names its decision][D175]) |
| `vivief:names-that-carry-context` | adopt, as the single-word rule ([D170 One word only where it matches][D170], [D172 The compound, every time][D172]) |
| `viviefs:plain-glossary` | stands, amended: the first line is the hover line ([D94' The hover line][D94']) |
| `vivief:surface-area-as-risk` | adopt the measure of what a newcomer holds, not vivief's trims ([D178 Growth watched, not capped][D178]) |

The sweep of the 67 single-word terms ([D171 Every term passes the rule][D171]): 46 stand (Service, Layer, Workflow, Activity, effect and Effect match Effect; ViViEfs, Implementation, Attribute, Datom, Changeset, Basis, Projector, Presenter, Enrichment, Organization, Outbox, Quarantine, Lease, Execution, Person, Membership, Caller, HLC, Crypto-shredding, Tamper-evidence, Guide, Exemplar, Lib, App, Server, Device, Claim, Gate, Probe, Ledger, Verdict, Lesson, Exercise, ADR, IntentComposer, Accepted, Qualified, Delivered, Verify and Qualify have no clash found); 4 share their core with another library's word and now carry a `_Like_` line (Entity, Identity, Blob, Suite); 11 clash and are held by [I90 Pattern, concept, contract, abstraction][I90] (Pattern, Contract, Feature), [I91 Effect's names against ours][I91] (Worker, Journal, Envelope, Deferred, Registry, Command, Decision) and [I92 Map 2's new words][I92] (Frame); 6 clashed and were held by none, and join [I91][I91]: Origin, Manifest, Intent, Cursor, Engine and actor.

Checks before a word is retired ([D173 What a word change rewrites, and where it is written][D173]): no word is retired. Living documents edited: `GLOSSARY.md` (opening, Start here, fourteen groups, every hover line, the inline marks of Vision - View - Effects, Effect handler, Command, Decision and Verified commit moved to `_Not_` lines, `_Like_` lines on Effect handler, Datom, Entity, Identity, Blob and Suite), `docs/agents/domain.md` (how to write an entry), map 3, [I91 Effect's names against ours][I91], [I96 Accept the vocabulary][I96], [I30 Ideas batch: glossary entries written as effects][I30]. Code: the glossary parser and page in `apps/docs/src/lib/references.ts` and `reference-links.ts`, test first; `verify`'s `glossary` step in `tools/verify/src/check-glossary.ts` and `glossary-report.ts`, and a passing step's `note:` line shown on its row. The first report: 123 terms, two no living document uses (Token verifier, Bearer authentication), for [I96][I96] to review.

## Comments

2026-10-28: from [I88 Effect and the effect handler][I88]. Worked entries to start from: effect and Effect handler ([D163 One meaning of effect, named by phase][D163]-[D169 A command decides][D169]), the first lower-case entry and the first with a "like X, except Y" line. Also for this ticket, from [I30 Ideas batch: glossary entries written as effects][I30]: vivief's quick reference lists each deprecated term with what replaced it and why (`Analyser` became `Extractor`, "clearer: it extracts data into seeds"); does an Avoid line say why?

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0033]: ../adr/0033-the-presenter-pattern.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D162]: ../plan/bootstrap/02-decision-log.md#d162
[D163]: ../plan/bootstrap/02-decision-log.md#d163
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D170]: ../plan/bootstrap/02-decision-log.md#d170
[D171]: ../plan/bootstrap/02-decision-log.md#d171
[D172]: ../plan/bootstrap/02-decision-log.md#d172
[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D174]: ../plan/bootstrap/02-decision-log.md#d174
[D175]: ../plan/bootstrap/02-decision-log.md#d175
[D176]: ../plan/bootstrap/02-decision-log.md#d176
[D177]: ../plan/bootstrap/02-decision-log.md#d177
[D178]: ../plan/bootstrap/02-decision-log.md#d178
[D179]: ../plan/bootstrap/02-decision-log.md#d179
[D180]: ../plan/bootstrap/02-decision-log.md#d180
[D90']: ../plan/bootstrap/02-decision-log.md#d90p
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[D94']: ../plan/bootstrap/02-decision-log.md#d94p
[I11]: 0011-quarantine-after-a-lost-lease.md
[I14]: 0014-physical-devices-and-notification-tap.md
[I21]: 0021-test-the-glossary-with-a-reader.md
[I28]: 0028-alchemy-infrastructure-as-effects.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I32]: 0032-ideas-batch-explain-any-word-on-demand.md
[I61]: 0061-rename-evidence-mobile-to-evidence-client.md
[I63]: 0063-the-columnar-copy.md
[I67]: 0067-minting-entity-id-segments.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I80]: 0080-build-the-journal-fence.md
[I88]: 0088-effect-and-the-effect-handler.md
[I90]: 0090-pattern-concept-contract-abstraction.md
[I91]: 0091-effects-names-against-ours.md
[I92]: 0092-map-2s-new-words.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
[I96]: 0096-accept-the-vocabulary.md
[I97]: 0097-a-preview-on-every-link-in-a-pages-text.md
[I98]: 0098-diagram-labels-and-named-identifiers-get-the-checks-prose-gets.md
