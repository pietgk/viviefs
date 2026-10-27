# Effect's vocabulary against ours

Research record, 2026-10-27, for [I78](../issues/0078-research-effect-vocabulary-against-ours.md). Discussion material for charting map 3, the words, not an ADR, a decision or qualification evidence. The Effect source read is `effect` 4.0.5, the version pnpm pins, vendored as the `repos/effect` subtree (pulled to the `effect@4.0.5` tag in `473d56331`) at this repository's HEAD `356786983`. Effect paths below are under `repos/effect/packages/effect/src/`; other paths start from the repository root. Our side is `GLOSSARY.md`, [ADR-0032](../adr/0032-what-viviefs-is-about.md), the [decision log](../plan/bootstrap/02-decision-log.md), the map-2 review pages and the code under `libs/`, `apps/`, `features/` and `tools/`, all at the same commit. Nothing was built or run.

Each section separates **Fact** (what a cited source says, or what the code does) from **Inference** (what this record concludes for ViViEfs). In the module tables, the columns "What it means in Effect" and "Ours" are fact; "Sort" and "Note" are inference. A recommendation is never a decision: map 3 decides.

Where map 2 already compared a module (EventLog in [I53](../issues/0053-sync-and-conflict.md) and [I54](../issues/0054-trust-encryption-and-who-may-sign-in.md), Cluster in [I51](../issues/0051-actors-or-the-engine.md)), this record cites the review page and says whether the source still agrees; it does not redo the comparison.

## The question

