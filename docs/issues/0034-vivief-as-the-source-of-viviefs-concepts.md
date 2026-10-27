# I34: vivief as the source of ViViEfs's concepts

Status: needs-triage

Category: enhancement

Found: 2026-10-05

Kind: starting point for several wayfinder maps

## What

vivief's documents (outside its archive) hold the ideas, aims, vision and concepts that ViViEfs continues, and they deserve a careful review against what ViViEfs has built, because ViViEfs has taken only a few of them so far. Three things make it timely: vivief's meta insight that it is about creation; the human's judgment (2026-10-05) that the log-store guide is not yet good enough to accept as the first exemplar pattern, the one we create, verify and teach from; and the ideas-batch issues (I24-[I33 Ideas batch: abstractions that constrain agents][I33]), many of which point back to vivief. The review is too big for one wayfinder session, so this issue is the starting point for several maps. It does not decide anything.

## A proposed vision

The human's proposal (2026-10-05) for how to say what ViViEfs is about:

> Creation and communication, with teaching, using learning as the verification of what we create, proving that our communication languages between humans and agents work.

How it reads against what is here:

- **Creation** is vivief's meta insight (below).
- **Communication** is what the glossary, the plain sentences ([D94 A glossary a newcomer can read][D94]), the decision log and the references are for, and what [I26 Glossary links on words that are not our terms][I26], [I30 Ideas batch: glossary entries written as effects][I30] and [I32 Ideas batch: explain any word on demand][I32] try to improve: one language that a human and an agent read the same way.
- **Teaching as verification**: teaching is already required for delivery ([D29 Teaching is a delivery gate][D29], [ADR-0026 Verify - Qualify - Teach][ADR-0026]): a pattern is delivered only with a concept page, an exercise and a lesson. An exercise must fail on its problem and pass on its solution ([D66 Exercise tracks][D66]), and [I21 Test the glossary with a reader outside software][I21] tests the glossary with a reader outside software. The proposal goes further: if a learner, human or agent, can learn what we created from what we wrote, the language worked; if not, the language failed, not only the learner.
- **Languages between humans and agents**: glossary terms, effect forms ([I30 Ideas batch: glossary entries written as effects][I30]), test specs an agent records ([I29 Ideas batch: agents that record a replayable run][I29]), skills and guides.

It is a candidate for map 2 (Foundation) below.

## Why now

