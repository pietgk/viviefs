# I41: Inventory vivief's intents

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: [I35 Index vivief's ideas from its backbone][I35], [I36 Index ViViEfs's ideas from its sources][I36]

Found: 2026-10-05

Claimed: 2026-10-06

## What

Where do vivief's open brainstorms stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `intent/` (22 files, about 7,300 lines) with `REVIEW.md`, whose round 3 sorted every intent into Promote, Design, Consolidate, Update, Park or Archive. Record each intent's bucket in its coverage line. Ideas still open in vivief keep that standing on the vivief side: say so in the row.

Write its rows file, `I41.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of [I35 Index vivief's ideas from its backbone][I35] (vivief) and [I36 Index ViViEfs's ideas from its sources][I36] (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[47 rows](../plan/vivief-inventory/rows/I41.md) and a coverage line for each of the 23 files in `intent/` and `REVIEW.md`: 3 `taken`, 19 `different`, 22 `missing`, 2 `deferred`, 1 `rejected`. 42 rows are reference stack, 3 DevAC tooling, 2 product vision. 28 ids are new; 19 refine an earlier row (8 from [I35 Index vivief's ideas from its backbone][I35], 1 from [I37 Inventory vivief's implementation path][I37], 4 from [I38 Inventory vivief's vision contracts][I38], 4 from [I39 Inventory vivief's domain contracts][I39], 2 from [I40 Inventory vivief's ADRs][I40]), which [I45 Assemble the vivief inventory][I45] merges. Each coverage line gives the intent's REVIEW bucket; every vivief cell ends with the intent's standing (an open brainstorm, or resolved only in the intent and REVIEW).

The two stacks meet on the practice of checking: a check passes or fails (`Binary eval or nothing`), text settles before it becomes a fact, non-goals are declared, and the way from issue to accepted work is guarded by status checks. They part where the intents put models inside the running system: a router model picks the handler, Code Mode runs model-written TypeScript in a sandbox, query templates and skills accumulate as data, prompts tune themselves and an ATLAS pipeline repairs. ViViEfs makes no model calls at run time, so that cluster is mostly `missing` and map 6 takes 23 of the 42 reference-stack rows. vivief keeps its own evidence as datoms, which [D48' Verify - Qualify - Teach][D48'] and [ADR-0026 Verify - Qualify - Teach][ADR-0026] rule out (`rejected`); ViViEfs's durable SQLite store on every replica makes vivief's open cold-tier question moot.

REVIEW no longer covers the folder: it triages 18 of the 23 files (the Code Mode, self-improving loop, intro deck and MCP Apps intents came after its last round, and `spike-refinement.md` has only a Round 4 status), and its Round 3 counts disagree with themselves. Several intents contradict their own resolution (query architecture still recommends Option C under a header that resolves Option A; the local LLM intent keeps `no Ollama` beside its revision allowing it), "aperture" is used in four senses, and `vivief-code-mode-tanstack.md` is a pasted TanStack blog post, not a vivief document.

Not settled, for [I45 Assemble the vivief inventory][I45]: `vivief:sandbox-promotion` is `different` here and `missing` in [I35 Index vivief's ideas from its backbone][I35] and [I38 Inventory vivief's vision contracts][I38] (the rule for unnamed practice that I37-[I39 Inventory vivief's domain contracts][I39] also ask for); `vivief:content-and-culture` gets scope reference stack for its locale part where [I35][I35] wrote `product vision?`; `vivief:room-code-discovery` is `deferred` on the communication research hypothesis, which has no `Decide when:` issue; the possible merges are in the rows file's Notes.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0026]: ../adr/0026-verify-qualify-teach.md
[D48']: ../plan/bootstrap/02-decision-log.md#d48p
[I35]: 0035-index-vivief-ideas-from-its-backbone.md
[I36]: 0036-index-viviefs-ideas-from-its-sources.md
[I37]: 0037-inventory-vivief-implementation-path.md
[I38]: 0038-inventory-vivief-vision-contracts.md
[I39]: 0039-inventory-vivief-domain-contracts.md
[I40]: 0040-inventory-vivief-adrs.md
[I45]: 0045-assemble-the-vivief-inventory.md
