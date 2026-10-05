# Map: the vivief inventory

Wayfinder map 1 of [I34: vivief as the source of ViViEfs's concepts](../../issues/0034-vivief-as-the-source-of-viviefs-concepts.md).
Charted on 2026-10-05; the charting review is
[2026-10-05 Charting map 1: the vivief inventory](../../research/2026-10-05-vivief-inventory-charting.html).
Tickets are the issues with `Effort: docs/plan/vivief-inventory/`
([issue tracker](../../agents/issue-tracker.md), Wayfinding operations).

## Destination

One research record, `docs/research/<date>-vivief-inventory.md` with an HTML
view of it, that says for every idea in vivief and in ViViEfs where it stands in
the other, accepted by the human in a review. Maps 2-6 of I34 start from it.

## Notes

- **This map does the work.** Wayfinder plans by default; here the record is the
  deliverable and the decisions belong to maps 2-6. Research tickets read their
  slice and write rows; they do not decide what ViViEfs adopts.
- **Sources.** vivief (`~/ws/vivief`, HEAD `3071cb2`): `docs/` outside
  `docs/archive/`, read in full; `docs/REVIEW.md` (round 3 intent triage) and
  `docs/contract/adr/RELEVANCE.md` as the index of what vivief itself still
  holds; `plugins/devac/`. ViViEfs: `GLOSSARY.md`, the decision log D1-D94,
  ADR-0001 to ADR-0031, the gates P01-P17, the log-store guide. The ideas
  batches I24-I33 are cross-linked, not covered.
- **One table, two sides.** A row is one idea (a concept, term, principle,
  decision or mechanism), not a file. It has a vivief side and a ViViEfs side;
  either may be empty.
- **Where an idea stands**, three columns:
  - Status: `taken` (same idea), `different` (same word or area, another
    meaning or design), `deferred` (a slot, hypothesis or `Decide when:`
    exists), `missing` (nothing in ViViEfs), `rejected` (a decision rules it
    out), `ViViEfs only` (with the nearest vivief idea). `deferred` and
    `rejected` need a ViViEfs citation; without one the idea is `missing`.
  - Level, for `taken`, `different` and `ViViEfs only`: `accepted` (a decision
    or glossary term), `proposed` (an ADR, unverified), `implemented`,
    `verified` (name the gate; it stands only if `gate-ledger.json` records a
    pass).
  - Scope: `reference stack`, `product vision` (counseling, procurement, a
    product's peer-to-peer) or `DevAC tooling`. Only reference-stack rows get a
    map (2-6) and a question.
- **Rows record and ask; they never decide.** Where a decision is due, the row
  asks it as a question for the map that owns it.
- **Citations.** Every row cites file and section heading on both sides.
  ViViEfs names follow `GLOSSARY.md`; vivief's own words are written in code
  font, so a reader always knows whose word it is. vivief's ADR numbers
  collide with ViViEfs's: write `vivief ADR 0047`, never `ADR-0047`, which the
  docs site links to ViViEfs's own ADR.
- **Ids.** Ideas have readable ids: `vivief:<kebab-slug>` from I35,
  `viviefs:<kebab-slug>` from I36. A slice reuses an index id when the idea is
  already indexed and adds a new id otherwise.
- **Where tickets write.** Each research ticket writes
  `docs/plan/vivief-inventory/rows/I<n>.md`: a rows table
  (`Id | Idea | vivief | ViViEfs | Status | Level | Scope | Map | Issues | Question`)
  and a coverage table (`Source | Rows | Note`, one line per source in its
  slice, saying which rows it fed or that it was skipped and why). Its Answer
  links that file. I45 assembles the record from the rows files, which stay as
  the trail.
- **One session per ticket** (the human's token budget). I35 and I36 ran as
  background research subagents from the charting session; the slices run one
  session each, and a later slice may read the rows already written.
- Skills: `research` for research tickets; `grilling` and `domain-modeling`
  for I46.

## Decisions so far

- [I35: Index vivief's ideas from its backbone](../../issues/0035-index-vivief-ideas-from-its-backbone.md):
  103 `vivief:` ideas from concepts v6, the quick reference and the foundation
  ([rows](rows/I35.md)); 7 taken, 46 different, 50 missing; the largest gaps are
  the trust model, `Surface`, the creation loop and effects as data.

- [I36: Index ViViEfs's ideas from its sources](../../issues/0036-index-viviefs-ideas-from-its-sources.md):
  77 `viviefs:` ideas covering every glossary term, D1-D94, the 31 ADRs, P01-P17
  and the log-store guide ([rows](rows/I36.md)); 35 verified, 23 implemented,
  8 proposed, 11 accepted.

## Not yet specified

- How the HTML view is laid out: grouped by concept, by the map that picks a
  row up, or by status. Decided in I45 once the rows exist.

## Out of scope

- Deciding what ViViEfs adopts, renames or rejects: maps 2-6 of I34.
- vivief's `docs/archive/` (also on demand) and its code (`packages/`,
  `examples/`): the `fact/` docs stand in for the code, `story/` for why vivief
  changed its mind.
- vivief's GitHub issues and pull requests.