- **Creation is the meta insight.** vivief's core thesis ([concepts v6](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-v6.md), section 1): "The platform exists to help humans, AI, and systems create. All creation follows `(state, intent) => (state', [intent'])`." What varies is who creates and how much their `Contract` trusts them. A counseling session, a code analysis and a morning brief are all creation through the same machinery. ViViEfs says what it builds (a reference stack, patterns, gates), but not yet what it is about in this sense.
- **The first exemplar is not ready.** [I2 Accept the log-store guide][I2] stays open: the human judged on 2026-10-05 that the log-store guide is not yet at the level to be accepted as the reference first exemplar pattern. What exactly is missing is a question for the review, not decided here. It is the best test case: what would vivief's concepts change about the first pattern a learner meets?
- **The ideas batches lead back.** [I25 Ideas batch: understanding and maintaining code bases][I25] (vivief's Vision - View - Effects loop, DevAC, rules that lift effects), [I29 Ideas batch: agents that record a replayable run][I29] (deterministic-first), [I30 Ideas batch: glossary entries written as effects][I30] (the formula and its names), [I31 Ideas batch: DataFrames as a universal data format][I31] (DevAC's DuckDB and Parquet), [I33 Ideas batch: abstractions that constrain agents][I33] (concept or pattern, deterministic-first) each found part of their answer in vivief.

## What vivief has, outside the archive

[vivief](https://github.com/pietgk/vivief) (`~/ws/vivief`), its [docs folder](https://github.com/pietgk/vivief/tree/main/docs) without its archive, read on 2026-10-05: about 170 Markdown files, 42,000 lines.

| Folder | Files | Lines | What it holds |
| --- | ---: | ---: | --- |
| `intent/` | 22 | 7,269 | Open brainstorms: the creation loop (experiments, developer flow, multi-agent primitives), datom queries and virtual projections, a local LLM and a self-improving creation loop, MCP applications, peer-to-peer, procurement, security, a challenge of the concepts. |
| `contract/` | 85 | 17,834 | Locked decisions: concepts v6, its quick reference and build notes, the DevAC foundation, 55 ADRs, and 13 vision documents (`actors.md`, `bridging.md`, `creation-loop-extensions.md`, `docs-as-creation-artifacts.md`, `effecthandler-roles.md`, `fractal-software-factory.md`, `knowledge-acquisition.md`, `proactive-improvement.md`, `security-architecture.md`, `ui-effects.md`, `validation.md` and two more). |
| `fact/` | 32 | 15,499 | What was built: DevAC (parsing, data model, storage, federation, rules that lift effects, views, OTel integration, an eval framework), the datom store, DuckLake, guides and the release process. |
| `claude/` | 20 | 1,647 | Short context windows (50-80 lines) per topic for an agent, each linking to its human version. |
| `story/` | 7 | 245 | The path from DevAC to the platform vision, and evolution logs per topic. |

The heart of it is [concepts v6](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-v6.md):

- **Five `concepts`.** `Datom` (fact), `Projection` (query, access, encryption, delivery, trust scope), `Surface` (render, in six modes: stream, card, canvas, dialog, board, diagram), `Contract` (constrains; "simultaneously spec, test, and runtime guard") and `effectHandler` (transition). "Everything else (domain, bridge, artifact, slice, profile, skill) is a pattern, not a concept."
- **The creation loop.** An `intent` enters, a `Contract` governs the `effectHandler` that processes it, the result is datoms; a failed validation re-enters the loop as a fix; abandoned creation is a terminal, auditable state.
- **Trust.** Three `trust strategies`: authoritative (a human commits), gated (an AI drafts, a human approves) and sandboxed (an AI works in an isolated scope until promoted). "LLM authors, system enforces, LLM refines."
- **Slices.** `Fact` (data), `Feature` (data and logic), `Full` (all five), as the entry path.
- **A glossary** (section 11): 34 terms in six groups, refined over six versions of the concepts (v1 to v6, March 2025 to March 2026, [story arc](https://github.com/pietgk/vivief/blob/main/docs/story/arc.md)).
- **Its own document lifecycle**: `intent/` (brainstorms) to `contract/` (decisions) to `fact/` (what was built), with short agent windows beside the human versions.

## What ViViEfs has taken so far

`docs/plan/bootstrap/09-sources-to-reuse.md` names three things from vivief: concepts v6 and the foundation (datom, projection, effect handler, observability as projection), the datom sync ADR, and the idea to match traces against extracted effects. In practice: one datom log ([D31 One datom log][D31]), traces derived from it ([D32 Traces derived from the log][D32]), and the command as a pure function `(readModel, intent) -> changeset or DomainError` ([D36 Shared commands][D36]).

## First overlaps and differences

A first look, to be checked by the review:

| vivief | ViViEfs today | Note |
| --- | --- | --- |
| `Datom` | Datom ([D31 One datom log][D31]) | The same idea, taken. |
| `Projection` (query, access, encryption, delivery, trust) | Read models, the projector, query atoms, membership, encryption at rest | One `concept` there; several patterns here. |
| `Surface` (six modes) | UI state ownership ([ADR-0019 UI state ownership and live reads with query atoms][ADR-0019]), screens of the app shell | No concept here yet; [I24 Ideas batch: understanding LLM output (Andrej Karpathy)][I24] and [I25 Ideas batch: understanding and maintaining code bases][I25] ask for diagrams and live pictures. |
| `Contract` (spec, test, runtime guard; Schema, Behavior, Trust) | Contract: what a part promises, as an Effect service and its types, checked by suites | The same word with a different scope ([I26 Glossary links on words that are not our terms][I26], [I30 Ideas batch: glossary entries written as effects][I30]). |
| `effectHandler` | Command ([D36 Shared commands][D36]), activities, workflows | The naming question of [I30 Ideas batch: glossary entries written as effects][I30]. |
| The creation loop, trust strategies, `:creation/abandoned` | Server validation of changesets, changeset abort, gates, a human accepting a guide | No single loop named here. |
| `concept` versus `pattern` | Pattern: a proven way to build one part of an app | [I33 Ideas batch: abstractions that constrain agents][I33] asks the same question. |
| Deterministic first | [ADR-0025 AI-robust guardrails][ADR-0025] guardrails, gates, [I29 Ideas batch: agents that record a replayable run][I29] | Shared in spirit. |
| `intent/`, `contract/`, `fact/` documents; agent windows | Issues and research; ADRs and decisions; guides and evidence; `AGENTS.md`, `llms.txt` | Similar shape, different names. |
| Domains (DevAC, counseling, procurement) | Product apps as app pairs ([I9 Product apps in this repository as app pairs][I9]) | |

## From concepts to implementation: vivief's decision framework

vivief's [implementation knowledge base](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-impl-kb.md) (`contract/vivief-concepts-impl-kb.md`, v6, last changed 2026-04-10, about 560 lines) is its bridge from the concepts to what gets built: a decision framework, not code-level details, that "frames the choices needed with criteria and tradeoffs, leaving actual decisions open for follow-up evaluation." Its concrete candidates are dated (Node, Deno or Bun; peer-to-peer and CRDTs; ViViEfs chose Effect v4 on Expo and server-authoritative sync instead), but its framework still holds:

- **One shape per decision**: what to decide, why it matters, criteria derived from the concepts, candidates with strengths and concerns, and the concept it serves. "The concepts are stable across technology choices; the technology choices serve the concepts."
- **What each concept needs from technology**: for example, `Datom` needs an append-only store with provenance and replay; `Projection` needs queries, live delivery, trust filtering and encryption.
- **Phases with dependencies**: foundation (the datom store, Schema validation at commit, snapshot projections, function handlers, a first card surface), extension, advanced, and deferred.
- **What to defer, and when to revisit**: each deferred item has a reason and a trigger, such as "when a second domain is needed".
- **The deterministic-first loop in practice**: what makes an LLM propose a rule, how a human reviews it, how it is validated (tests, false positives, at least one fixture), refined and superseded, and when it may promote itself by confidence.
- **The knowledge evolution path**: tacit knowledge, a knowledge file in Markdown that a skill uses, a proto-rule with thresholds, a proposed rule, an active rule, and finally enforcement in infrastructure; "a human approves each transition". DevAC measured it: a prompt with its written rules scored about 68 % against about 28 % without.

ViViEfs runs its own version of this framework already, in other words:

| vivief's framework | ViViEfs |
| --- | --- |
| Concepts, then technology choices with criteria | The bootstrap plan: the grilling decisions ([D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94]), then ADRs with a qualifying gate each |
| Phases with dependencies | The Schedule and the ordered gates (`docs/plan/bootstrap/06-qualification-gates.md`) |
| What to defer, with a trigger | Freeze, named slot and hypothesis (`docs/plan/bootstrap/10-open-items-and-risks.md`) and the `Decide when:` line on issues |
| A decision record per choice | The ADR template: Problem, Design, Trade-offs, Failure-handling, Outcome ([I33 Ideas batch: abstractions that constrain agents][I33]) |
| Knowledge file, proto-rule, active rule, infrastructure | Research records, guides and skills; lint rules and `verify` steps; gates |

What ViViEfs does not have is the explicit step from a concept to its criteria, and the path by which a written rule becomes an enforced one. Both matter for creating: they are how a new pattern would be derived from the foundation instead of chosen ad hoc.

## Suggested maps

Each could be its own wayfinder map with its own destination; the order is a suggestion.

1. **Inventory** (research, mostly AFK): read vivief's documents outside the archive and record, per concept, decision and vision, where it stands in ViViEfs: taken, different, missing, or rejected and why. Destination: one research record that the other maps use.
2. **Foundation**: what ViViEfs is about (creation? creation and communication, verified by teaching?) and which of vivief's concepts become ViViEfs's foundation, as glossary terms and ADRs. Destination: a decision on the foundation concepts.
3. **Vocabulary**: the names, together with [I30 Ideas batch: glossary entries written as effects][I30] (the formula and its names), [I26 Glossary links on words that are not our terms][I26] (words that are not our terms), [I33 Ideas batch: abstractions that constrain agents][I33] (abstraction or pattern) and vivief's glossary. Destination: a glossary where each term means one thing.
4. **From concept to the first exemplar**: how a concept becomes a pattern a human accepts, with vivief's decision framework (criteria from concepts, phases, deferral triggers, the knowledge evolution path) next to ViViEfs's grilling, ADRs and gates, and what that means for the log-store guide ([I2 Accept the log-store guide][I2], [I21 Test the glossary with a reader outside software][I21]) seen through vivief's slices and creation loop. Destination: the path from a concept to an accepted pattern, and the changes that let a human accept the log-store guide.
5. **Showing and understanding**: `Surface` modes, self-documentation and contracts made visible, with [I24 Ideas batch: understanding LLM output (Andrej Karpathy)][I24], [I25 Ideas batch: understanding and maintaining code bases][I25] and [I32 Ideas batch: explain any word on demand][I32]. Destination: which views ViViEfs builds.
6. **Agents and trust**: deterministic-first, trust strategies, skills as effect handlers, with [I29 Ideas batch: agents that record a replayable run][I29] and [I33 Ideas batch: abstractions that constrain agents][I33]. Destination: how agents and humans share creation in this stack.

## Questions

- Does ViViEfs adopt the decision framework's shape for deriving a pattern from the foundation concepts (criteria from concepts, candidates, the concept served), next to the ADR, and does the knowledge evolution path become how a written rule earns enforcement?

- What is the meta insight of ViViEfs: creation, as in vivief; the proposed vision of creation and communication, verified by teaching and learning; or something narrower that fits a reference stack?
- If learning is the verification, what is the evidence: a learner (human or agent) passing an exercise, a reader test like [I21 Test the glossary with a reader outside software][I21], an agent that builds the next pattern from the guides alone?
- What did vivief get right that ViViEfs dropped, and what did ViViEfs learn (gates, evidence, qualification) that vivief lacked?
- Which parts of vivief are product vision (counseling, procurement, peer-to-peer) rather than reference-stack concepts, and stay out of scope?
- Why is the log-store guide not yet acceptable, in the human's words, so map 4 starts from the real gap?
- Do the maps run one after another, or can the inventory run beside the others?

## Comments

2026-10-05: map 1 (Inventory) is charted as [the vivief inventory map](../plan/vivief-inventory/map.md), with tickets I35-[I46 Review the vivief inventory][I46] and the charting review [2026-10-05 Charting map 1: the vivief inventory](../research/2026-10-05-vivief-inventory-charting.html). Its destination is one research record that says, for every idea in vivief and in ViViEfs, where it stands in the other.

2026-10-06: map 1 is done. [The vivief inventory](../research/2026-10-06-vivief-inventory.md) ([HTML view](../research/2026-10-06-vivief-inventory.html)), accepted in [I46](0046-review-the-vivief-inventory.md), is where maps 2-6 start: 348 rows, each listed under the map that picks it up (map 2 101, 3 15, 4 67, 5 54, 6 82), with the question each asks. Three questions come first: map 2, where the server-independent goal is recorded; map 4, whether a consumer app needs ideas or features; map 6, whether an app on the stack calls a model at run time.

2026-10-07: map 2 is charted as [the foundation concepts map](../plan/foundation-concepts/map.md), with tickets I47-[I55 Accept the foundation concepts][I55] and the charting review [2026-10-07 Charting map 2: the foundation concepts](../research/2026-10-07-foundation-concepts-charting.html). It is called "the foundation concepts" because "foundation" alone already names the [P01 Platform on SDK 58][P01]-[P10 Trace projection][P10] gate stage. Its destination: every one of the inventory's 101 map-2 rows has a disposition, and the human accepts one foundation ADR stating what ViViEfs is about and its foundation concepts. What counts as evidence that teaching verifies is left to map 4.

2026-10-07: [I47](0047-what-viviefs-is-about.md) answered this issue's question on what ViViEfs is about: app creation ([D95 App creation][D95], [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]). It leaves inputs for maps not yet charted. **Map 3:** prefer the specific compound and leave the broad word to everyday use (the human, on App creation over `Creation`); glossary entries for Vision, View and Effects ([D98 Vision - View - Effects][D98]), once "effect" is settled; a word for the lab qualifier ([D101 Lab and production][D101]); the names of the formula, with [I30 Ideas batch: glossary entries written as effects][I30] ([I56 One shape at every level?][I56] decides only whether the shape is foundation). **Map 5:** facts and meaning kept apart for an analysis of ViViEfs's own code ([D99 Facts kept, meaning derived][D99], with [I25 Ideas batch: understanding and maintaining code bases][I25]); the views of the languages ([D97 Our languages by type][D97]).

2026-10-07, after [I47 What ViViEfs is about][I47]'s review: tools are apps ([D102 Tools are apps][D102]), so DevAC's ideas need a place to be heard. **Map 5** takes the inventory's 23 `DevAC tooling` rows as candidates; their scope stays as [I46 Review the vivief inventory][I46] accepted it until map 5 is charted and decides which a ViViEfs tool takes up. Read them as a starting point, not a design to adopt: code analysis has moved on since DevAC's last version, so its choices for particular implementations may be outdated; tools such as [ripwire](https://github.com/redhat-et/ripwire) (Apache-2.0) challenge parts of what DevAC does; and C4 has already been discussed ([I25 Ideas batch: understanding and maintaining code bases][I25]), with possibly better alternatives (LikeC4, Bausteinsicht, archify, draw.io). The one DevAC idea already matched is the deterministic validation pipeline, `taken` by `verify`. The Tool glossary entry, and App's plain sense against its in-code sense, are **map 3's**.

2026-10-07: [I48](0048-where-the-server-independent-goal-is-recorded.md) leaves an input for **map 3**: `node` (one installation of an app that keeps all or part of an organization's data and writes changes to it, [D103 Nodes and authority][D103]) needs a glossary entry, and clashes with Node.js. The human's hint: Node.js gets `node-js` as its name where a name is needed, so Node stays free for a node in a network. The docs site links glossary terms case-insensitively (`apps/docs/src/lib/references.ts`), so the entry waits until the Node.js mentions are renamed or the linker tells them apart.

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) leaves inputs for maps not yet charted. **Map 3:** Frame and Trust level are open if they clash; Frame and Origin link only when capitalised on the docs site (`EVERYDAY_TERMS`). **Map 5:** a Surface takes frames ([D109 Frame and frame subscription][D109]), a one-row frame for one entity is revisitable, and trust signals render from a frame's companion columns ([D115 Origin trust][D115]). **Map 6:** `vivief:provenance` and `vivief:trust-strategies` are settled by [I49 Projection: one concept or several patterns][I49] as adopted direction ([D115][D115]-[D117 Trust strategies as commit paths][D117], [ADR-0034](../adr/0034-origin-trust.md)); the actor category for agents stays open ([I51 Actors or the engine][I51]).

2026-10-27: map 2 is done. [I55](0055-accept-the-foundation-concepts.md) checked that every one of the 101 map-2 rows has a disposition in an Answer of I47-[I59 Bring ADR-0002 and the vision page in line with I47][I59], and the human accepted [ADR-0032](../adr/0032-what-viviefs-is-about.md): ViViEfs is about app creation, and its foundation is twelve concepts read as one turn, with all five of vivief's `concepts` adopted in ViViEfs's form and the set left open ([D160 The foundation concepts][D160]). Inputs for **map 3**: the words foundation concept, `Contract`, `effectHandler`, surface and `node`, and a "like X, except Y" glossary line per term where it helps a newcomer ([D162 Portability, two halves][D162]). For **map 4**: [I21 Test the glossary with a reader outside software][I21] judges whether those lines help. Maps 3-6 are not charted yet; map 3 waits for [I78 Research: Effect's vocabulary against ours][I78].

2026-10-27: map 3 charted as **Vocabulary** ([the map](../plan/vocabulary/map.md), [the charting review](../research/2026-10-27-the-words-charting.html)). Destination: a glossary where each term means one thing, accepted by the human. A single-word term only where its meaning matches our use and the libraries we use, else a compound; tickets change the words in living documents, not only decide them, and the linker is built in the map. Tickets I88-[I96 Accept the vocabulary][I96], starting with [I88 Effect and the effect handler][I88] Effect and the effect handler; the attribute-naming rows stay in map 3.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0019]: ../adr/0019-ui-state-ownership-and-query-atoms.md
[ADR-0025]: ../adr/0025-ai-robust-guardrails.md
[ADR-0026]: ../adr/0026-verify-qualify-teach.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D1]: ../plan/bootstrap/02-decision-log.md#d1
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D160]: ../plan/bootstrap/02-decision-log.md#d160
[D162]: ../plan/bootstrap/02-decision-log.md#d162
[D29]: ../plan/bootstrap/02-decision-log.md#d29
[D31]: ../plan/bootstrap/02-decision-log.md#d31
[D32]: ../plan/bootstrap/02-decision-log.md#d32
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D66]: ../plan/bootstrap/02-decision-log.md#d66
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[D97]: ../plan/bootstrap/02-decision-log.md#d97
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D99]: ../plan/bootstrap/02-decision-log.md#d99
[I2]: 0002-accept-the-log-store-guide.md
[I21]: 0021-test-the-glossary-with-a-reader.md
[I24]: 0024-ideas-batch-andrej-karpathy-understanding.md
[I25]: 0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I31]: 0031-ideas-batch-dataframes-as-a-universal-data-format.md
[I32]: 0032-ideas-batch-explain-any-word-on-demand.md
[I33]: 0033-ideas-batch-abstractions-that-constrain-agents.md
[I46]: 0046-review-the-vivief-inventory.md
[I47]: 0047-what-viviefs-is-about.md
[I49]: 0049-projection-one-concept-or-several-patterns.md
[I51]: 0051-actors-or-the-engine.md
[I55]: 0055-accept-the-foundation-concepts.md
[I56]: 0056-one-shape-at-every-level.md
[I59]: 0059-bring-adr-0002-and-the-vision-in-line-with-i47.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I9]: 0009-product-apps-as-app-pairs.md
[I96]: 0096-accept-the-vocabulary.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
