# I96: Accept the vocabulary

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I88 Effect and the effect handler][I88], [I89 How a word is chosen and written][I89], [I90 Pattern, concept, contract, abstraction][I90], [I91 Effect's names against ours][I91], [I92 Map 2's new words][I92], [I94 Words in another project's sense][I94], [I95 Build the glossary linker as decided][I95]. [I93 Naming facts][I93] was a blocker until [D198 Map 3 finishes lean][D198] deferred it.

Found: 2026-10-27

## What

Check that map 3 reached its destination and let the human accept the glossary as it stands. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

Check, and write the result in the Answer:

- every map-3 row of [the vivief inventory](../research/2026-10-06-vivief-inventory.md), every waiting word (the map's list) and [I78 Research: Effect's vocabulary against ours][I78]'s questions 1-11 has a disposition in a ticket's Answer;
- every glossary term has one meaning in the stack, and where another project (Effect first) uses the word otherwise, its entry says so;
- no living document still uses a retired word in its retired sense, and the docs site links each term only in our sense ([I95 Build the glossary linker as decided][I95]);
- the open issues whose `Decide when:` was map 3 ([I26 Glossary links on words that are not our terms][I26], [I30 Ideas batch: glossary entries written as effects][I30], [I33 Ideas batch: abstractions that constrain agents][I33], [I77 The word change has two meanings][I77]) are resolved or narrowed.

The human accepts the glossary in this session. [I21 Test the glossary with a reader outside software][I21] (map 4) then tests it with a reader.

## Answer

Decided with the human on 2026-10-29 in two rounds, on [the review page](../research/2026-10-29-accept-the-vocabulary-review.html) and in conversation, all as recommended. **The human accepted the glossary as it stands**, and map 3 is done.

**The destination, checked.** Every map-3 row of [the vivief inventory](../research/2026-10-06-vivief-inventory.md) has a disposition: 16 of its 18 ids in the Answers of [I88 Effect and the effect handler][I88] (`vivief:datom-in-motion`, `vivief:effect-handler` with `viviefs:command`, `vivief:intent`, `vivief:effects-as-data`, `viviefs:effect-v4-backbone`), [I89 How a word is chosen and written][I89] (`vivief:deprecated-terms`, `vivief:glossary-shape`, `vivief:surface-area-as-risk`, `viviefs:plain-glossary`, `vivief:names-that-carry-context`) and [I90 Pattern, concept, contract, abstraction][I90] (`vivief:concept-vs-pattern` with `viviefs:pattern`, `vivief:contract` with `viviefs:contract`, `viviefs:project-kinds-and-boundaries`); `vivief:past-tense-fact-naming` and `vivief:cross-domain-references` are deferred with [I93 Naming facts][I93] ([D198 Map 3 finishes lean][D198]). [I78 Research: Effect's vocabulary against ours][I78]'s questions 1-11 are answered by [D194 Tool is an app for those who build apps][D194], [D168 Vision - View - Effects, one entry][D168], [D166 No formula with names of its own][D166], [D188 Journal and Envelope keep their words][D188], [D169 A command decides][D169], [D195 Prompt is not a term][D195], [D196 Entity type and entity id][D196], [D186 Workflow engine and workflow runner][D186], [D187 Durable deferred][D187], [D197 Evidence registry, and the code names follow in one issue][D197] and [D199 Sync node][D199]; question 12 is map 6's, on [I29 Ideas batch: agents that record a replayable run][I29]. Every waiting word has a disposition, trust level and encryption level only now. Every term has passed the single-word rule ([D171 Every term passes the rule][D171]): [I89][I89]'s sweep, then Concept, Screen and Tool, and compounds for the rest. `retired-words`: no retired word in use. The linker links each term only in our sense ([D204 Words in another project's sense][D204]). [I26 Glossary links on words that are not our terms][I26] and [I77 The word change has two meanings][I77] are resolved, [I30 Ideas batch: glossary entries written as effects][I30] and [I33 Ideas batch: abstractions that constrain agents][I33] narrowed.

**Round 1.** Trust level and encryption level keep their words ([D205 Trust level and encryption level keep their words][D205]). Words the glossary leaned on without an entry, counted in the living documents: Authority and Sync become entries, the log is defined in Log store's entry, and bare log has no entry, since the decision log and the telemetry logs are other logs in our own text; consumer app, living document, lab, grilling, review page and map go to [I21 Test the glossary with a reader outside software][I21]'s reader test, and the journal fence's words to [I80 Build the journal fence][I80] ([D206 Authority, sync and the log][D206]). Accept keeps both senses, authority's and a person's, told apart by what is accepted; Authority's entry defines authority's step and Accepted gains a `_Not_` line ([D207 Accept, told apart by what is accepted][D207]). Lease and Lease epoch are marked as decided to go, and [I80][I80] retires them ([D208 The lease is marked, and goes with the journal fence][D208]). The small fixes: Accepted's and Qualify's hover lines, this issue's blockers, the map.

**The glossary report** ([D178 Growth watched, not capped][D178]): 131 terms, two that no living document uses, Token verifier and Bearer authentication. Map 3 did not add them (they came with [P11 Identity][P11]); both are kept, justified: they name parts of the identity pattern's contract the code uses (the `TokenVerifier` service and the suite `identity/token-verifier`, the server's bearer middleware in `libs/identity`), and the identity guide (map 4) will teach them. The report stays as it is: reading code comments too would hide exactly such a term, one the code names and no page explains yet.

**Round 2.** The human read the edited glossary on the docs site and accepted it as it stands. [I21 Test the glossary with a reader outside software][I21] now tests it with a reader, in map 4.

**Found on the way.** Checking the edits on the docs site: a compound term that wraps across a source line ("a sync" at a line's end, "node" on the next) never linked as the compound, and with Sync added it linked the first word alone to Sync. The linker now matches a compound's words across any whitespace, test first (`apps/docs/src/lib/references.ts`; its exact coverage recorded with `pnpm verify baseline`). The research index lacked the review pages of [I90 Pattern, concept, contract, abstraction][I90], [I91 Effect's names against ours][I91] and [I92 Map 2's new words][I92]; they are listed, and `verify`'s new `research-index` step fails a record the index does not list, one not named by its date, and a link in the index to no record.

Checks before a word is retired ([D173 What a word change rewrites, and where it is written][D173]): no word is retired here; Lease and Lease epoch are retired by [I80 Build the journal fence][I80]. Living documents edited: `GLOSSARY.md` (Authority, Sync, Log store, Server, Accepted, Lease, Lease epoch, Encryption level, Qualify, two Start here rows), the decision log, map 3, `next-session.md`, [I21 Test the glossary with a reader outside software][I21], [I34 vivief as the source of ViViEfs's concepts][I34], [I80][I80], the research index.

## Comments

2026-10-28: from [I89 How a word is chosen and written][I89]. Two more checks for the Answer: every glossary term has passed the single-word rule ([D171 Every term passes the rule][D171]; [I89][I89]'s Answer holds the first sweep), and the terms map 3 added are reviewed against `verify`'s `glossary` report, an unused term removed or justified ([D178 Growth watched, not capped][D178]). The first report (2026-10-28) found 123 terms and two that no living document uses; [I89][I89]'s Answer names them. Record what this review finds in this ticket's Answer, not in a comment: the report reads open issues, so naming an unused term here would count as using it.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D166]: ../plan/bootstrap/02-decision-log.md#d166
[D168]: ../plan/bootstrap/02-decision-log.md#d168
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D171]: ../plan/bootstrap/02-decision-log.md#d171
[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D178]: ../plan/bootstrap/02-decision-log.md#d178
[D186]: ../plan/bootstrap/02-decision-log.md#d186
[D187]: ../plan/bootstrap/02-decision-log.md#d187
[D188]: ../plan/bootstrap/02-decision-log.md#d188
[D194]: ../plan/bootstrap/02-decision-log.md#d194
[D195]: ../plan/bootstrap/02-decision-log.md#d195
[D196]: ../plan/bootstrap/02-decision-log.md#d196
[D197]: ../plan/bootstrap/02-decision-log.md#d197
[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D199]: ../plan/bootstrap/02-decision-log.md#d199
[D204]: ../plan/bootstrap/02-decision-log.md#d204
[D205]: ../plan/bootstrap/02-decision-log.md#d205
[D206]: ../plan/bootstrap/02-decision-log.md#d206
[D207]: ../plan/bootstrap/02-decision-log.md#d207
[D208]: ../plan/bootstrap/02-decision-log.md#d208
[I21]: 0021-test-the-glossary-with-a-reader.md
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I34]: 0034-vivief-as-the-source-of-viviefs-concepts.md
[I77]: 0077-change-has-two-meanings.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I80]: 0080-build-the-journal-fence.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I90]: 0090-pattern-concept-contract-abstraction.md
[I91]: 0091-effects-names-against-ours.md
[I92]: 0092-map-2s-new-words.md
[I93]: 0093-naming-facts.md
[I94]: 0094-words-in-another-projects-sense.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
