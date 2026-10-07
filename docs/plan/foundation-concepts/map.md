# Map: the foundation concepts

Wayfinder map 2 of [I34: vivief as the source of ViViEfs's concepts](../../issues/0034-vivief-as-the-source-of-viviefs-concepts.md).
Charted on 2026-10-07; the charting review is
[2026-10-07 Charting map 2: the foundation concepts](../../research/2026-10-07-foundation-concepts-charting.html).
Tickets are the issues with `Effort: docs/plan/foundation-concepts/`
([issue tracker](../../agents/issue-tracker.md), Wayfinding operations).

## Destination

What ViViEfs is about and which of vivief's concepts are its foundation, decided:
every one of the 101 map-2 rows of [the vivief inventory](../../research/2026-10-06-vivief-inventory.md)
has a disposition in a ticket's Answer, and the human has accepted one foundation
ADR that states what ViViEfs is about and its foundation concepts, linking the
decisions that chose them.

## Notes

- **Plan, don't do.** Tickets end in decisions: the decision log (numbered on from
  D94), an ADR where a decision is architectural (`Proposed, unverified`, with its
  qualifying gate), and a glossary entry for each concept adopted, its plain
  sentence first (D94). No code and no guide edits: each consequence becomes an
  issue with a `Decide when:` or a Schedule entry. An adopted concept cites the
  gates that already show it, or names the gate to come.
- **Why "foundation concepts".** "Foundation" alone keeps its meaning here: the
  P01-P10 gate stage, closed on 2026-09-26. A foundation concept is a concept that
  stage built on, which is what this map decides.
- **Dispositions.** Each Answer lists the rows it settles, one disposition each:
  _adopt_, _keep ours_, _reject_, _defer_ (with a `Decide when:`), _hand to map N_,
  or _stands_ (a row that asks nothing, untouched by its cluster's decision).
  Tickets work per cluster; a cluster decision may settle many rows at once.
- **Names.** This map writes the glossary entry for each concept it adopts, in the
  best ViViEfs word available. Where the word clashes (`Contract`, `effectHandler`,
  intent, effect), the decision records the meaning with vivief's word in code
  font and the entry waits for map 3.
- **Sources.** The inventory record and its [HTML view](../../research/2026-10-06-vivief-inventory.html)
  (section "Map 2: Foundation", and Review (I46) for the clusters); the rows files
  in `docs/plan/vivief-inventory/rows/` for full citations; vivief (`~/ws/vivief`,
  HEAD `3071cb2`) on demand. Citations follow map 1's Notes: vivief's words in
  code font, `vivief ADR 0047`, never ViViEfs's ADR form.
- **One session per ticket.** Skills: `grilling` and `domain-modeling` for every
  ticket; a review page with worked examples before a structural question.

## Decisions so far

- [I47](../../issues/0047-what-viviefs-is-about.md): ViViEfs is about app creation, verified by gates for what we built and by learning for the language; tools are apps too; ADR-0032 opened (D95-D102, D55'). Added I56, one shape at every level.

## Not yet specified

- A prototype of what an adopted concept would look like in code, if a concept
  ticket cannot decide from prose (Projection the most likely).
- The qualifying gate for an adopted concept that no existing gate shows.
- The consequence issues the decisions raise (guides, libs, ADR amendments).

## Out of scope

- The words with two meanings (`Contract`, `effectHandler`, intent, effect): map 3.
- The rows of maps 3-6, including the six I46 moved to map 4 because they wait on
  a consumer app's need, not on a foundation concept.
- What counts as evidence that teaching verifies what we create: map 4, which
  owns accepting a pattern and I21; I47 decides only whether teaching verifies.
- Code and guide changes (Notes, "Plan, don't do").
- Product-vision and DevAC-tooling rows of the inventory.
