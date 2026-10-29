# I92: Map 2's new words

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I88 Effect and the effect handler][I88], [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Write the glossary entries for the words map 2 gave a meaning and left unnamed, by [I89 How a word is chosen and written][I89]'s rules. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

The words:

- `node` ([D103 Nodes and authority][D103]): the human's hint is that Node.js is written `node-js` where a name is needed, so node stays free for a node in a network ([I78 Research: Effect's vocabulary against ours][I78], question 11).
- Surface ([D134 Presenting in any modality][D134]), frame and frame subscription ([D109 Frame and frame subscription][D109]), trust level ([D115 Origin trust][D115]).
- The lab qualifier ([D101 Lab and production][D101]).
- Hot, frontier, warm and cold, and the kinds of intent ([D132 Four states at every level][D132]).
- Change: a data changeset or a code commit ([I77 The word change has two meanings][I77], [D133 Verified commit][D133]).

[I77 The word change has two meanings][I77] is resolved by this ticket.

## Answer

Decided with the human on 2026-10-28 in two rounds, on [the review page](../research/2026-10-28-map-2s-new-words-review.html), under [D198 Map 3 finishes lean][D198]: only the words the app shell meets are named. The page ran [D170 One word only where it matches][D170]'s test on each word against Effect, React Native's renderer and the platforms, with its uses in the living documents counted, and drafted each entry.

**Round 1.** Q1, Q3, Q4 and Q5 as recommended; Q2 the human's choice over the recommendation. `node` becomes Sync node: it fails the test four times (Node.js, the DOM's `Node`, React's `ReactNode`, a Kubernetes node), and in Effect and in our own package names bare node means Node.js, which keeps it ([D199 Sync node][D199]). The general idea of [D134 Presenting in any modality][D134] is named now, as Presentation surface, with Screen for the visual kind in React Navigation's and Expo Router's sense; the recommendation had been Screen only, the general word deferred. Bare surface is left to React Native's own surface (a running React root, `SurfaceHandler`), Android's and Material's `Surface`, and an API or attack surface; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] is amended, its sixth foundation concept now Presenter, frame and presentation surface ([D200 Presentation surface and screen][D200]). Frame keeps its word with a `_Not_` line; Frame subscription and Trust level stand ([D201 Frame keeps its word][D201]). Change stays plain English for a changeset and a commit, and Verify's hover line says "every change to the code"; [I77 The word change has two meanings][I77] is resolved ([D202 Change stays plain English][D202]). The lab qualifier, hot, frontier, warm and cold, and the kinds of intent wait, each with a `Decide when:` ([D203 The lab qualifier, the four states and the kinds of intent wait][D203]).

**Round 2.** All as recommended: the entries and the amendment as drafted; `verify` fails only `node` in code font outside a passage marked as another project's words, built in [I95 Build the glossary linker as decided][I95] ([D199 Sync node][D199]); the rewrite and the hand-overs below.

Checks before a word is retired ([D173 What a word change rewrites, and where it is written][D173]):

| Retired | 1. Persisted names and identifiers | 2. A planned concept that needs the bare word | 3. A later meaning |
| --- | --- | --- | --- |
| `node` (our sense) | none: every node in code is Node.js (`store-sqlite-node`, `@viviefs/testing/node`, `'sqlite-node'`); no pinned name | Node.js, which is why bare node is left to it | Sync node's `_Avoid_` line |
| surface (our sense) | none: no identifier, no pinned name | none of ours; its other senses are plain English | Presentation surface's `_Avoid_` line |

Living documents edited: `GLOSSARY.md` (Sync node, Presentation surface and Screen; a `_Not_` line on Frame; Verify's hover line; the Start here row); [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] (amended); every `node` in code font in the vision page, ADR bodies, plan pages and open issues, 81 in 29 files; `docs/agents/domain.md` (the rule for change); the vocabulary and foundation-concepts maps. Kept as written: decision-log rows, resolved issues, research records, and dated comments that quote the old words. No issue opened: nothing in code is renamed.

Hand-overs: comments on [I94 Words in another project's sense][I94], [I58 Several servers in the lab][I58], [I8 Workflow engine scale-out and more workflow runners on the server][I8], [I29 Ideas batch: agents that record a replayable run][I29] and [I62 The Presenter conformance gate][I62]; the map's Out of scope holds the four states' `Decide when:`, which no issue owns.

## Comments

2026-10-28: [I91 Effect's names against ours][I91]: "prompt" is never a glossary term, since Effect alone has three (`ai/Prompt`, an MCP prompt, `cli/Prompt`); name [D132 Four states at every level][D132]'s person's request to an agent without the bare word ([D195 Prompt is not a term][D195]). There is no word yet for an entity type that acts; a workflow run says it ([D196 Entity type and entity id][D196]).

2026-10-28: [D198 Map 3 finishes lean][D198]: name only the words the app shell ([P12 UI on every platform][P12], [P13 Links and routing][P13]) meets; defer the rest with a `Decide when:`.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D133]: ../plan/bootstrap/02-decision-log.md#d133
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D170]: ../plan/bootstrap/02-decision-log.md#d170
[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D195]: ../plan/bootstrap/02-decision-log.md#d195
[D196]: ../plan/bootstrap/02-decision-log.md#d196
[D198]: ../plan/bootstrap/02-decision-log.md#d198
[D199]: ../plan/bootstrap/02-decision-log.md#d199
[D200]: ../plan/bootstrap/02-decision-log.md#d200
[D201]: ../plan/bootstrap/02-decision-log.md#d201
[D202]: ../plan/bootstrap/02-decision-log.md#d202
[D203]: ../plan/bootstrap/02-decision-log.md#d203
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I58]: 0058-several-servers-in-the-lab.md
[I62]: 0062-presenter-conformance-gate.md
[I77]: 0077-change-has-two-meanings.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I8]: 0008-engine-scale-out.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I91]: 0091-effects-names-against-ours.md
[I94]: 0094-words-in-another-projects-sense.md
[I95]: 0095-build-the-glossary-linker-as-decided.md
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
