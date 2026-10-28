# I91: Effect's names against ours

Status: ready-for-human

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

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D136]: ../plan/bootstrap/02-decision-log.md#d136
[D137]: ../plan/bootstrap/02-decision-log.md#d137
[D170]: ../plan/bootstrap/02-decision-log.md#d170
[D171]: ../plan/bootstrap/02-decision-log.md#d171
[D174]: ../plan/bootstrap/02-decision-log.md#d174
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
[I92]: 0092-map-2s-new-words.md
