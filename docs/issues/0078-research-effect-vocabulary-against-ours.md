# I78: Research: Effect's vocabulary against ours

Status: ready-for-agent

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: research

Found: 2026-10-24

## What

Compare every Effect module's main names with ViViEfs's glossary and the vivief words map 2 brought in, so a concept Effect already names takes Effect's name and meaning ([D135 Effect's names first][D135]) before map 3 settles the words. Raised by the human in [I56](0056-one-shape-at-every-level.md)'s round 4 ([the review page](../research/2026-10-10-one-shape-review.html), section 10d): we build on the Effect repository, which already names many patterns (Service, Layer, Cluster and more), and vivief's concepts were written before anyone looked at them, so taking them over could rename or reinvent Effect's.

Where the stack runs, Effect was read first: Service, Layer, Schema, Workflow, Activity, Durable clock, Reactivity, Atom, Rpc and Sql are used as Effect means them, the datom-backed engine implements `WorkflowEngine` ([ADR-0012 Durable execution over one datom-backed engine][ADR-0012]), and EventLog was studied and not adopted, with the reasons recorded ([ADR-0006 One datom log as the substrate][ADR-0006], [ADR-0016 Commands, server validation and rejection][ADR-0016], [ADR-0017 Sync: outbox and cursor stream over Effect RPC][ADR-0017]). Not compared yet: `ai` (Prompt, Tool, Toolkit, Chat, LanguageModel, Decision, DecisionModel, McpServer), most of `cluster` (Entity, Envelope, Message, Reply, Singleton, Sharding, Runner) and `persistence` (PersistedQueue, KeyValueStore).

Read the vendored source at `repos/effect/packages/effect/src`: the core modules and `ai`, `cluster`, `eventlog`, `persistence`, `reactivity`, `rpc`, `sql`, `workflow`. For each main name, sort it as:

- **same meaning**: we use Effect's name, or should;
- **clash**: the same word means something else here, and which side moves or how the glossary marks it;
- **an idea we lack**: something Effect has that a map-2 or map-6 decision should know about.

Start with the clashes already found: Envelope (ours: the label on a changeset; Effect's `cluster/Envelope`: a transport envelope between entities), Journal (ours: a workflow run's record; `eventlog/EventJournal`), Entity (ours: what a fact is about; `cluster/Entity`: an addressable type with an RPC protocol, Effect's actor), Decision and "decide" (ours: a recorded design answer, and [D130 One shape at the data level][D130]'s "a command decides"; `ai/Decision`, `DecisionModel.decide`: a model's classification of one input), Tool (ours: an app for the people and agents building apps, [D102 Tools are apps][D102]; `ai/Tool`: an operation a model may request, possibly with approval), Prompt (`ai/Prompt`: an ordered list of messages).

Write the record in `docs/research/`, as [I70](0070-research-access-from-membership-to-enterprise.md)'s, with a table per module. Map 3 waits for it; [I51](0051-actors-or-the-engine.md) reads `cluster` itself first, because Cluster's Entity is Effect's answer to vivief's actors. Feeds [I26](0026-glossary-links-on-words-that-are-not-our-terms.md).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: ../adr/0006-one-datom-log.md
[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[ADR-0017]: ../adr/0017-sync-outbox-and-cursor-stream.md
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D135]: ../plan/bootstrap/02-decision-log.md#d135
