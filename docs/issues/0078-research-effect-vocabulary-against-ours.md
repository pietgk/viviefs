# I78: Research: Effect's vocabulary against ours

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: research

Found: 2026-10-24

## What

Compare every Effect module's main names with ViViEfs's glossary and the vivief words map 2 brought in, so a concept Effect already names takes Effect's name and meaning ([D135 Effect's names first][D135]) before map 3 settles the words. Raised by the human in [I56](0056-one-shape-at-every-level.md)'s round 4 ([the review page](../research/2026-10-10-one-shape-review.html), section 10d): we build on the Effect repository, which already names many patterns (Service, Layer, Cluster and more), and vivief's concepts were written before anyone looked at them, so taking them over could rename or reinvent Effect's.

Where the stack runs, Effect was read first: Service, Layer, Schema, Workflow, Activity, Durable clock, Reactivity, Atom, Rpc and Sql are used as Effect means them, the datom-backed engine implements `WorkflowEngine` ([ADR-0012 Durable execution over one datom-backed workflow engine][ADR-0012]), and EventLog was studied and not adopted, with the reasons recorded ([ADR-0006 One datom log as the substrate][ADR-0006], [ADR-0016 Commands, server validation and rejection][ADR-0016], [ADR-0017 Sync: outbox and sync cursor stream over Effect RPC][ADR-0017]). Not compared yet: `ai` (Prompt, Tool, Toolkit, Chat, LanguageModel, Decision, DecisionModel, McpServer), most of `cluster` (Entity, Envelope, Message, Reply, Singleton, Sharding, Runner) and `persistence` (PersistedQueue, KeyValueStore).

Read the vendored source at `repos/effect/packages/effect/src`: the core modules and `ai`, `cluster`, `eventlog`, `persistence`, `reactivity`, `rpc`, `sql`, `workflow`. For each main name, sort it as:

- **same meaning**: we use Effect's name, or should;
- **clash**: the same word means something else here, and which side moves or how the glossary marks it;
- **an idea we lack**: something Effect has that a map-2 or map-6 decision should know about.

Start with the clashes already found: Envelope (ours: the label on a changeset; Effect's `cluster/Envelope`: a transport envelope between entities), Journal (ours: a workflow run's record; `eventlog/EventJournal`), Entity (ours: what a fact is about; `cluster/Entity`: an addressable type with an RPC protocol, Effect's actor), Decision and "decide" (ours: a recorded design answer, and [D130 One shape at the data level][D130]'s "a command decides"; `ai/Decision`, `DecisionModel.decide`: a model's classification of one input), Tool (ours: an app for the people and agents building apps, [D102 Tools are apps][D102]; `ai/Tool`: an operation a model may request, possibly with approval), Prompt (`ai/Prompt`: an ordered list of messages).

Write the record in `docs/research/`, as [I70](0070-research-access-from-membership-to-enterprise.md)'s, with a table per module. Map 3 waits for it; [I51](0051-actors-or-the-engine.md) reads `cluster` itself first, because Cluster's Entity is Effect's answer to vivief's actors. Feeds [I26](0026-glossary-links-on-words-that-are-not-our-terms.md).

## Answer

Researched on 2026-10-27 in [2026-10-27 Effect's vocabulary against ours](../research/2026-10-27-effect-vocabulary-against-ours.md), from the vendored `effect` 4.0.5 source. Every name this issue lists exists in 4.0.5 (`ai`, `cluster`, `persistence` and `eventlog` import as `effect/ai` and so on, all marked unstable), and the code imports none of those four. The six clashes hold: Envelope, Journal, Decision and Prompt keep our meaning and the glossary marks Effect's; Entity is settled in meaning ([D137 One meaning of entity][D137]) and only wording remains; Tool clashes inside our own text, because [D134 Presenting in any modality][D134]'s "an agent reads a frame through a tool" is Effect's sense. New clashes: Effects in Vision - View - Effects (in Effect an `Effect` is work not yet run and an `Exit` what happened), Worker (Effect's `workers/Worker`; Effect's word for ours is runner), Deferred (ours is Effect's `DurableDeferred`), `tx`, Command (`effect/cli`), session, model, and the glossary's "tag" for a service where Effect 4 says key. Ideas we lack, mostly for map 6: tool calls left unresolved so each runs as an activity or command, tool approval and annotations, `Persistable` and `PersistedCache` (a stored `Exit` reused instead of rerun, [I29 Ideas batch: agents that record a replayable run][I29]), a model's `ProviderName` and `ModelName` for its origin ([I64 Build origin trust][I64]), `gen_ai.*` telemetry, and `McpServer` as where a tool of ours reaches an agent. Nothing is decided; the record ends with the questions map 3's charting asks.

## Comments

2026-10-26: [I51](0051-actors-or-the-engine.md) read `cluster` ([the review page](../research/2026-10-24-actors-or-the-engine-review.html), sections 2 and 8-10). Entity is not a clash of meaning ([D137 One meaning of entity][D137]): an entity is a thing with an identity that facts are about, and Effect's `Entity` is an entity type that acts; what remains is wording, Effect's `Entity` naming the type and ours an instance's id. Cluster's runtime is not adopted ([D39' One engine, one journal, one fence][D39']), and `cluster/Envelope` (a transport envelope between entities) stays a clash with ours.

2026-10-27: Resolved by [the record](../research/2026-10-27-effect-vocabulary-against-ours.md); map 3, the words, is charted next with [I26 Glossary links on words that are not our terms][I26].

2026-10-28: [I88 Effect and the effect handler][I88] answered questions 2, 3 and 5. Effects in Vision - View - Effects is an effect in its last phase, one glossary entry for the phrase, and Effect and effect are told apart by case ([D163 One meaning of effect, named by phase][D163], [D164 Effect and effect, told apart by case][D164], [D168 Vision - View - Effects, one entry][D168]); the formula takes no names of its own ([D166 No formula with names of its own][D166]); a command decides, marked against `DecisionModel.decide`, and Decision is marked against Effect's `Decision` ([D169 A command decides][D169]). The record's inference that Effects "reads the other way round" was read as phase: Effect's `Effect` and `Exit` are one effect before and after it runs.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: ../adr/0006-one-datom-log.md
[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[ADR-0017]: ../adr/0017-sync-outbox-and-cursor-stream.md
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D163]: ../plan/bootstrap/02-decision-log.md#d163
[D164]: ../plan/bootstrap/02-decision-log.md#d164
[D166]: ../plan/bootstrap/02-decision-log.md#d166
[D168]: ../plan/bootstrap/02-decision-log.md#d168
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I64]: 0064-build-origin-trust.md
[I88]: 0088-effect-and-the-effect-handler.md
