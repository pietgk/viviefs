# I38: Inventory vivief's vision contracts

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: [I35 Index vivief's ideas from its backbone][I35], [I36 Index ViViEfs's ideas from its sources][I36]

Found: 2026-10-05

Claimed: 2026-10-05

## What

Where do vivief's eleven vision contracts stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `contract/vision/`: `actors.md`, `bridging.md`, `creation-loop-extensions.md`, `docs-as-creation-artifacts.md`, `effecthandler-roles.md`, `fractal-software-factory.md`, `knowledge-acquisition.md`, `proactive-improvement.md`, `security-architecture.md`, `ui-effects.md` and `validation.md` (about 1,500 lines; the two foundation files are [I37 Inventory vivief's implementation path][I37]'s).

Write its rows file, `I38.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of [I35 Index vivief's ideas from its backbone][I35] (vivief) and [I36 Index ViViEfs's ideas from its sources][I36] (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[45 rows](../plan/vivief-inventory/rows/I38.md) and a coverage line for each of the eleven vision contracts: 1 `taken`, 25 `different`, 17 `missing`, 1 `deferred`, 1 `rejected`. 42 rows are reference stack and 3 are DevAC tooling. 31 ids are new; 14 refine an earlier row (11 from [I35 Index vivief's ideas from its backbone][I35], 3 from [I40 Inventory vivief's ADRs][I40]), which [I45 Assemble the vivief inventory][I45] merges. Map 6 picks up 24 of the reference-stack rows, map 5 picks up 8, map 2 picks up 6, map 4 picks up 3 and map 3 picks up 1.

ViViEfs already follows much of these contracts' practice without vivief's words. Content shows its summary first: [D88 Names and summaries][D88] summaries, [D90 Hover previews][D90] previews, [D94 A glossary a newcomer can read][D94] plain first sentences. This is the one `taken` row. Other shared practice: every claim cites its source, a person decides every convention change ([D63 Acceptance on the guide][D63]), guide samples are embedded from the exemplar ([D60 Samples from the exemplar][D60]), and a probe's state diagram is derived from its spans and fails on drift.

The two part in three places, all of them for map 6:
- **Dispatch.** vivief routes an intent to whichever handler fits by role, trust or confidence. ViViEfs binds each intent to one named command.
- **Trust.** vivief scores trust and propagates it through `min()`, with sandbox levels, injection Guards and a threat model. ViViEfs has server authority and Schema at every boundary, and nothing for outside content or agents.
- **Improvement.** vivief triggers its own reviews (aggregation thresholds, a Researcher and an Improver). ViViEfs improves when a person runs `retro`.

Map 5 gets the UI and docs rows: state machines and stories as documentation, coverage counted in states, static accessibility queries, a queryable docs graph, docs freshness. Map 2 gets bridge, intake, cross-domain ids and the fractal factory.

The contracts drift from vivief's own backbone. Bridge is called "the 7th" pattern and intake "the seventh", though v6 counts bridge among six. The Aggregation Contract changes meaning. Guards turn advisory. Trust sits on the datom rather than the transaction. "Actor" has three meanings. fractal-software-factory's cold, warm and hot are loop timescales, not storage tiers. `actors.md`, `ui-effects.md` and `validation.md` are pre-v6, and their links point at moved files. The rows file's Notes list the rest.

Not settled, for [I45 Assemble the vivief inventory][I45]:
- **`vivief:self-describing-datoms` is `rejected` on [D48' Verify - Qualify - Teach][D48'].** [D48'][D48'] rules out only the ledger as datoms, while decisions and issues are Markdown files by [D88 Names and summaries][D88] and [D92 Issues as records][D92], so the row may be `different`.
- **Status disagreements with [I35 Index vivief's ideas from its backbone][I35].** `vivief:effect-telemetry` and the practices ViViEfs runs unnamed are `different` here but `missing` in [I35][I35], the same split [I37 Inventory vivief's implementation path][I37] found. `vivief:skill` is `implemented` here but `accepted` in [I35][I35]. `vivief:domain` is `deferred` here as in [I37][I37].
- **Candidate merges with [I37 Inventory vivief's implementation path][I37] and [I40 Inventory vivief's ADRs][I40] rows.** The proactive-review trigger with [I37][I37]'s rule proposals, and intent routing with handler roles; the rows file lists all of them.
- **"Role".** [I16 Roles in use, invitations and self-service membership][I16] means what someone may access, vivief means what someone is good at. That is a vocabulary question for map 3.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D48']: ../plan/bootstrap/02-decision-log.md#d48p
[D60]: ../plan/bootstrap/02-decision-log.md#d60
[D63]: ../plan/bootstrap/02-decision-log.md#d63
[D88]: ../plan/bootstrap/02-decision-log.md#d88
[D90]: ../plan/bootstrap/02-decision-log.md#d90
[D92]: ../plan/bootstrap/02-decision-log.md#d92
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I16]: 0016-roles-and-self-service-membership.md
[I35]: 0035-index-vivief-ideas-from-its-backbone.md
[I36]: 0036-index-viviefs-ideas-from-its-sources.md
[I37]: 0037-inventory-vivief-implementation-path.md
[I40]: 0040-inventory-vivief-adrs.md
[I45]: 0045-assemble-the-vivief-inventory.md
