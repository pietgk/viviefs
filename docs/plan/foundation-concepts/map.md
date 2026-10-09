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
  [D94 A glossary a newcomer can read][D94]), an ADR where a decision is architectural (`Proposed, unverified`, with its
  qualifying gate), and a glossary entry for each concept adopted, its plain
  sentence first ([D94][D94]). No code and no guide edits: each consequence becomes an
  issue with a `Decide when:` or a Schedule entry. An adopted concept cites the
  gates that already show it, or names the gate to come.
- **Why "foundation concepts".** "Foundation" alone keeps its meaning here: the
  [P01 Platform on SDK 58][P01]-[P10 Trace projection][P10] gate stage, closed on 2026-09-26. A foundation concept is a concept that
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
  (section "Map 2: Foundation", and Review ([I46 Review the vivief inventory][I46]) for the clusters); the rows files
  in `docs/plan/vivief-inventory/rows/` for full citations; vivief (`~/ws/vivief`,
  HEAD `3071cb2`) on demand. Citations follow map 1's Notes: vivief's words in
  code font, `vivief ADR 0047`, never ViViEfs's ADR form.
- **One session per ticket.** Skills: `grilling` and `domain-modeling` for every
  ticket; a review page with worked examples before a structural question.

## Decisions so far

- [I47](../../issues/0047-what-viviefs-is-about.md): ViViEfs is about app creation, verified by gates for what we built and by learning for the language; tools are apps too; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] opened ([D95-D102 What ViViEfs is about][D95-D102], [D55' Consumer apps live here][D55']). Added [I56 One shape at every level?][I56], one shape at every level.
- [I48](../../issues/0048-where-the-server-independent-goal-is-recorded.md): an app is the program, a `node` an installation keeping data, authority a set of duties the server holds today; the server-independent goal recorded in 01-vision and [I60 Server-independent mode][I60]; consumer apps are `<product>-client` + `<product>-server` ([D103-D106 What an app is to a device and a node][D103-D106]).
- [I49](../../issues/0049-projection-one-concept-or-several-patterns.md): a screen asks a Presenter for a frame and keeps a frame subscription; a reference implementation and faster or enriching implementations; trust belongs to an origin; [ADR-0033 The Presenter pattern][ADR-0033] and [ADR-0034 Origin trust][ADR-0034] ([D107-D117 Presenters and origin trust][D107-D117], [D58' Envelope names the origin][D58']). Added I62-[I64 Build origin trust][I64].
- [I52](../../issues/0052-the-datom-and-its-store.md): the log store contract is what a datom needs from storage; `tx` stays an HLC worded for any `node` holding authority; id segments minted or derived; every attribute carries a value Schema; external identifiers are attributes; the final choice is the pattern ([D118-D123 The datom and its store][D118-D123]; [ADR-0007 Hybrid logical clock for tx][ADR-0007], [ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010], [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] amended). Added I66-[I68 Uniqueness as an acceptance rule][I68].
- [I50](../../issues/0050-contracts-checked-as-data-or-by-commands.md): authority accepts every change by asking may this writer do this, is it well formed, does the data stay valid; acceptance rules are code about the data alone, judged no worse; every domain writer uses a registered command that declares its writes; rules over time and re-running a command deferred; [ADR-0035](../../adr/0035-accepting-a-change.md) ([D124-D129 Accepting a change][D124-D129], [D36' Shared commands, as built][D36'], [D44' Never rename, never migrate, the RPC too][D44']). Found that the server never checked a command's rules. Added I69-[I70 Research: access from membership to enterprise][I70]; access as a pattern is a direction for [I54 Trust, encryption and who may sign in][I54].

## Not yet specified

- A prototype of what an adopted concept would look like in code, if a concept
  ticket cannot decide from prose (Projection the most likely).
- The qualifying gate for an adopted concept that no existing gate shows.
- The consequence issues the decisions raise (guides, libs, ADR amendments).

## Out of scope

- The words with two meanings (`Contract`, `effectHandler`, intent, effect): map 3.
- The rows of maps 3-6, including the six [I46 Review the vivief inventory][I46] moved to map 4 because they wait on
  a consumer app's need, not on a foundation concept.
- What counts as evidence that teaching verifies what we create: map 4, which
  owns accepting a pattern and [I21 Test the glossary with a reader outside software][I21]; [I47 What ViViEfs is about][I47] decides only whether teaching verifies.
- Code and guide changes (Notes, "Plan, don't do").
- Product-vision and DevAC-tooling rows of the inventory.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0007]: ../../adr/0007-hybrid-logical-clock.md
[ADR-0010]: ../../adr/0010-entity-ids-and-defining-attributes.md
[ADR-0011]: ../../adr/0011-log-store-pattern.md
[ADR-0032]: ../../adr/0032-what-viviefs-is-about.md
[ADR-0033]: ../../adr/0033-the-presenter-pattern.md
[ADR-0034]: ../../adr/0034-origin-trust.md
[D103-D106]: ../bootstrap/02-decision-log.md#d103-d106
[D107-D117]: ../bootstrap/02-decision-log.md#d107-d117
[D118-D123]: ../bootstrap/02-decision-log.md#d118-d123
[D124-D129]: ../bootstrap/02-decision-log.md#d124-d129
[D36']: ../bootstrap/02-decision-log.md#d36p
[D44']: ../bootstrap/02-decision-log.md#d44p
[D55']: ../bootstrap/02-decision-log.md#d55p
[D58']: ../bootstrap/02-decision-log.md#d58p
[D94]: ../bootstrap/02-decision-log.md#d94
[D95-D102]: ../bootstrap/02-decision-log.md#d95-d102
[I21]: ../../issues/0021-test-the-glossary-with-a-reader.md
[I46]: ../../issues/0046-review-the-vivief-inventory.md
[I47]: ../../issues/0047-what-viviefs-is-about.md
[I54]: ../../issues/0054-trust-encryption-and-who-may-sign-in.md
[I56]: ../../issues/0056-one-shape-at-every-level.md
[I60]: ../../issues/0060-server-independent-mode.md
[I64]: ../../issues/0064-build-origin-trust.md
[I68]: ../../issues/0068-uniqueness-as-an-acceptance-rule.md
[I70]: ../../issues/0070-research-access-from-membership-to-enterprise.md
[P01]: ../bootstrap/06-qualification-gates.md#p01
[P10]: ../bootstrap/06-qualification-gates.md#p10
