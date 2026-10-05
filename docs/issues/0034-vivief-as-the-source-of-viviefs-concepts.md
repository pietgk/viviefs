# I34: vivief as the source of ViViEfs's concepts

Status: needs-triage

Category: enhancement

Found: 2026-10-05

Kind: starting point for several wayfinder maps

## What

vivief's documents (outside its archive) hold the ideas, aims, vision and concepts that ViViEfs continues, and they deserve a careful review against what ViViEfs has built, because ViViEfs has taken only a few of them so far. Three things make it timely: vivief's meta insight that it is about creation; the human's judgment (2026-10-05) that the log-store guide is not yet good enough to accept as the first exemplar pattern, the one we create, verify and teach from; and the ideas-batch issues (I24-I33), many of which point back to vivief. The review is too big for one wayfinder session, so this issue is the starting point for several maps. It does not decide anything.

## A proposed vision

The human's proposal (2026-10-05) for how to say what ViViEfs is about:

> Creation and communication, with teaching, using learning as the verification of what we create, proving that our communication languages between humans and agents work.

How it reads against what is here:

- **Creation** is vivief's meta insight (below).
- **Communication** is what the glossary, the plain sentences (D94), the decision log and the references are for, and what I26, I30 and I32 try to improve: one language that a human and an agent read the same way.
- **Teaching as verification**: teaching is already required for delivery (D29, ADR-0026): a pattern is delivered only with a concept page, an exercise and a lesson. An exercise must fail on its problem and pass on its solution (D66), and I21 tests the glossary with a reader outside software. The proposal goes further: if a learner, human or agent, can learn what we created from what we wrote, the language worked; if not, the language failed, not only the learner.
- **Languages between humans and agents**: glossary terms, effect forms (I30), test specs an agent records (I29), skills and guides.

It is a candidate for map 2 (Foundation) below.

## Why now

- **Creation is the meta insight.** vivief's core thesis ([concepts v6](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-v6.md), section 1): "The platform exists to help humans, AI, and systems create. All creation follows `(state, intent) => (state', [intent'])`." What varies is who creates and how much their `Contract` trusts them. A counseling session, a code analysis and a morning brief are all creation through the same machinery. ViViEfs says what it builds (a reference stack, patterns, gates), but not yet what it is about in this sense.
- **The first exemplar is not ready.** I2 stays open: the human judged on 2026-10-05 that the log-store guide is not yet at the level to be accepted as the reference first exemplar pattern. What exactly is missing is a question for the review, not decided here. It is the best test case: what would vivief's concepts change about the first pattern a learner meets?
- **The ideas batches lead back.** I25 (vivief's Vision - View - Effects loop, DevAC, rules that lift effects), I29 (deterministic-first), I30 (the formula and its names), I31 (DevAC's DuckDB and Parquet), I33 (concept or pattern, deterministic-first) each found part of their answer in vivief.

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

`docs/plan/bootstrap/09-sources-to-reuse.md` names three things from vivief: concepts v6 and the foundation (datom, projection, effect handler, observability as projection), the datom sync ADR, and the idea to match traces against extracted effects. In practice: one datom log (D31), traces derived from it (D32), and the command as a pure function `(readModel, intent) -> changeset or DomainError` (D36).

## First overlaps and differences

A first look, to be checked by the review:

| vivief | ViViEfs today | Note |
| --- | --- | --- |
| `Datom` | Datom (D31) | The same idea, taken. |
| `Projection` (query, access, encryption, delivery, trust) | Read models, the projector, query atoms, membership, encryption at rest | One `concept` there; several patterns here. |
| `Surface` (six modes) | UI state ownership (ADR-0019), screens of the app shell | No concept here yet; I24 and I25 ask for diagrams and live pictures. |
| `Contract` (spec, test, runtime guard; Schema, Behavior, Trust) | Contract: what a part promises, as an Effect service and its types, checked by suites | The same word with a different scope (I26, I30). |
| `effectHandler` | Command (D36), activities, workflows | The naming question of I30. |
| The creation loop, trust strategies, `:creation/abandoned` | Server validation of changesets, changeset abort, gates, a human accepting a guide | No single loop named here. |
| `concept` versus `pattern` | Pattern: a proven way to build one part of an app | I33 asks the same question. |
| Deterministic first | ADR-0025 guardrails, gates, I29 | Shared in spirit. |
| `intent/`, `contract/`, `fact/` documents; agent windows | Issues and research; ADRs and decisions; guides and evidence; `AGENTS.md`, `llms.txt` | Similar shape, different names. |
| Domains (DevAC, counseling, procurement) | Product apps as app pairs (I9) | |

## Suggested maps

Each could be its own wayfinder map with its own destination; the order is a suggestion.

1. **Inventory** (research, mostly AFK): read vivief's documents outside the archive and record, per concept, decision and vision, where it stands in ViViEfs: taken, different, missing, or rejected and why. Destination: one research record that the other maps use.
2. **Foundation**: what ViViEfs is about (creation? creation and communication, verified by teaching?) and which of vivief's concepts become ViViEfs's foundation, as glossary terms and ADRs. Destination: a decision on the foundation concepts.
3. **Vocabulary**: the names, together with I30 (the formula and its names), I26 (words that are not our terms), I33 (abstraction or pattern) and vivief's glossary. Destination: a glossary where each term means one thing.
4. **The first exemplar**: what makes the log-store guide acceptable as the first pattern (I2, I21), seen through vivief's slices and creation loop. Destination: the changes that let a human accept it.
5. **Showing and understanding**: `Surface` modes, self-documentation and contracts made visible, with I24, I25 and I32. Destination: which views ViViEfs builds.
6. **Agents and trust**: deterministic-first, trust strategies, skills as effect handlers, with I29 and I33. Destination: how agents and humans share creation in this stack.

## Questions

- What is the meta insight of ViViEfs: creation, as in vivief; the proposed vision of creation and communication, verified by teaching and learning; or something narrower that fits a reference stack?
- If learning is the verification, what is the evidence: a learner (human or agent) passing an exercise, a reader test like I21, an agent that builds the next pattern from the guides alone?
- What did vivief get right that ViViEfs dropped, and what did ViViEfs learn (gates, evidence, qualification) that vivief lacked?
- Which parts of vivief are product vision (counseling, procurement, peer-to-peer) rather than reference-stack concepts, and stay out of scope?
- Why is the log-store guide not yet acceptable, in the human's words, so map 4 starts from the real gap?
- Do the maps run one after another, or can the inventory run beside the others?

## Comments
