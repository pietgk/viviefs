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

**Reached on 2026-10-27** ([I55 Accept the foundation concepts][I55]): every row has a disposition, and the human
accepted [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032].

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
  font and the entry waits for map 3. Before a word is adopted, it is checked
  against Effect's modules: a concept Effect already names takes Effect's name
  and meaning ([D135 Effect's names first][D135]).
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
- [I70](../../issues/0070-research-access-from-membership-to-enterprise.md): research for [I54 Trust, encryption and who may sign in][I54]: access fits one AuthZEN-shaped contract, with a changeset as a batch of evaluations, a decision naming the position it read, and errors that deny; Cedar on Hermes unverified ([the record](../../research/2026-10-09-access-from-membership-to-enterprise.md)). Found [I71 An append can land after a revocation][I71].
- [I56](../../issues/0056-one-shape-at-every-level.md): the shape is a foundation concept at the data level (a command decides, authority accepts, the projector evolves; a workflow over its journal) and a lens above it, four states at every level, with kinds of intent from a WayFinder map to a button press; the changeset is the step and the log after accept is `State'`; a verified commit is a commit on which verify is green; a frame reaches a person through a surface of any modality; Effect's names first ([D130-D135 One shape at every level][D130-D135], [D98' Vision - View - Effects, at every level][D98']). Added I76-[I78 Research: Effect's vocabulary against ours][I78].
- [I51](../../issues/0051-actors-or-the-engine.md): the actor level is the durable workflow, one execution per actor; no actor runtime, supervision tree or event bus (a workflow, or a cursor); commands and the engine are the handler runtime; one meaning of entity, some entity types act; the actor is the accountable identity; a run's journal is its own fence, so one engine, one journal and one fence, and Cluster is not needed ([D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39']; [ADR-0036 The journal is the fence][ADR-0036]). Added [I80 Build the journal fence][I80].
- [I53](../../issues/0053-sync-and-conflict.md): sync is in the foundation on purpose; vivief's Sync Contract is three parts we have; authority decides a human conflict at accept against the writer's cursor and writes it as a fact a command resolves; a set is entities, with no cardinality; no text CRDT until live co-editing; one checkpoint enforces trust; user content never lives only in a journal, and quarantine keeps a rejected change's user content on the device ([D142-D148 Sync and conflict][D142-D148], [D34' Per-attribute conflict policies, decided at accept][D34']). Added I81-[I83 Live co-editing of text][I83].
- [I54](../../issues/0054-trust-encryption-and-who-may-sign-in.md): access is decided at accept and at sync's filter, never in a read, as a pattern with an AuthZEN-shaped contract and today's membership code as its reference implementation; encryption narrows and never grants, at a level each attribute chooses, the per-subject key the reference; an identity is who a request or a change is accountable to, Effect's `EventLog.Identity` a self-certifying one; agent accounts deferred; whoever grants is the actor; a hash chain per organization built now; proof of authorship at a level an app chooses, signing deferred ([D149-D157 Trust, encryption and who may sign in][D149-D157]; [ADR-0037 Access][ADR-0037], [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]). Added I84-[I87 Group and role encryption levels][I87].
- [I59](../../issues/0059-bring-adr-0002-and-the-vision-in-line-with-i47.md): [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] and the vision page in line with [I47 What ViViEfs is about][I47]: the out-of-scope list is the vision page's alone, six items each saying what must stay possible and lab or not yet (guaranteed work while closed and two writers on one run not yet at all; hosting, several servers, engine scale-out and the server-independent mode learnable in the lab); a consumer app's product choices are an In scope rule, not an item ([D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159]; [ADR-0002][ADR-0002] amended).
- [I55](../../issues/0055-accept-the-foundation-concepts.md): all five of vivief's `concepts` adopted in the forms they landed and the set left open; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] lists twelve foundation concepts in one table read as one turn, each with its owning pattern and the gate that shows it; libs stay one per pattern core and implementation; portability's lock-in half is ours, its newcomer half ("like X, except Y") map 3's; an intent record is accepted directly; the 101 rows checked; [ADR-0032][ADR-0032] and [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] accepted ([D160 The foundation concepts][D160]-[D162 Portability, two halves][D162], [D65' Intent records accepted directly][D65']).

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

[ADR-0002]: ../../adr/0002-purpose-scope-and-exemplar.md
[ADR-0007]: ../../adr/0007-hybrid-logical-clock.md
[ADR-0010]: ../../adr/0010-entity-ids-and-defining-attributes.md
[ADR-0011]: ../../adr/0011-log-store-pattern.md
[ADR-0032]: ../../adr/0032-what-viviefs-is-about.md
[ADR-0033]: ../../adr/0033-the-presenter-pattern.md
[ADR-0034]: ../../adr/0034-origin-trust.md
[ADR-0036]: ../../adr/0036-the-journal-is-the-fence.md
[ADR-0037]: ../../adr/0037-access.md
[ADR-0038]: ../../adr/0038-tamper-evidence-and-proof-of-authorship.md
[D103-D106]: ../bootstrap/02-decision-log.md#d103-d106
[D107-D117]: ../bootstrap/02-decision-log.md#d107-d117
[D118-D123]: ../bootstrap/02-decision-log.md#d118-d123
[D124-D129]: ../bootstrap/02-decision-log.md#d124-d129
[D130-D135]: ../bootstrap/02-decision-log.md#d130-d135
[D135]: ../bootstrap/02-decision-log.md#d135
[D136-D141]: ../bootstrap/02-decision-log.md#d136-d141
[D14']: ../bootstrap/02-decision-log.md#d14p
[D142-D148]: ../bootstrap/02-decision-log.md#d142-d148
[D149-D157]: ../bootstrap/02-decision-log.md#d149-d157
[D158]: ../bootstrap/02-decision-log.md#d158
[D159]: ../bootstrap/02-decision-log.md#d159
[D160]: ../bootstrap/02-decision-log.md#d160
[D162]: ../bootstrap/02-decision-log.md#d162
[D34']: ../bootstrap/02-decision-log.md#d34p
[D36']: ../bootstrap/02-decision-log.md#d36p
[D39']: ../bootstrap/02-decision-log.md#d39p
[D44']: ../bootstrap/02-decision-log.md#d44p
[D55']: ../bootstrap/02-decision-log.md#d55p
[D58']: ../bootstrap/02-decision-log.md#d58p
[D65']: ../bootstrap/02-decision-log.md#d65p
[D94]: ../bootstrap/02-decision-log.md#d94
[D95-D102]: ../bootstrap/02-decision-log.md#d95-d102
[D98']: ../bootstrap/02-decision-log.md#d98p
[I21]: ../../issues/0021-test-the-glossary-with-a-reader.md
[I46]: ../../issues/0046-review-the-vivief-inventory.md
[I47]: ../../issues/0047-what-viviefs-is-about.md
[I54]: ../../issues/0054-trust-encryption-and-who-may-sign-in.md
[I55]: ../../issues/0055-accept-the-foundation-concepts.md
[I56]: ../../issues/0056-one-shape-at-every-level.md
[I60]: ../../issues/0060-server-independent-mode.md
[I64]: ../../issues/0064-build-origin-trust.md
[I68]: ../../issues/0068-uniqueness-as-an-acceptance-rule.md
[I70]: ../../issues/0070-research-access-from-membership-to-enterprise.md
[I71]: ../../issues/0071-an-append-can-land-after-a-revocation.md
[I78]: ../../issues/0078-research-effect-vocabulary-against-ours.md
[I80]: ../../issues/0080-build-the-journal-fence.md
[I83]: ../../issues/0083-live-co-editing-of-text.md
[I87]: ../../issues/0087-group-and-role-encryption-levels.md
[P01]: ../bootstrap/06-qualification-gates.md#p01
[P10]: ../bootstrap/06-qualification-gates.md#p10
