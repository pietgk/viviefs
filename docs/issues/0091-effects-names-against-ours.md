# I91: Effect's names against ours

Status: resolved

Category: enhancement

Effort: docs/plan/vocabulary/

Type: grilling

Blocked by: [I88 Effect and the effect handler][I88], [I89 How a word is chosen and written][I89]

Found: 2026-10-27

## What

Settle each clash [I78 Research: Effect's vocabulary against ours][I78] found between Effect's names and ours: which side moves, or how the entry marks Effect's sense, by [I89 How a word is chosen and written][I89]'s rules. Charted in [the charting review](../research/2026-10-27-the-words-charting.html); the map's Notes hold the rules every ticket of map 3 applies (a single-word term only where its meaning matches our use and the libraries we use, else a compound; what a word change rewrites and keeps; where a word decision is written).

From [the record](../research/2026-10-27-effect-vocabulary-against-ours.md), questions 1 and 4-10:

- **Runner and worker**, with care: the human judged both bare words risky (2026-10-27), so each use is tied to its context (a workflow runner, an OPFS worker, a Cluster runner, a test runner, Temporal's worker). Our glossary's Worker, Effect's `workers/Worker` and `cluster/Runner`, the OPFS worker in `libs/store-sqlite-wasm`, the Coverage producer's Avoid line, [ADR-0036 The journal is the fence][ADR-0036]'s "A device cannot be a runner".
- **Tool**: [D102 Tools are apps][D102]'s app against Effect's `Tool`, and [D134 Presenting in any modality][D134]'s "an agent reads a frame through a tool".
- **Envelope**, **Journal**, **Decision**, **Prompt**: keep ours and mark Effect's, or move.
- **Entity**: the wording left after [D137 One meaning of entity][D137] (entity type, entity id, a word for an entity type that acts).
- **Deferred** (Effect's `DurableDeferred`), **`tx`** (`Effect.tx`, `TxRef`), **Command** (`effect/cli`), **session** (`Chat`), **model**, **Service** ("tag" or key), Registry, compaction, drain, scope, cause.

- **The platforms' names** ([D171 Every term passes the rule][D171], from [I89 How a word is chosen and written][I89]'s sweep): Origin (the web's origin, the browser's security boundary), Manifest (Expo's app manifest and the web app manifest), Intent (Android's `Intent`; [I92 Map 2's new words][I92] has the kinds of intent), Cursor (a database cursor, and Cursor the editor), Engine (a JavaScript engine, Hermes) and actor (the actor model, which [D136 The actor level is the durable workflow][D136] mapped to the workflow). Each is weighed by [D170 One word only where it matches][D170]: a compound, or the bare word with a `_Not_` line ([D174 Like, Not and Avoid lines][D174]).

Each retired word gets the map's three checks (Notes) in the Answer.

## Answer

Decided with the human on 2026-10-28 in two rounds, on [the review page](../research/2026-10-28-effects-names-against-ours-review.html), all as recommended. The page ran [D170 One word only where it matches][D170]'s test on each word, with its uses in the living documents counted, and drafted each entry. Decision, Command and "decide" were already settled ([D169 A command decides][D169]), and Effects ([D168 Vision - View - Effects, one entry][D168]).

**Round 1.** Engine and Worker become Workflow engine and Workflow runner, and Worker is retired ([D186 Workflow engine and workflow runner][D186]); Deferred becomes Durable deferred ([D187 Durable deferred][D187]); Journal and Envelope keep their words with their lines ([D188 Journal and Envelope keep their words][D188]); Origin, Intent and actor keep theirs, each with a `_Like_` line, since the web's origin, Android's `Intent` and an audit log's actor share their core ([D189 Origin keeps its word][D189], [D190 Intent keeps its word][D190], [D191 actor keeps its word][D191]); Manifest becomes Changeset manifest ([D192 Changeset manifest][D192]) and Cursor Sync cursor ([D193 Sync cursor][D193]); Tool is [D102 Tools are apps][D102]'s app, with Effect's written "a model's tool" ([D194 Tool is an app for those who build apps][D194]); "prompt" is not a term ([D195 Prompt is not a term][D195]); entity type and entity id are used in Effect Cluster's sense, with no word yet for an entity type that acts ([D196 Entity type and entity id][D196]); Registry becomes Evidence registry, and the small marks go in the glossary alone: Service says key, Sign-in session is not a `Chat` session, a datom's `tx` is not `Effect.tx`, Causing span is not `Cause`; model, compaction, drain and scope stay plain English ([D197 Evidence registry, and the code names follow in one issue][D197]).

**Round 2.** The code identifiers and [P17 Workflow engine leader in a browser][P17]'s name are renamed in one issue, [I99 Code names for map 3's retired words][I99], in phase 3's qualification batch; [P17][P17] becomes "Workflow engine leader in a browser" there. The titles of [I8 Workflow engine scale-out and more workflow runners on the server][I8] and [I14 Physical devices, and a notification tap that completes a durable deferred][I14] are rewritten, and [I92 Map 2's new words][I92] and [I94 Words in another project's sense][I94] get comments.

Checks before a word is retired ([D173 What a word change rewrites, and where it is written][D173]):

| Retired | 1. Persisted names and identifiers | 2. A planned concept that needs the bare word | 3. A later meaning |
| --- | --- | --- | --- |
| engine | `EngineConfig`, `EngineSweep`, [P17 Workflow engine leader in a browser][P17]'s name: [I99 Code names for map 3's retired words][I99]; `libs/workflow-engine` already says it | none; [P17 Workflow engine leader in a browser][P17] is the workflow engine; [D25 Browser engine leader][D25]'s name stays as written | Workflow engine's `_Avoid_` line |
| worker | none in our sense; every `Worker` in code is a web worker thread | none | Workflow runner's `_Avoid_` line |
| runner | never an identifier in our sense | none; the test runner and the acceptance rule runner are compounds | Workflow runner's `_Avoid_` line |
| deferred | `viviefs/deferred/exit` and the RPC `CompleteDeferred` pinned; four identifiers: [I99 Code names for map 3's retired words][I99] | none; "deferred" for a postponed item is plain English | Durable deferred's `_Avoid_` line |
| manifest | the `changesets` column and the RPC error `ManifestRejected` pinned; `CommitManifest`, `fileManifest`: [I99 Code names for map 3's retired words][I99] | the app shell's web and Expo manifests, the reason for the compound | Changeset manifest's `_Avoid_` line |
| cursor | the sync RPC's `cursor` fields and the log-store check "cursor streaming" stay; `readCursor`, `writeCursor`, `CursorRow`: [I99 Code names for map 3's retired words][I99] | none; trace cursor and acknowledged cursor are compounds | Sync cursor's `_Avoid_` line |
| registry | `RegistryEntry`, `RegistryContext`: [I99 Code names for map 3's retired words][I99] | none; registered commands never say "registry" | Evidence registry's `_Avoid_` line |

Living documents edited: `GLOSSARY.md` (Workflow engine, Workflow runner, Durable deferred, Changeset manifest, Sync cursor, Evidence registry and Tool; lines on Journal, Envelope, Origin, Intent, actor, Datom, Entity, Service, Sign-in session, Causing span; the Start here row for sync); the ADRs that used the words, with the titles of [ADR-0012 Durable execution over one datom-backed workflow engine][ADR-0012], [ADR-0015 Human steps as durable deferreds; workflows own progress][ADR-0015] and [ADR-0017 Sync: outbox and sync cursor stream over Effect RPC][ADR-0017]; the vision page, architecture, gate table, open items, repository structure and verify plan pages; the log-store guide (a how-to heading is now "Read the log from a position"); open issues, comments included; code comments and JSDoc in `libs/`, `features/`, `tools/` and `exercises/`; the docs linker's everyday terms (Deferred and Worker out, Tool in). Kept as written: the decision log, resolved issues' Answers, research records, the inventory rows and the glossary seed. A general log position in the log-store guide is a log position or an acknowledged cursor, not a sync cursor.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0012]: ../adr/0012-datom-backed-workflow-engine.md
[ADR-0015]: ../adr/0015-deferreds-vs-machines.md
[ADR-0017]: ../adr/0017-sync-outbox-and-cursor-stream.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D136]: ../plan/bootstrap/02-decision-log.md#d136
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D168]: ../plan/bootstrap/02-decision-log.md#d168
[D169]: ../plan/bootstrap/02-decision-log.md#d169
[D170]: ../plan/bootstrap/02-decision-log.md#d170
[D171]: ../plan/bootstrap/02-decision-log.md#d171
[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D174]: ../plan/bootstrap/02-decision-log.md#d174
[D186]: ../plan/bootstrap/02-decision-log.md#d186
[D187]: ../plan/bootstrap/02-decision-log.md#d187
[D188]: ../plan/bootstrap/02-decision-log.md#d188
[D189]: ../plan/bootstrap/02-decision-log.md#d189
[D190]: ../plan/bootstrap/02-decision-log.md#d190
[D191]: ../plan/bootstrap/02-decision-log.md#d191
[D192]: ../plan/bootstrap/02-decision-log.md#d192
[D193]: ../plan/bootstrap/02-decision-log.md#d193
[D194]: ../plan/bootstrap/02-decision-log.md#d194
[D195]: ../plan/bootstrap/02-decision-log.md#d195
[D196]: ../plan/bootstrap/02-decision-log.md#d196
[D197]: ../plan/bootstrap/02-decision-log.md#d197
[D25]: ../plan/bootstrap/02-decision-log.md#d25
[I14]: 0014-physical-devices-and-notification-tap.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I8]: 0008-engine-scale-out.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I92]: 0092-map-2s-new-words.md
[I94]: 0094-words-in-another-projects-sense.md
[I99]: 0099-code-names-for-map-3s-retired-words.md
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