[D135](../plan/bootstrap/02-decision-log.md#d135) says a concept Effect already names takes Effect's name and meaning. Before map 3 settles the words, which of Effect's main names mean the same as ours, which use the same word for something else (a clash), and which name an idea a decision of map 2 (made) or map 6 (agents and replayable runs, later) should know about? The full brief, and the six clashes found before this record, are in [I78](../issues/0078-research-effect-vocabulary-against-ours.md).

## Short answer

Every name the issue lists exists in 4.0.5: `ai` (`Prompt`, `Tool`, `Toolkit`, `Chat`, `LanguageModel`, `Decision`, `DecisionModel` with `decide`, `McpServer`), `cluster` (`Entity`, `Envelope`, `Message`, `Reply`, `Singleton`, `Sharding`, `Runner`), `persistence` (`PersistedQueue`, `KeyValueStore`) and `eventlog/EventJournal`. They are imported as `effect/ai`, `effect/cluster` and so on (`packages/effect/package.json`, `exports`), no longer under `effect/unstable/...`. Every module in these sub-areas is marked `@stability unstable`. The code imports nothing from `ai`, `cluster`, `eventlog` or `persistence` today.

The clashes that matter most, with the recommended direction (inference):

1. **Tool.** Effect's `Tool` is an operation a model may request, possibly after approval (`ai/Tool.ts:1-12`). Ours is an app for the people and agents building apps ([D102](../plan/bootstrap/02-decision-log.md#d102)). Our own text already uses both: [D134](../plan/bootstrap/02-decision-log.md#d134)'s "an agent reads a frame through a tool" is Effect's sense. Keep D102's word for the app, and always write Effect's as "a model's tool" or `Tool`; reword D134's sentence.
2. **Effects in Vision - View - Effects.** In Effect an `Effect` is a description of work not yet run (`Effect.ts:2`), and what actually happened is an `Exit` (`Exit.ts`, top comment). [D98](../plan/bootstrap/02-decision-log.md#d98)'s Effects ("what actually happens") reads the other way round. The glossary entry must say it means the plain word, not the library's type.
3. **Journal.** Effect has three journals, none of them a workflow run's record: `EventJournal` (an event log's whole store, nearer our log), the journal of an `Effect.tx` transaction, and a list inside `MessageStorage`'s memory driver. The `workflow` module never says journal. Keep ours ([D14'](../plan/bootstrap/02-decision-log.md#d14p), [ADR-0036](../adr/0036-the-journal-is-the-fence.md)); mark that the log is never called a journal.
4. **Envelope.** Effect uses envelope for a transport wrapper in three places (`cluster/Envelope`, `cluster/Message`, `rpc/RpcMessage`). Ours is the stored label of a changeset, part of the sync RPC. Keep ours and mark it; both carry the same trace context fields.
5. **Decision and "decide".** `Decision` and `DecisionModel.decide` exist: a model classifies, rates or estimates one input. Keep our Decision (a `D<n>` entry) and [D130](../plan/bootstrap/02-decision-log.md#d130)'s "a command decides"; mark both. A model's answer from `decide` is an enrichment with the model as origin, never a decision.
6. **Prompt.** Effect has three: `ai/Prompt` (the ordered messages sent to a model), an MCP prompt (a named template a server offers) and `cli/Prompt` (an interactive terminal question). Ours is one kind of intent, a person's request to an agent, which in Effect is a user message inside a `Prompt`. If map 3 makes "prompt" a term, it says so.
7. **Entity.** Settled in meaning by [D137](../plan/bootstrap/02-decision-log.md#d137); the source agrees. What remains is wording: Effect already splits the parts as `EntityType` and `EntityId`, and has no separate word for "an entity type that acts", because its `Entity` always acts.
8. **Worker.** Our glossary's Worker (the program that runs workflows, Temporal's word) clashes with Effect's `workers/Worker` (a web or Node worker thread). Effect's word for our meaning is runner (`cluster/Runner`), and our own decisions already say "server runner" ([D14'](../plan/bootstrap/02-decision-log.md#d14p), [D39'](../plan/bootstrap/02-decision-log.md#d39p)). Consider runner.
9. **Deferred.** Our Deferred is Effect's `DurableDeferred`; Effect's own `Deferred` is an in-memory cell. Consider "durable deferred", as "Durable clock" already follows `DurableClock`.
10. **Smaller clashes:** `tx` against `Effect.tx` and `TxRef`; Command against `effect/cli`'s `Command`, which `tools/` already imports; "session" against `Chat`'s conversation sessions; "model" alone against `ai/Model` and `schema/Model`; the glossary's "tag" for a service, where Effect 4's `Context` says key.

Ideas we lack, for decisions already made or still to come (inference):

- **Tool calls under the journal (map 6).** `LanguageModel` can leave tool calls unresolved (`disableToolCallResolution`) so the caller runs each one, and a tool can require approval through prompt parts. Each tool call could be an activity or a registered command, and an approval a durable deferred ([D117](../plan/bootstrap/02-decision-log.md#d117), [D140](../plan/bootstrap/02-decision-log.md#d140)). Tool annotations (`Readonly`, `Destructive`, `Idempotent`, `OpenWorld`) line up with a Presenter read, a command's declared writes and an activity's idempotency key.
- **A stored result reused instead of rerun (map 6, [I29](../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md)).** `Persistable`, `Persistence` and `PersistedCache` store a request's `Exit` by primary key and return it after a restart, which is Effect's name for "record once, replay without the model" outside a workflow.
- **A model's name and its telemetry ([I64](../issues/0064-build-origin-trust.md), map 6).** `ai/Model` provides `ProviderName` and `ModelName`; `ai/Telemetry` writes OpenTelemetry `gen_ai.*` attributes. An origin entity for a model ([D141](../plan/bootstrap/02-decision-log.md#d141)) and its durable spans can use them.
- **Typed model judgments ([D111](../plan/bootstrap/02-decision-log.md#d111), [D116](../plan/bootstrap/02-decision-log.md#d116)).** `DecisionModel` returns typed `Classify`, `Rate` and `Probability` answers with a `confidence`. An enriching implementation can use it, but its confidence is not a trust level: D116 rejected a score.
- **How a ViViEfs tool reaches an agent (map 6).** `McpServer` exposes a toolkit, resources and prompts. That is where D102's tools and Effect's tools meet: `verify` offered to an agent is both.

## The clashes already found

### Envelope

**Fact.**

- Ours: "The label on a changeset: who made it, on which device, and why. One fixed-shape record per changeset, keyed by `cs`: actor, device, lease epoch, trace context, command name, acceptance time. Stored in the `changesets` table, not as datoms" (glossary, Envelope; [D58](../plan/bootstrap/02-decision-log.md#d58), [D58'](../plan/bootstrap/02-decision-log.md#d58p)). In code it is the Schema `Envelope` with `cs`, `actor`, `device`, `leaseEpoch`, `traceId`, `spanId`, `sampled`, `command` and `acceptedAt` (`libs/datom/src/schema.ts:34-49`), sent in the sync RPC.
- `cluster/Envelope.ts:1-8`: "Defines the transport envelopes exchanged by cluster entities." An `Envelope` is a `Request`, an `AckChunk` or an `Interrupt` (`:74`). A `Request` carries `requestId`, `address`, `tag`, `payload`, `headers` and an optional `traceId`, `spanId` and `sampled` (`:114-124`).
- `cluster/Message.ts` names `IncomingEnvelope` and `OutgoingEnvelope` (`:149`, `:212`) for control messages moved between runners. `rpc/RpcMessage.ts` (top comment) calls its protocol messages "Message envelopes shared by unstable RPC clients, servers, serializers, and transports".
- [I78](../issues/0078-research-effect-vocabulary-against-ours.md)'s comment of 2026-10-26 records that Cluster's runtime is not adopted ([D39'](../plan/bootstrap/02-decision-log.md#d39p)) and that `cluster/Envelope` stays a clash.

**Inference.** The clash holds and widens to three places in Effect, all transport. Ours is stored and kept with the changeset forever; Effect's lives for one delivery. Both carry the same three trace fields, which is why a reader may take one for the other. Ours does not move: the name is in the schema of the sync RPC, and [D44'](../plan/bootstrap/02-decision-log.md#d44p) keeps RPC names additive. The glossary entry can add one line: "Not Effect's `Envelope`, which wraps one message in transport." Because the stack does not use Cluster or write its own RPC protocol, the word is free in our code.

### Journal

**Fact.**

- Ours: "The record of what a workflow run has done so far, so it can carry on after a restart. The datoms recording an execution's activity results, deferred completions, clocks, leases and result" (glossary, Journal). [D14'](../plan/bootstrap/02-decision-log.md#d14p) and [ADR-0036](../adr/0036-the-journal-is-the-fence.md) make it the fence; [D39'](../plan/bootstrap/02-decision-log.md#d39p) is titled "One engine, one journal, one fence".
- `eventlog/EventJournal.ts:1-13`: "Stores event-log entries and replication state ... records committed entries, exposes them for replay, publishes local changes". The service writes entries, imports remote ones and streams `changes` (`:44-114`). An `Entry` is `{ id, event, primaryKey, payload }` (`:298-303`).
- `Effect.ts:14789-14821`: an `Effect.tx` transaction keeps a `journal`, a map from each `TxRef` read or written to its version and value. `TxRef.ts` (top comment): "reads and writes inside `Effect.tx` are recorded in a transaction journal and committed together".
- `cluster/MessageStorage.ts:962-969`: the in-memory driver keeps "maps used to track requests, primary keys, unprocessed envelopes, reply IDs, and the journal".
- The `workflow` modules (`Workflow.ts`, `Activity.ts`, `WorkflowEngine.ts`, `DurableDeferred.ts`, `DurableClock.ts`, `DurableQueue.ts`) never use the word. Effect's engine "executes activities, stores durable deferred results" (`WorkflowEngine.ts:1-10`) and an activity's result is "stored" (`Activity.ts:1-10`). Cluster's engine persists in `MessageStorage`, which the [actors review](2026-10-24-actors-or-the-engine-review.html), section 2, calls "the cluster's journal".
- The [sync review](2026-10-26-sync-and-conflict-review.html), section 2, set `EventJournal` beside our log store and outbox, not beside our journal. The source still agrees.

**Inference.** No Effect name means what our Journal means, so there is nothing to take. The real risk runs the other way: Effect calls a whole log a journal, so a reader who knows Effect may call our datom log "the journal". The glossary entry can add: "One run's facts in the log, not the log itself (Effect's `EventJournal`)". `Effect.tx`'s journal is internal and needs no line.

### Entity

**Fact.**

- Ours: "The thing a fact is about ... A type and an id; the subject `e` of datoms ... Most entities only have facts said about them; a workflow run also acts" (glossary, Entity). [D137](../plan/bootstrap/02-decision-log.md#d137): "In code Effect's `Entity` names the type and our `entity` an instance's id; the word for an entity that acts is map 3's."
- `cluster/Entity.ts:62-74`: "Represents a cluster entity type and the RPC protocol it can handle." `EntityType.ts:19` and `EntityId.ts:19` are branded strings: "a kind of entity" and "one entity instance within an entity type". `EntityAddress.ts` (top comment) combines "the entity type, entity id, and shard id".
- `eventlog/Event.ts:1-8` says an event "derives the aggregate or entity primary key from the decoded payload".
- The [actors review](2026-10-24-actors-or-the-engine-review.html), section 10, compared the two in full. The source at 4.0.5 still reads as quoted there.

**Inference.** The meaning is settled and the source agrees. Two wording points remain for map 3. First, Effect already has the words for the parts: `EntityType` for what the catalog declares per type, `EntityId` for what a datom's `e` holds. Our prose can say "entity type" and "entity id" in Effect's sense with no change of meaning. Second, Effect has no separate word for an entity type that acts, because every Cluster `Entity` acts. Map 3 picks one; "actor" is taken by the envelope field ([D141](../plan/bootstrap/02-decision-log.md#d141)), so a phrase such as "an acting entity type" may be enough while the execution is the only one.

### Decision and "decide"

**Fact.**

- Ours: Decision is "An answer agreed in a design discussion, numbered `D<n>` and named" (glossary). Access decision is "Always the two words: a decision alone is a decision-log entry" (glossary). [D130](../plan/bootstrap/02-decision-log.md#d130): "A command **decides**: read model, intent and mint to a changeset or a `DomainError`". [D132](../plan/bootstrap/02-decision-log.md#d132) lists "one decision" among the kinds of intent; the [one-shape review](2026-10-10-one-shape-review.html), 10b, describes it as "One question and its options (Q7: A, B, C)".
- Both Effect names exist in 4.0.5. `ai/Decision.ts:1-6`: "Defines decisions that a `DecisionModel` answers over a single input." Three kinds: `Classify` (one label from criteria, `:56`), `Rate` (a level on an ordered scale, `:74`) and `Probability` (how likely a statement holds, `:92`); a `Definition` pairs an input schema with named decisions (`:187`). A `ClassifyAnswer` has a `label` and an optional provider-defined `confidence` in `[0, 1]`.
- `ai/DecisionModel.ts:1-4`: "`decide` encodes one input as JSON, sends its named decisions in one provider call, and validates the answers." `decide` is the service method (`:194-205`) and a function (`:457`).

**Inference.** Three different things share the word. Ours is the oldest and is in every link (`D<n>`), so it does not move. D130's verb is event sourcing's decide (beside evolve), unrelated to `DecisionModel.decide`; it can stay, with the glossary entry for Command saying so if map 3 names the verb. The glossary entry for Decision can add: "Not Effect's `Decision`, a model's answer about one input." When an enriching activity calls `DecisionModel.decide`, the answer is enrichment ([D111](../plan/bootstrap/02-decision-log.md#d111)) with the model as origin. Its `confidence` is the provider's number, not a trust level ([D116](../plan/bootstrap/02-decision-log.md#d116) rejected a score). One convergence is worth keeping: D132's "one decision" kind of intent (a question with labelled options) has the shape of `Decision.classify`, answered by a person instead of a model.

### Tool

**Fact.**

- Ours: [D102](../plan/bootstrap/02-decision-log.md#d102): "A tool is an app whose users are the people and agents building apps ... `verify`, `qualify`, the generators, `exercise` ... The Tool glossary entry ... [is] map 3's." [D52](../plan/bootstrap/02-decision-log.md#d52) makes `tools/` a project kind. There is no glossary entry Tool yet.
- [D134](../plan/bootstrap/02-decision-log.md#d134): "An agent reads a frame through a tool, not a surface." The [one-shape review](2026-10-10-one-shape-review.html), 10a, says this tool "is Effect's word (10d)".
- `ai/Tool.ts:1-12`: "Definitions and helpers for tools that AI models can request during a workflow. A tool names an operation, describes the parameters it accepts, declares successful and failed results, and can require approval before execution." Approval is static or a function of the parameters (`:134-172`). Annotations: `Readonly`, `Destructive`, `Idempotent`, `OpenWorld` (`:1830-1913`).
- `ai/Toolkit.ts` (top comment): "Groups AI tools together with their handlers ... execute tool calls by name". `ai/McpServer.ts` registers a toolkit for the Model Context Protocol (`registerToolkit`, `:2044`).

**Inference.** A real clash, and one we already have inside our own text: D102 and D134 use "tool" in the two senses. Under D135 the concept "an operation a model may call" takes Effect's name, so D134 is right to say tool, but it needs a qualifier once D102's tool is a glossary term. Two directions for map 3:

- **Keep D102's Tool** (the app) as the glossary term and write Effect's as "a model's tool" in prose and `Tool` in code. Least churn: `tools/`, `verify` and `qualify` stay as they are.
- **Give D102's meaning another word** ("build tool", "developer tool") and leave "tool" to Effect's sense, which agents and their docs use. Cleaner for an agent reader, but D52's `tools/` keeps the old word in every path.

The first fits the repository better (recommendation, inference). The two meet when a ViViEfs tool is offered to an agent through `McpServer`: `verify` would then be a tool in both senses, which the glossary can show as its example.

### Prompt

**Fact.**

- Ours: not a glossary term. [D132](../plan/bootstrap/02-decision-log.md#d132) lists "a prompt" among the kinds of intent, and the [one-shape review](2026-10-10-one-shape-review.html), 10b, gives it as "One request to an agent, a plan", crossing its frontier when "the human approves the plan or the diff".
- `ai/Prompt.ts:1-9`: "A prompt is an ordered list of messages. Messages can use roles such as system, user, assistant, and tool, and their content can be split into typed parts such as text, files, reasoning, tool calls, tool results, and approval messages." Approval parts: `ToolApprovalResponsePart` (`:820`) and `ToolApprovalRequestPart` (`:939`).
- `ai/McpServer.ts:2528`, `:2669`: `registerPrompt` and `prompt` register an MCP prompt, a named template a server offers to a client.
- `cli/Prompt.ts` (top comment): "Builds interactive terminal prompts for CLI applications. A `Prompt<A>` describes a small terminal UI that ... eventually produces an `A`."

**Inference.** Effect itself uses the word three ways. Ours is the narrowest: the request a person writes, which `ai/Prompt` holds as one user message among the system message, the history and the tool results. Nothing needs to move today. If map 3 makes "prompt" a term (as a kind of intent), its entry should say it is the person's request, and that Effect's `Prompt` is the whole list of messages a model receives.

## Clashes the issue did not list

### Effects (Vision - View - Effects), `Effect` and `Exit`

**Fact.** The glossary's Effect is the library. [D98](../plan/bootstrap/02-decision-log.md#d98): "`Effects` is what actually happens (the log, evidence notes, traces) ... The three words get glossary entries in map 3, because 'effect' also names Effect." `Effect.ts:1-8`: "Describes workflows that run only when executed by the Effect runtime ... Creating an effect does not perform the work; it builds a value". `Exit.ts` (top comment): "Represents the result of an Effect computation as a plain value." Our journal keeps exits under pinned attributes (`viviefs/activity/exit`, `viviefs/deferred/exit`; [AGENTS.md](../../AGENTS.md), [P06](../plan/bootstrap/06-qualification-gates.md#p06)). vivief's effect is "data: a description of something that happens or is asked for" ([I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md)).

**Inference.** In Effect's own vocabulary an `Effect` is closer to an intent (what may happen when run) and an `Exit` is what happened. D98's Effects is the plain English word, "the effects of what we did". Map 3 keeps the name (it is the project's), but the entry must say it is not Effect's `Effect`, and [I26](../issues/0026-glossary-links-on-words-that-are-not-our-terms.md)'s linker must be able to tell "Effects" in the name from the library. The same holds for I30's formula: `Effect` and `Context` are not free as names for data in a codebase written in Effect (see the waiting words, below).

### Worker and runner

**Fact.** Glossary, Worker: "The phone or server program that runs workflows ... Temporal vocabulary in [D2](../plan/bootstrap/02-decision-log.md#d2), not a separate product." `workers/Worker.ts` (top comment): "Client-side worker primitives shared by browser, Node, and Bun adapters", that is, worker threads; the code uses one through `@effect/sql-sqlite-wasm/OpfsWorker`. `workflow/DurableQueue.ts:1-17` also calls the process that takes queued items a worker. `cluster/Runner.ts` (top comment): "Cluster runner metadata for processes that can host entity shards." Our decisions say "a server runner takes over a run" ([D14'](../plan/bootstrap/02-decision-log.md#d14p)) and "more runners writing on the journal head" ([D39'](../plan/bootstrap/02-decision-log.md#d39p)).

**Inference.** Effect's word for "a process that runs durable work" is runner; its worker is a thread or a queue consumer. Our decisions already moved to runner. Map 3 could retire the glossary's Worker in favour of runner, or mark it as Temporal's word with runner as the term in use. The glossary's Coverage producer avoids "runner" for a test runner; that line can stay, because it keeps a coverage producer from being called a runner. The other way round, worker for runner, would collide with our own code: "worker" already names the OPFS web worker the web log store runs SQLite in (`libs/store-sqlite-wasm`, the `p0N-opfs-worker.ts` files) and the open upstream issue about it, while Temporal's worker appears only in three "workflows, workers, activities" lists ([D2](../plan/bootstrap/02-decision-log.md#d2), the vision page, [ADR-0012](../adr/0012-datom-backed-workflow-engine.md)). One sentence reads against runner as our term: [ADR-0036](../adr/0036-the-journal-is-the-fence.md)'s "A device cannot be a runner" means a Cluster runner and would say so.

### Deferred

**Fact.** Glossary, Deferred: "A durable wait completed from outside". `workflow/DurableDeferred.ts:1-8`: "named wait points for durable workflow executions". `Deferred.ts` (top comment): "One-time coordination cells ... can be completed exactly once", in memory. Our decisions also use "deferred" for a postponed item (`Decide when:`, [D158](../plan/bootstrap/02-decision-log.md#d158)).

**Inference.** Ours is `DurableDeferred`, as Durable clock is `DurableClock`. Naming the entry "Durable deferred" would follow D135 and free "deferred" for its everyday sense in the decision log.

### `tx` and "transaction"

**Fact.** Ours: `tx` is a datom's transaction id, minted by the HLC; the glossary's Changeset avoids "transaction (a datom's own unit)". Effect: `Effect.tx` defines an all-or-nothing transaction over `TxRef`s, with a `Transaction` service and a retry reason `"conflict"` (`Effect.ts:14812-14929`, `@stability stable`); `SqlClient.withTransaction` is a database transaction (`sql/SqlClient.ts:61`), which `libs/datom/src/log-store.ts:223` and `libs/datom/src/projector.ts:656` use.

**Inference.** `tx` is pinned in the datom shape ([D44](../plan/bootstrap/02-decision-log.md#d44)) and stays. A glossary line for `tx` (there is none now) can say "a datom's id, not `Effect.tx`". The code uses no `TxRef`, so the clash is for readers only.

### Command

**Fact.** Glossary, Command: "A named kind of change, the only way people, agents and outside sources write data." `cli/Command.ts` (top comment): "A `Command` combines a name, typed flags and positional arguments, optional subcommands, help metadata, and an effectful handler." Our tools use it: `tools/verify/src/verify.ts:9`, `:414` and `tools/qualification/src/cli.ts:7`, `:268`.

**Inference.** Two meanings already live in our code, in different project kinds. Ours stays (registered commands, [D127](../plan/bootstrap/02-decision-log.md#d127)). The glossary can add: "Not a command-line command (`effect/cli`'s `Command`)". [I26](../issues/0026-glossary-links-on-words-that-are-not-our-terms.md)'s linker meets this word in every guide about `verify`.

### Session

**Fact.** Glossary, Sign-in session: "The only thing called a session." `ai/Chat.ts:1-10`: "Stateful conversation sessions on top of a language model", kept in a `Ref` and optionally persisted (`Persistence`, `:741`). `repos/effect/LLMS.md`, "Working with AI modules", calls them "Stateful chat sessions". `eventlog/EventLogSessionAuth.ts` signs session traffic.

**Inference.** Map 6 will bring agents with chats. The glossary can keep its rule and name Effect's as "a chat" or "a conversation", never a session.

### Model

**Fact.** Glossary: Read model; "a model's judgment" (Enrichment) and "a model" (Origin) for an AI model. `ai/Model.ts` (top comment) wraps a provider layer with `ProviderName` and `ModelName`. `schema/Model.ts` (top comment): "schema-backed domain models with separate database and JSON shapes", used once in `apps/evidence-mobile/src/p01-effect-checks.ts:13`.

**Inference.** "Model" alone already means an AI model in our glossary, which agrees with `ai/Model`. Read model is always two words. `schema/Model` is a third sense; the stack does not build on it. No move; the glossary can say that "model" alone is an AI model.

### Service: tag or key

**Fact.** Glossary, Service: "In Effect it is a tag with an interface". `Context.ts:55-110` calls it a key throughout (`Key`, `Service`, "Context key with helper methods for working with a service") and has no "tag". Across the rest of `src/` (outside `internal/`), comments say "service tag" 37 times and "service key" 41 times. Every service in our code extends `Context.Service` (for example `libs/datom/src/log-store.ts:33`).

**Inference.** Same meaning. The glossary sentence can say "a key (`Context.Service`) with an interface", Effect 4's own word.

## How the code uses Effect's names today

**Fact** (code at `356786983`):

- `workflow`: `Workflow`, `Activity`, `DurableDeferred` and `WorkflowEngine` in `libs/workflow-engine/src/engine.ts:13-16` and `features/evidence/model/src/device-resume.ts:6-9`; `DurableClock` in the engine's suites (`libs/workflow-engine/src/suites/crash-matrix.ts`, `trace-scenario.ts`). The engine implements `WorkflowEngine` ([ADR-0012](../adr/0012-datom-backed-workflow-engine.md)) and parents an activity's live spans on its durable span with `Tracer.externalSpan` (`engine.ts:606`).
- `reactivity`: `Reactivity` in `libs/datom/src/projector.ts:5` and `libs/sync/client/src/client.ts:19`; `Atom` with `Atom.withReactivity` in `features/evidence/client/src/intent-composer/query-atom.ts:3`.
- `rpc`: `Rpc`, `RpcGroup` and `RpcMiddleware` in `libs/sync/protocol/src/rpc.ts:2-4`, where bearer authentication is `class BearerAuthentication extends RpcMiddleware.Service` (`:21`); `RpcClient` in `libs/sync/client/src/client.ts:20`; `RpcServer` and `RpcSerialization` in `apps/evidence-server/src/server.ts:14-15`.
- `sql`: `SqlClient` and `SqlError` in `libs/datom/src/log-store.ts:5-6`, `read-models.ts`, `projector.ts`, `libs/sync/server/src/server.ts:15-16`; `Migrator` only in the P02 probe (`apps/evidence-mobile/src/p02-sql-checks.ts:8`).
- `cli`: `Command`, `Argument`, `Flag` in `tools/verify` and `tools/qualification`.
- Commands are `Effect` values: `renameList` returns `Effect.Effect<CommandChangeset, DomainError>`, its read model and mint passed in (`features/evidence/model/src/command.ts:81-89`).
- Nothing imports `effect/ai`, `effect/cluster`, `effect/eventlog` or `effect/persistence`. (Ignored build output under `out-tsc/` still names the old `effect/unstable/...` paths; it is not in git.)

This backs [D135](../plan/bootstrap/02-decision-log.md#d135)'s list "Service, Layer, Schema, Workflow, Activity, Durable clock, Reactivity, Atom, Rpc and Sql are used as Effect means them".

## Module tables

Names with no overlap with our vocabulary get no row; each group ends with one line saying they were read.

### Core (`effect`)

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Effect` | A description of work that runs only when executed, with success, error and requirements (`Effect.ts:1-8`) | Effect (the library); Effects in Vision - View - Effects; vivief's effect | clash | See "Effects, `Effect` and `Exit`". The top comment also calls any effect a "workflow"; ours is only the durable kind. |
| `Exit` | The result of a run as a plain value (`Exit.ts`, top comment) | Journaled activity and deferred exits (`viviefs/activity/exit`) | same meaning | Our pinned attribute names already use Effect's word. Nearest Effect name for "what actually happens". |
| `Cause` | The full reason an effect failed: typed failures, defects, interruptions (`Cause.ts`, top comment) | Causing span ("the step that caused a write") | clash, mild | Different senses of cause; Causing span's entry can say it is not Effect's `Cause`. Failure as data ([D130](../plan/bootstrap/02-decision-log.md#d130)) is Effect's typed failure. |
| `Context`, `Context.Service`, `Context.Reference` | A typed map of services under keys (`Context.ts:55-110`) | Service; "context" in trace context, an access request ([D151](../plan/bootstrap/02-decision-log.md#d151)), local and global context ([D131](../plan/bootstrap/02-decision-log.md#d131)) | same meaning (Service); clash (the plain word) | Service: say key, not tag. "Context" in our prose is safe in phrases; as a formula name ([I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md)) it is not. |
| `Layer` | How to build services and what they need (`Layer.ts`, top comment) | Layer; Implementation is "one Layer" | same meaning | |
| `Schema` | Data shapes and decoding unknown input into trusted values (`Schema.ts`, top comment) | Schema at every boundary ([D79](../plan/bootstrap/02-decision-log.md#d79)); an attribute's value Schema ([D121](../plan/bootstrap/02-decision-log.md#d121)) | same meaning | |
| `Scope` | A lifetime boundary for resources (`Scope.ts`, top comment) | "scope" in prose: the organization as sync's scope ([D143](../plan/bootstrap/02-decision-log.md#d143)), a read scope ([I70 record](2026-10-09-access-from-membership-to-enterprise.md)) | clash, mild | Ours is a range of data, Effect's a lifetime. If map 3 names a range of data, a word other than scope avoids it. |
| `Effect.tx`, `Transaction`, `TxRef` | An optimistic all-or-nothing transaction over transactional refs, with a journal (`Effect.ts:14789-14929`, `TxRef.ts`) | `tx`; Journal | clash | See "`tx` and transaction". |
| `Deferred` | A one-time in-memory cell fibers wait on (`Deferred.ts`, top comment) | Deferred (durable) | clash | Ours is `DurableDeferred`. |
| `Clock` | The service for time and sleeping (`Clock.ts`, top comment) | HLC (`HlcClock` service), Durable clock | same meaning | The HLC reads physical time and adds its own order; Durable clock is `DurableClock`. |
| `Schedule`, `Cron` | Retry and repeat policies; calendar schedules (`Schedule.ts`, `Cron.ts`) | A Schedule retry for cursor loops ([D138](../plan/bootstrap/02-decision-log.md#d138)) | same meaning | |
| `Tracer`, `Span`, `ExternalSpan` | A span records an operation's lifetime; an external span is a parent from outside (`Tracer.ts`, top comment) | Live span; Durable span, passed as an `ExternalSpan` parent (`libs/workflow-engine/src/engine.ts:606`) | same meaning | A durable span is a span in Effect's sense that no live tracer made. |
| `Request`, `RequestResolver` | A description of one piece of data loading, completed in batches by a resolver (`Request.ts`, `RequestResolver.ts`) | The Presenter's query passed down a chain ([D108](../plan/bootstrap/02-decision-log.md#d108)); a request to the server | idea we lack (small) | Effect's name for "describe a load, let a backend batch it" is a candidate for a Presenter implementation, not a word to adopt. |
| `ExecutionPlan` | Ordered fallback steps, each with its own Layer and retries (`ExecutionPlan.ts`, top comment) | Nothing named | idea we lack (map 6) | Fits an enriching activity that falls back from one model provider to another. |
| `Graph` (`NodeIndex`), `HashRing` | Graph nodes and edges (`Graph.ts:50`); nodes on a consistent-hash ring (`HashRing.ts`) | `node` ([D103](../plan/bootstrap/02-decision-log.md#d103)) | no clash in meaning | Effect has no exported name for our `node`; see the waiting words. |
| `Optic`, `Lens` | A focus into part of a value (`Optic.ts:144`) | "a lens, not a concept" ([D132](../plan/bootstrap/02-decision-log.md#d132)) | clash, mild | Ours is plain English. No move. |
| `Stream.drain` | Runs a stream's effects and emits nothing (`Stream.ts:2510-2529`) | Drain before close (wait for in-flight work) | clash, mild | Different senses; the glossary entry can name its own. |
| `Differ`, `JsonPatch` | A patch describing the difference between two values (top comments) | Changeset avoids "patch" | no clash | A changeset is not a diff; the Avoid line agrees with Effect's meaning. |
| `PubSub` | Broadcast to many subscribers in process (`PubSub.ts`) | No event bus ([D139](../plan/bootstrap/02-decision-log.md#d139)); Reactivity in process | same meaning | |
| `Crypto` | Random bytes, UUIDs and SHA digests per platform | The hash chain ([D155](../plan/bootstrap/02-decision-log.md#d155)) | same meaning | Compared in the [trust review](2026-10-26-trust-encryption-and-sign-in-review.html), section 2; the source agrees. |
| `Data`, `Brand` | Tagged classes and errors; compile-time names on values | Typed errors; branded entity ids ([D38](../plan/bootstrap/02-decision-log.md#d38)) | same meaning | |

Read with no overlap: `Array`, `BigDecimal`, `BigInt`, `Boolean`, `ByteSize`, `Cache`, `Channel`, `Chunk`, `Combiner`, `Config`, `ConfigProvider`, `Console`, `DateTime`, `Duration`, `Effectable`, `Equal`, `Equivalence`, `ErrorReporter`, `Fiber*`, `FileSystem`, `Filter`, `Formatter`, `Function`, `Hash*`, `Inspectable`, `Iterable`, `JsonPointer`, `JsonSchema`, `Latch`, `LayerMap`, `LayerRef`, `Logger`, `ManagedRuntime`, `Match`, `Metric`, `Mutable*`, `Newtype`, `Number`, `Option`, `Order`, `PartitionedSemaphore`, `Path`, `Pipeable`, `Pool`, `Predicate`, `PrimaryKey`, `Pull`, `Queue`, `Random`, `RcMap`, `RcRef`, `Record`, `Redacted`, `Reducer`, `References`, `RegExp`, `Resource`, `Result`, `Runtime`, `Scheduler`, `Schema*` helpers, `ScopedCache`, `ScopedRef`, `Semaphore`, `Sink`, `Stdio`, `String`, `Struct`, `SubscriptionRef`, `Symbol`, `Take`, `Terminal`, `Trie`, `Tuple`, the other `Tx*` collections, `Types`, `UndefinedOr`, `Unify`, `Utils`, `Version`.

### `workflow`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Workflow` | A typed durable workflow with a tag, schemas, and an idempotency key that derives execution ids (`workflow/Workflow.ts:1-10`) | Workflow | same meaning | Used as is ([D10](../plan/bootstrap/02-decision-log.md#d10)). |
| `Workflow.Execution`, `executionId`, `WorkflowInstance` | The type of one run; its id; the runtime state of one run (`Workflow.ts:225`, `WorkflowEngine.ts:244`) | Execution (`O{org}/W{exec}`) | same meaning | |
| `Workflow.Result` (`Complete`, `Suspended`) | A run's result: done, or suspended (`Workflow.ts:513`) | Lifecycle started, suspended, interrupted, done ([D136](../plan/bootstrap/02-decision-log.md#d136)) | same meaning | |
| `Activity` | A named effect whose result the engine stores and replays (`Activity.ts:1-10`) | Activity | same meaning | |
| `WorkflowEngine` | The service that registers and runs workflows, activities, deferreds and clocks (`WorkflowEngine.ts:1-10`, `:40`) | Engine, our datom-backed implementation | same meaning | |
| `DurableDeferred` | A named wait point, completed later by a token (`DurableDeferred.ts:1-8`) | Deferred | same meaning, other name | See "Deferred". |
| `DurableClock` | A durable timer for workflow sleeps (`DurableClock.ts:1-7`) | Durable clock | same meaning | |
| `DurableQueue` | A workflow hands a payload to a `PersistedQueue` and waits for a worker's result (`DurableQueue.ts:1-17`) | Nothing named | idea we lack (small) | Compared in the [actors review](2026-10-24-actors-or-the-engine-review.html), section 2. A worker pool beside the engine is not needed today ([D138](../plan/bootstrap/02-decision-log.md#d138)). |
| `withCompensation` | Cleanup run if the whole workflow later fails after a step succeeded (`Workflow.ts:962`) | Workflow avoids "saga" | idea we lack (small) | If an app needs to undo a step, compensation is Effect's word for it. |
| `CaptureDefects`, `SuspendOnFailure` | Whether defects are kept in a result; whether a failure suspends the run (`Workflow.ts:1009`, `:1027`) | Failure is data ([D130](../plan/bootstrap/02-decision-log.md#d130)) | same meaning | |

Read with no overlap: `WorkflowProxy`, `WorkflowProxyServer` (derive RPC and HTTP groups from workflows).

### `cluster`

Map 2 read `cluster` in the [actors review](2026-10-24-actors-or-the-engine-review.html), sections 2, 8, 9 and 10, on 4.0.5; the lines it cites still hold. [D39'](../plan/bootstrap/02-decision-log.md#d39p) does not adopt Cluster's runtime.

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Entity` | An entity type and the RPC protocol it handles (`cluster/Entity.ts:62-74`) | Entity ([D137](../plan/bootstrap/02-decision-log.md#d137)) | same meaning, wording differs | See "Entity". |
| `EntityType`, `EntityId`, `EntityAddress` | A kind of entity; one instance's id; type, id and shard together (`EntityType.ts:19`, `EntityId.ts:19`, `EntityAddress.ts`) | An entity's type and id | same meaning | Usable words for the parts. |
| `Envelope` | A transport envelope between entities (`Envelope.ts:1-8`) | Envelope | clash | See "Envelope". |
| `Message` | Requests and control envelopes moved between callers, storage and runners (`Message.ts`, top comment) | A workflow's mailbox, the outside inputs ([D136](../plan/bootstrap/02-decision-log.md#d136)) | no clash in meaning | We have no "message" term; mailbox is prose. |
| `Reply` | A final `WithExit` or a streamed `Chunk` for a request (`Reply.ts`, top comment) | Nothing | no overlap | |
| `MessageStorage` | Persisted requests and replies, the mailbox's durable state (`MessageStorage.ts`, top comment) | Our journal and log | different design | Section 9 of the actors review: a work queue with claims and deletes, which fits the log poorly. Source agrees. |
| `Sharding`, `ShardId`, `ShardingConfig` | Shard ownership and routing by locks that expire (`Sharding.ts`, `ShardingConfig.ts`) | Nothing; partial `node`s ([D114](../plan/bootstrap/02-decision-log.md#d114)) | no overlap | Not adopted ([D39'](../plan/bootstrap/02-decision-log.md#d39p)). |
| `Runner`, `Runners`, `RunnerStorage`, `RunnerHealth` | A process that hosts entity shards, and how runners reach and check each other (`Runner.ts`, `Runners.ts`) | "server runner" ([D14'](../plan/bootstrap/02-decision-log.md#d14p)); Worker (glossary) | same meaning (runner) | See "Worker and runner". Effect's comments call runners "nodes" (`HttpRunner.ts:4`, `SingleRunner.ts:7`). |
| `Singleton`, `ClusterCron` | An effect with one owner in the cluster; a cron job run through sharding (top comments) | A server workflow looping on a durable clock ([D138](../plan/bootstrap/02-decision-log.md#d138)) | idea already decided | D138 needs neither. |
| `ClusterWorkflowEngine` | `WorkflowEngine` on entities and `MessageStorage` (top comment) | Our engine, the same interface | same contract, other implementation | Stays possible behind `WorkflowEngine` ([I8](../issues/0008-engine-scale-out.md)). |
| `SingleRunner` | A one-process cluster over SQL (top comment) | Nothing | no overlap | |
| `Snowflake`, `MachineId` | A time-sortable id from milliseconds, a machine id and a sequence (top comments) | Minted id segments from the HLC, with a device fingerprint ([D120](../plan/bootstrap/02-decision-log.md#d120)) | same idea, other mechanism | No word to take: ours sorts by the HLC, corrected against authority. |
| `DeliverAt` | A message that carries its own delivery time (top comment) | A `wake_at` datom ([D24](../plan/bootstrap/02-decision-log.md#d24)) | same idea | No word to take. |
| `EntityProxy` | RPC and HTTP API "surfaces" derived from entities (`EntityProxy.ts:2`) | Surface ([D134](../plan/bootstrap/02-decision-log.md#d134)) | clash, already listed | D134 already lists "API surface". |
| `ClusterSchema.Persisted`, `WithTransaction` | Annotations: a request is persisted; handled in a transaction (top comment) | Nothing | no overlap | |

Read with no overlap: `ClusterError`, `ClusterMetrics`, `EntityProxyServer`, `EntityResource`, `HttpRunner`, `K8sHttpClient`, `K8sTypes`, `RunnerAddress`, `RunnerServer`, `ShardingRegistrationEvent`, `SocketRunner`, `SqlMessageStorage`, `SqlRunnerStorage`, `TestRunner`.

### `eventlog`

Map 2 compared this group in the [sync review](2026-10-26-sync-and-conflict-review.html), section 2, and the [trust review](2026-10-26-trust-encryption-and-sign-in-review.html), section 2, both on 4.0.5. The lines they cite (`EventJournal.ts:44`, `EventLog.ts:189`, `:596`, `:695`, `EventLogServerUnencrypted.ts:294`) still hold.

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Event`, `EventGroup` | A typed event definition, "the durable contract shared by writers, handlers, journals, and replicas" (`eventlog/Event.ts:1-8`) | Datom avoids "event"; a registered command ([D127](../plan/bootstrap/02-decision-log.md#d127)) | no clash | A datom is a fact, not an event; the Avoid line agrees. Nearest to our registered command is an `Event` with its handler. |
| `EventJournal`, `Entry` | An event log's store of committed entries, replayed and replicated (`EventJournal.ts:1-13`) | Log store; Journal | clash (Journal) | See "Journal". |
| `RemoteEntry.remoteSequence`, `nextRemoteSequence` | The server's sequence number a replica catches up from (`EventJournal.ts:378`) | Cursor | same meaning, other name | Our design took it from EventLog ([ADR-0017](../adr/0017-sync-outbox-and-cursor-stream.md)). No move. |
| `conflicts` (in `writeFromRemote`) | Later entries with the same key, handed to the handler on ingest | Conflict policy, decided at accept ([D34'](../plan/bootstrap/02-decision-log.md#d34p)) | same meaning | The sync review found the word agrees. |
| `EventLog` (handler runs, then the entry commits) | Writers send typed payloads; "the matching handler runs first, and the journal entry is committed only after the handler succeeds" (`EventLog.ts:1-7`) | A command returns a changeset and does not write | different design | Relevant to `effectHandler`'s name (below). |
| `Registry` | Collects handlers, compaction handlers, replicas and reactivity keys (`EventLog.ts:74`) | Registry (verify's list of file treatments) | clash, mild | Also `AtomRegistry`. The glossary entry can say it is verify's. |
| `Identity` | A key pair from which signing and encryption keys derive (`EventLog.ts:189`) | Identity, self-certifying ([D152](../plan/bootstrap/02-decision-log.md#d152)) | same meaning | Settled by D152. |
| `EventLogServerAuthorization` | `authorizeWrite`, `authorizeRead`, `authorizeIdentity` (`EventLogServerUnencrypted.ts:294`) | Access decision at accept and sync's filter ([D150](../plan/bootstrap/02-decision-log.md#d150)) | same meaning | Settled by D150. |
| `groupCompaction` | During replay, a key's entries replaced by fewer (`EventLog.ts:596`) | Compaction past a horizon on a device ([ADR-0011](../adr/0011-log-store-pattern.md)) | clash, mild | Effect's rewrites entries; ours drops facts every consumer acknowledged. If map 3 adds a Compaction entry, mark it. |
| `groupReactivity` | Reactivity keys invalidated when events are written (`EventLog.ts:695`) | The projector invalidates Reactivity keys | same meaning | |
| `EventLogEncryption`, `EventLogServerEncrypted` | Entries encrypted whole so the server never reads them | Encryption level, group (deferred, [D149](../plan/bootstrap/02-decision-log.md#d149)) | same idea | Compared in the trust review. |
| `StoreId`, `StoreMapping` | The id of one replicated log; mapping client ids to server stores | One log per organization | same idea | No word to take: ours is the organization. |
| `EventJournal` and replicas | "Connects a local event log to a remote replica" (`EventLogRemote.ts`, top comment) | Local replica; `node` | same idea | See `node` below. |

Read with no overlap: `EventLogMessage`, `EventLogServer`, `EventLogServerUnencrypted` storage helpers, `EventLogSessionAuth` (compared in the trust review), `SqlEventJournal`, `SqlEventLogServerEncrypted`, `SqlEventLogServerUnencrypted`.

### `persistence`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `KeyValueStore` | String or binary values by key, in memory, files, Web Storage or SQL (`persistence/KeyValueStore.ts`, top comment) | Nothing named | no overlap in words | A candidate for small device state; no word clash. |
| `PersistedQueue` | Schema-encoded work in a named durable queue, at least once, with retries; "outbox-style integrations" (`PersistedQueue.ts:1-10`) | Outbox | same idea, other name | Our outbox is a queue of changesets waiting for the server's acknowledgement. Effect has no `Outbox` name to take. |
| `Persistable`, `Persistence`, `PersistedCache` | A request's `Exit` stored by primary key and reused across fibers and restarts (top comments) | An activity's journaled result, inside a workflow only | idea we lack (map 6) | Effect's name for a recorded result replayed without rerunning, outside a workflow; [I29](../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md)'s idea in Effect's words. |
| `RateLimiter` | Shared rate limits across processes (top comment) | Nothing | no overlap | |

Read with no overlap: `Redis`.

### `reactivity`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Reactivity` | "Process-local invalidation for connecting writes to dependent reads" (`reactivity/Reactivity.ts:1-7`) | Projector invalidates keys; no event bus ([D139](../plan/bootstrap/02-decision-log.md#d139)) | same meaning | |
| `Atom`, `AtomRegistry`, `AsyncResult` | Reactive state run by a registry; an async value's state (top comments) | Query atom | same meaning | |
| "Query atoms" in `AtomRpc`, `AtomHttpApi` | Atoms that call an RPC or endpoint and track the result (`AtomRpc.ts:5`, `AtomHttpApi.ts:5`) | Query atom (SQL over read models) | same meaning | Effect uses our exact phrase. |
| `SqlClient.reactive` | A query that reruns when its Reactivity keys change (`sql/SqlClient.ts:73`) | Query atom | same meaning | |

Read with no overlap: `AtomRef`, `Hydration`.

### `rpc`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Rpc`, `RpcGroup` | Schema-backed contracts for remote procedures, read by both sides (`rpc/Rpc.ts:1-8`) | The sync RPC (`Append`, `Pull`); Contract | same meaning | `Rpc.ts:6` says "the procedure contract", our Contract's sense. |
| `RpcClient`, `RpcServer`, `RpcSerialization` | Client and server runtimes and wire formats (top comments) | Same | same meaning | |
| `RpcMiddleware` | Wraps server handlers and can provide services (top comment) | Bearer authentication, `BearerAuthentication extends RpcMiddleware.Service` | same meaning | The glossary's Avoid "auth middleware" rejects jargon, not Effect's mechanism. |
| `RpcMessage` | "Message envelopes" for the protocol (top comment) | Envelope | clash | See "Envelope". |

Read with no overlap: `RpcClientError`, `RpcSchema`, `RpcTest`, `RpcWorker`, `Utils`.

### `sql`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `SqlClient` | The SQL service with transactions and reactive queries (`sql/SqlClient.ts`, top comment) | Log store implementations, read models | same meaning | |
| `withTransaction` | All queries in one database transaction (`SqlClient.ts:61`) | Changeset avoids "transaction" | no clash | A database transaction is plain SQL; a changeset is not one. |
| `Migrator` | Numbered migrations recorded in a table (`Migrator.ts`, top comment) | Never migrate ([D44](../plan/bootstrap/02-decision-log.md#d44)); `libs/datom/src/migrate.ts` creates the tables | no clash | D44's "never migrate" is about the source of truth: the log is append-only and its facts never change, so it never migrates, and read models are rebuilt from it. Creating the tables a store keeps the log in is storage, not the log's content, so `migrate.ts` is needed and does not read against D44. |
| `SqlModel`, `SqlResolver`, `SqlSchema` | Repositories from schema models; batched SQL requests; schema-wrapped statements | Nothing | no overlap | |

Read with no overlap: `SqlConnection`, `SqlError`, `SqlStream`, `Statement`.

### `ai`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `Prompt` | The ordered messages sent to a model (`ai/Prompt.ts:1-9`) | "a prompt" as a kind of intent ([D132](../plan/bootstrap/02-decision-log.md#d132)) | clash, mild | See "Prompt". |
| `Tool` | An operation a model may request, possibly after approval (`ai/Tool.ts:1-12`) | Tool ([D102](../plan/bootstrap/02-decision-log.md#d102)); "through a tool" ([D134](../plan/bootstrap/02-decision-log.md#d134)) | clash | See "Tool". |
| `Tool` approval, annotations | `needsApproval` (`Tool.ts:134-172`); `Readonly`, `Destructive`, `Idempotent`, `OpenWorld` (`:1830-1913`); approval parts in `Prompt` (`:820`, `:939`) | Gated commit path ([D117](../plan/bootstrap/02-decision-log.md#d117)); declared writes ([D127](../plan/bootstrap/02-decision-log.md#d127)); idempotency keys | idea we lack (map 6) | An approval inside a workflow would be a durable deferred, not a prompt part; a tool's annotations follow from what it wraps (a Presenter read, a command, an activity). |
| `Toolkit` | Tools with their handlers, executed by name (`Toolkit.ts`, top comment) | Nothing | no overlap in words | |
| `LanguageModel` | The provider-neutral service for text, objects and streams, resolving tool calls (`LanguageModel.ts:1-12`) | A model call is an activity ([D140](../plan/bootstrap/02-decision-log.md#d140)) | idea we lack (map 6) | `disableToolCallResolution` (`:314`) lets each tool call run as its own activity or command instead of inside one model call. |
| `Chat`, `Chat.Persistence` | A conversation session with history in a `Ref`, exportable and persistable (`Chat.ts:1-10`, `:741`) | Sign-in session ("the only thing called a session") | clash | See "Session". For map 6, a chat's history is not a journal: a replayable run keeps each model response as an activity result. |
| `Decision` | A classify, rate or probability question about one input (`Decision.ts:1-6`) | Decision (`D<n>`); Access decision | clash | See "Decision and decide". |
| `DecisionModel.decide` | One provider call answering a definition's decisions (`DecisionModel.ts:1-4`, `:457`) | "a command decides" ([D130](../plan/bootstrap/02-decision-log.md#d130)) | clash | Its answer is an enrichment ([D111](../plan/bootstrap/02-decision-log.md#d111)); `confidence` is not a trust level ([D116](../plan/bootstrap/02-decision-log.md#d116)). |
| `McpServer`, `McpSchema`, `McpProtocol` | An MCP server's tools, resources, prompts and completions (`McpServer.ts`, top comment) | Tools are apps ([D102](../plan/bootstrap/02-decision-log.md#d102)); vivief's MCP per domain | idea we lack (map 6) | How a ViViEfs tool or Presenter would reach an agent. |
| `Response` | A model's output as typed parts, complete or streamed (`Response.ts`, top comment) | An activity's result | same idea | What a model-call activity would journal. |
| `Model` (`ProviderName`, `ModelName`) | A model layer with its provider and model names (`Model.ts`, top comment) | Origin "a model and its version" ([D141](../plan/bootstrap/02-decision-log.md#d141)) | idea we lack ([I64](../issues/0064-build-origin-trust.md)) | The origin entity for a model can carry these two names. |
| `Telemetry` | OpenTelemetry `gen_ai.*` attributes on AI spans (`Telemetry.ts`, top comment) | Durable and live spans ([P10](../plan/bootstrap/06-qualification-gates.md#p10)) | idea we lack (map 6) | A model-call activity's live span can carry them. |
| `EmbeddingModel` | Text to vectors (top comment) | Embeddings as intermediate presentations ([D112](../plan/bootstrap/02-decision-log.md#d112)) | same meaning | |
| `IdGenerator` | Ids for tool calls and response items (top comment) | Ids passed in, never made inside a command ([D130](../plan/bootstrap/02-decision-log.md#d130)) | idea we lack (map 6) | A replayed run needs the same ids, so this service would be provided from the journal. |

Read with no overlap: `AiError`, `AnthropicStructuredOutput`, `OpenAiStructuredOutput`, `ResponseIdTracker`, `Tokenizer`. No `ai` module has an exported name `Agent`.

### Glanced: `http`, `http-api`, `observability`, `workers`, `cli`, `schema`, `devtools`

| Effect name | What it means in Effect | Ours | Sort | Note |
| --- | --- | --- | --- | --- |
| `HttpApiSecurity.bearer` | A bearer security scheme (`http-api/HttpApiSecurity.ts:167`) | Bearer authentication, Access token | same meaning | |
| `HttpTraceContext` | Trace headers in and out (top comment) | Trace context in the envelope | same meaning | |
| `OtlpTracer`, `OtlpExporter`, `OtlpResource` | Export spans over OTLP/HTTP (top comments) | Trace projector, telemetry sink | same meaning | Used in `libs/telemetry`. |
| `workers/Worker`, `WorkerRunner` | Worker threads and their runners (top comments) | Worker (glossary) | clash | See "Worker and runner". |
| `cli/Command` | A command-line command (top comment) | Command | clash | See "Command". Used in `tools/`. |
| `cli/Prompt` | An interactive terminal question that "renders frames" (top comment) | Prompt; Frame | clash, mild | Terminal frames are not our Frame; no move. |
| `schema/Model` | A domain model with database and JSON variants (top comment) | Read model; "model" alone | clash, mild | See "Model". |
| `DevTools` | Streams spans and metrics to a devtools process (top comment) | Nothing | no overlap | |

Read with no overlap: the rest of `http` (cookies, routers, bodies, multipart, URLs), `http-api` builders and OpenAPI, `observability` logs and metrics, `cli` flags and arguments, `schema` compilers and `VariantSchema`, `devtools` client and server.

## The words waiting for map 3, against Effect

The words in [the next-session handover](../plan/next-session.md)'s phase 2 row, with the vivief sense from the [vivief inventory](2026-10-06-vivief-inventory.md) where it matters.

| Word | Where it waits | Effect's nearest name | Note (inference) |
| --- | --- | --- | --- |
| `Contract` | [ADR-0032](../adr/0032-what-viviefs-is-about.md); vivief's "spec, test and runtime guard" | Prose only: "the procedure contract" (`rpc/Rpc.ts:6`), "the service contract" (`ai/LanguageModel.ts:7`), "the durable contract" (`eventlog/Event.ts:4`) | Effect's sense is ours: a declared shape both sides read. No exported `Contract` to clash with. |
| `effectHandler` | [D130](../plan/bootstrap/02-decision-log.md#d130), [D136](../plan/bootstrap/02-decision-log.md#d136) | A handler: of an `Rpc` (`RpcGroup`), an `Event` (`EventLog`), a `Tool` (`Toolkit`), an `Entity`, a workflow (`WorkflowEngine.register`) | In Effect a handler is the code behind a declared operation. Ours (a command) returns a changeset instead of performing it, unlike `EventLog`'s handler. "Handler" is usable in Effect's sense; "effect handler" collides with `Effect`. |
| intent | Glossary Intent; vivief's "any effect entering a handler" | None exported; `Request` is "a description of one logical piece of work" (`Request.ts`) | No word to take. Ours stays "what the user asked for, before it is checked". |
| effect | [D98](../plan/bootstrap/02-decision-log.md#d98), [I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md) | `Effect` (a description of work), `Exit` (what happened) | See "Effects, `Effect` and `Exit`". |
| `node` | [D103](../plan/bootstrap/02-decision-log.md#d103) | No exported name. Prose: runner "nodes" (`cluster/HttpRunner.ts:4`, `SingleRunner.ts:7`); `Graph` and `HashRing` nodes; an event-log replica (`EventLogRemote`) | A runner holds no data and an event-log replica is not an installation, so nothing to take. Effect's prose supports "node" for a process in a network. |
| Tool | [D102](../plan/bootstrap/02-decision-log.md#d102), [D134](../plan/bootstrap/02-decision-log.md#d134) | `ai/Tool` | See "Tool". |
| Vision, View, Effects | [D98'](../plan/bootstrap/02-decision-log.md#d98p) | None for Vision or View; `Effect`, `Exit` for Effects | Only Effects collides. |
| Frame | Glossary Frame ([D109](../plan/bootstrap/02-decision-log.md#d109)) | None exported; prose frames in `cli/Prompt` and wire framing in `RpcSerialization` | No clash in the API. |
| The lab qualifier | [D101](../plan/bootstrap/02-decision-log.md#d101) | None (`effect/testing`, `TestRunner`, `SingleRunner` are test or single-process setups) | No word to take. |
| The formula's names (`State`, `Context`, `Effect`, `Intent`, `Command`) | [I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md) | `Context` (the service map), `Effect` (the program), `cli/Command`; no `State` or `Intent` | `Context` and `Effect` are taken in a codebase written in Effect. Effect's own type already names the parts of a command: `Effect<A, E, R>`, success (the changeset), typed failure (`DomainError`), requirements. |
| Surface | [D134](../plan/bootstrap/02-decision-log.md#d134) | None exported; "API surfaces" in prose (`cluster/EntityProxy.ts:2`) | D134's list of clashes already covers it. |
| hot, frontier, warm, cold | [D132](../plan/bootstrap/02-decision-log.md#d132) | None | No word to take. |
| Kinds of intent | [D132](../plan/bootstrap/02-decision-log.md#d132) | `ai/Prompt` (prompt), `Decision.classify` (one question with labelled options) | "decision" and "prompt" each collide (above). |
| "abstraction" or "pattern" | [I33](../issues/0033-ideas-batch-abstractions-that-constrain-agents.md) | None | Effect names its abstractions (Service, Layer) and uses neither word as a name. |
| "change" | [I77](../issues/0077-change-has-two-meanings.md) | `changes`: a stream of updates (`EventJournal.ts:104`, `SubscriptionRef`) | No conflict and nothing to take for either of I77's meanings. |
| Envelope, Journal, Entity, Decision, Tool, Prompt | [D135](../plan/bootstrap/02-decision-log.md#d135) | See the sections above | |
| Foundation concept | [D160](../plan/bootstrap/02-decision-log.md#d160) against [D82](../plan/bootstrap/02-decision-log.md#d82)'s concept | None | A clash inside ours only. |
| "like X, except Y" lines | [D162](../plan/bootstrap/02-decision-log.md#d162) | - | For a newcomer from Effect, many lines can be "like Effect's X, except Y": Deferred, Journal, Envelope, Entity, Worker. |

## Questions for map 3

These are questions for the grilling, not answers.

1. Tool: does the glossary entry name D102's app, with Effect's as "a model's tool", or does D102's meaning take another word? How does [D134](../plan/bootstrap/02-decision-log.md#d134)'s "through a tool" read afterwards?
2. Effects: what is the entry for Effects in Vision - View - Effects, and how does it say it is neither the library nor Effect's `Effect` type? Can [I26](../issues/0026-glossary-links-on-words-that-are-not-our-terms.md)'s linker tell them apart?
3. The formula ([I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md)): are its names chosen to avoid `Context`, `Effect` and `Command`, and does Effect's `Effect<A, E, R>` give the names instead?
4. Journal and Envelope: does each entry gain a "not Effect's" line, and does the glossary say the log is never called a journal?
5. Decision: does the entry gain a "not Effect's `Decision`" line, and does Command's entry name its verb decide (event sourcing's, not `DecisionModel.decide`)?
6. Prompt: is "prompt" a glossary term, as a kind of intent?
7. Entity: are "entity type" and "entity id" used in Effect's sense, and what is the word for an entity type that acts?
8. Worker: does the entry become runner, Effect's word and the decisions' word, or stay as Temporal's with a note?
9. Deferred: does the entry become "Durable deferred", after `DurableDeferred`?
10. Smaller marks: `tx` (not `Effect.tx`), Command (not a CLI command), session (a chat is not one), "model" alone (an AI model), Service ("a key"), Registry, compaction, drain, scope, cause. Which get a line, and which are left to I26's linker?
11. `node`: with no Effect name to take, does D103's hint (Node.js written `node-js` where a name is needed) stand?
12. For map 6, not map 3: is each model tool call an activity or a registered command, is a tool approval a durable deferred, does a replayable run use Effect's `Persistence` or only the journal, and does an origin for a model carry `ProviderName` and `ModelName`?

## Sources

All read 2026-10-27.

- Effect 4.0.5 (`repos/effect`, subtree at the `effect@4.0.5` tag, `473d56331`), under `packages/effect/src/`: the top comment and main exports of every core module; `ai/` (`Chat.ts`, `Decision.ts`, `DecisionModel.ts`, `EmbeddingModel.ts`, `IdGenerator.ts`, `LanguageModel.ts`, `McpServer.ts`, `Model.ts`, `Prompt.ts`, `Response.ts`, `Telemetry.ts`, `Tool.ts`, `Toolkit.ts` and the rest by top comment); `cluster/` (every module by top comment; `Entity.ts`, `Envelope.ts`, `Message.ts`, `MessageStorage.ts` in detail); `eventlog/` (`Event.ts`, `EventJournal.ts`, `EventLog.ts`, `EventLogServerUnencrypted.ts` in detail); `persistence/`, `reactivity/`, `rpc/`, `sql/`, `workflow/` (every module); `http/`, `http-api/`, `observability/`, `workers/`, `cli/`, `schema/`, `devtools/` (top comments). `packages/effect/package.json` (`exports`). `repos/effect/LLMS.md` ("Writing Effect services", "Working with AI modules").
- ViViEfs: `GLOSSARY.md`; [ADR-0032](../adr/0032-what-viviefs-is-about.md); [decision log](../plan/bootstrap/02-decision-log.md) (D2, D10, D14', D24, D34', D38, D39', D44, D44', D58', D79, D82, D95-D162); [ADR-0006](../adr/0006-one-datom-log.md), [ADR-0011](../adr/0011-log-store-pattern.md), [ADR-0012](../adr/0012-datom-backed-workflow-engine.md), [ADR-0016](../adr/0016-commands-and-server-validation.md), [ADR-0017](../adr/0017-sync-outbox-and-cursor-stream.md), [ADR-0036](../adr/0036-the-journal-is-the-fence.md), [ADR-0037](../adr/0037-access.md), [ADR-0038](../adr/0038-tamper-evidence-and-proof-of-authorship.md); [the next-session handover](../plan/next-session.md), phase 2.
- Map-2 review pages: [one shape](2026-10-10-one-shape-review.html) (10a, 10b, 10d); [actors or the engine](2026-10-24-actors-or-the-engine-review.html) (2, 3, 8-11); [sync and conflict](2026-10-26-sync-and-conflict-review.html) (2); [trust, encryption and sign-in](2026-10-26-trust-encryption-and-sign-in-review.html) (2, 13).
- vivief words: [the vivief inventory](2026-10-06-vivief-inventory.md) (rows `vivief:contract`, `vivief:effect-handler`, `vivief:intent`, `vivief:surface`, `vivief:handler-levels`, `vivief:vision-view-loop`, `vivief:p2p-node-architecture`); [I26](../issues/0026-glossary-links-on-words-that-are-not-our-terms.md), [I29](../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md), [I30](../issues/0030-ideas-batch-glossary-entries-written-as-effects.md), [I33](../issues/0033-ideas-batch-abstractions-that-constrain-agents.md), [I77](../issues/0077-change-has-two-meanings.md), [I78](../issues/0078-research-effect-vocabulary-against-ours.md).
- Code: `libs/datom/src/schema.ts`, `log-store.ts`, `projector.ts`, `read-models.ts`, `migrate.ts`; `libs/workflow-engine/src/engine.ts` and `suites/`; `libs/sync/protocol/src/rpc.ts`, `libs/sync/client/src/client.ts`, `libs/sync/server/src/server.ts`; `apps/evidence-server/src/server.ts`; `apps/evidence-mobile/src/p01-effect-checks.ts`, `p02-sql-checks.ts`; `features/evidence/model/src/command.ts`, `device-resume.ts`; `features/evidence/client/src/intent-composer/query-atom.ts`; `tools/verify/src/verify.ts`, `tools/qualification/src/cli.ts`. Imports surveyed with a search of `libs/`, `apps/`, `features/` and `tools/` for `from 'effect/...'`.
