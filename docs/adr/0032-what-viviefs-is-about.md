# ADR-0032: What ViViEfs is about and its foundation concepts

Summary: ViViEfs is about app creation: people and AI agents building apps and their proven parts in one shared language, checked by gates for what we built and by learning for the language.

Status: Proposed, unverified

Date: 2026-10-07

Qualifying gate: none (intent). Each foundation concept map 2 adopts cites the
gate that already shows it, or names the gate to come.

Related: [D95 App creation][D95], [D96 Two verifications][D96], [D97 Our languages by type][D97], [D98 Vision - View - Effects][D98], [D99 Facts kept, meaning derived][D99], [D100 Out of scope means not yet][D100], [D101 Lab and production][D101], [D102 Tools are apps][D102], [D55' Consumer apps live here][D55'], [D103 Nodes and authority][D103], [D104 The server-independent goal][D104], [D105 What must stay possible][D105],
[D106 Consumer app shape][D106], [D107-D117 Presenters and origin trust][D107-D117], [D118-D123 The datom and its store][D118-D123], [D124-D129 Accepting a change][D124-D129], [D36' Shared commands, as built][D36'], [D44' Never rename, never migrate, the RPC too][D44']. [ADR-0033 The Presenter pattern][ADR-0033] (the Presenter pattern) and [ADR-0034 Origin trust][ADR-0034] (origin trust),
from [I49 Projection: one concept or several patterns][I49]; [ADR-0035 Accepting a change][ADR-0035] (accepting a change), from [I50 Contracts checked as data or by commands][I50]. [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] (what ViViEfs builds), [ADR-0026 Verify - Qualify - Teach][ADR-0026] (Verify - Qualify - Teach), [D93 Claims in front][D93]
(claims). Opened by [I47 What ViViEfs is about][I47]; completed by I48-[I54 Trust, encryption and who may sign in][I54] and [I56 One shape at every level?][I56]; accepted in [I55 Accept the foundation concepts][I55].
[The foundation concepts map](../plan/foundation-concepts/map.md).

## Problem

[ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] and [D1 A reference stack][D1] say what ViViEfs builds: a reference stack for an app and its
server, AI-robust, proven once so later apps copy it. They do not say what
ViViEfs is about. vivief, its predecessor in spirit, answered that with
`Creation`: humans, AI and systems all create through one loop. The human's
proposal in [I34 vivief as the source of ViViEfs's concepts][I34] was narrower and different: creation and communication, with
teaching, using learning as the verification of what we create, proving that
the languages between humans and agents work. Without an answer, the foundation
concepts map 2 decides (I49-[I56 One shape at every level?][I56]) have nothing to be chosen against, and the
name Vision - View - Effects has no meaning.

## Design

**What ViViEfs is about ([D95 App creation][D95]).** App creation: people and AI agents building
apps, and the proven parts later apps are built from, in one language both read
the same way. Using a part in a real app is how it gets better, so the consumer
apps live in this repository too ([D55' Consumer apps live here][D55']). The tools apps are built with
(`verify`, `qualify`, the generators, `exercise`) are apps too, whose users are
the people and agents building apps ([D102 Tools are apps][D102]); [D52 Four project kinds][D52]'s `tools/` still says where
they live and that nothing imports them. What ViViEfs builds stays the
reference stack and its repository ([ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002]). vivief's broader `Creation` is
not adopted. The words name no device or topology; what an app is to a device
and a node is [I48 The server-independent goal, and what an app is to a device and a node][I48]'s.

**Two verifications ([D96 Two verifications][D96]).** A gate verifies a claim about what we built ([D93 Claims in front][D93]).
Learning verifies the language we wrote it in. A learner, person or agent, who
cannot build from what we wrote is a finding against the writing, recorded and
fixed like a failed gate. Learning never becomes the source of a claim. What
counts as the evidence is map 4's.

**Our languages ([D97 Our languages by type][D97]).** The languages learning verifies, by type:

| Type | ViViEfs's languages | Written by | Read by |
| --- | --- | --- | --- |
| Natural | Plain glossary sentences, lessons, concept pages | People and agents | Anyone, including readers outside software |
| Structured | Decisions, ADRs, claims, issues | The human with an agent, in a grilling or review | People and agents before they work |
| Compiled | Schema, types, code, `verify` checks, gates | Agents and people | The compiler, `verify`, `qualify`, agents |
| Presentation | The docs site, claims pages, diagrams, review pages | Generated from the other three | People |

vivief's language types are adopted; its three pipelines are not. The names
are map 3's, the views map 5's.

**Vision - View - Effects ([D98 Vision - View - Effects][D98]).** The name is a loop. `Vision` is what we
intend and decide (decisions, ADRs, claims). `Effects` is what actually happens
(the log, evidence notes, traces). `View` is what a person or agent sees and
learns from (guides, diagrams, the app's screens). One turn: intend, build,
observe what happened, show it, check it against the intent. A gate is one turn
(claim, run, evidence, claims page); a guide is another (decision, exemplar,
evidence, a lesson a learner tries). Whether one shape describes every level is
[I56 One shape at every level?][I56]'s.

**Facts kept, meaning derived ([D99 Facts kept, meaning derived][D99]).** What happened is kept; what it means is
derived and replaceable. The log holds what commands wrote; read models are
derived, disposable and rebuilt ([ADR-0006 One datom log as the substrate][ADR-0006], [D37 Log store tables][D37]), shown by [P05 Changesets and projections][P05]'s rebuild check.
A command returns a changeset instead of writing ([D36 Shared commands][D36]), and activity results
are journaled and replayed ([D2 Temporal model][D2], [P06 Workflow engine crash matrix][P06], [P09 Sync][P09]).

**Out of scope means not yet ([D100 Out of scope means not yet][D100], [D101 Lab and production][D101]).** Everything out of scope is out for
now, never ruled out. Each item says what must stay possible, and every ADR says
which out-of-scope items it makes harder ([I57 Out-of-scope items in an ADR's trade-offs][I57]). Some items can be qualified in
the lab, for learning, without being production: several servers ([I58 Several servers in the lab][I58]) and
engine scale-out ([I8 Engine scale-out and a multi-runner server][I8]). Client-server read as peer-to-peer with server-signed
nodes is the case to protect ([I48 The server-independent goal, and what an app is to a device and a node][I48]).

**Foundation concepts.** Which of vivief's concepts become ViViEfs's
foundation is decided by I48-[I54 Trust, encryption and who may sign in][I54] and [I56 One shape at every level?][I56] and recorded here; [I55 Accept the foundation concepts][I55] accepts the
whole.

**Presenters and origin trust ([D107-D117 Presenters and origin trust][D107-D117], [I49 Projection: one concept or several patterns][I49]).** A screen asks a Presenter
for data with a query written as data, gets a frame and keeps a frame
subscription to it; reads never write. The reference implementation, SQLite
read models with query atoms, is what every faster implementation is checked
against; enriching implementations (outside sources, models) write ordinary
changesets naming their origin before anything presents them. Trust belongs to
an origin, is derived when read and can be withdrawn from an origin at once.
vivief's `Projection` read side and trust are adopted in this form;
[ADR-0033](0033-the-presenter-pattern.md) and
[ADR-0034](0034-origin-trust.md) state them.

**The datom and its store ([D118-D123 The datom and its store][D118-D123], [I52 The datom and its store][I52]).** The log store contract is what
a datom needs from storage; provenance, the schema as data and a read as of a
`tx` are left out on purpose. `tx` is an HLC corrected against the `node`
holding authority, entity ids keep their path with minted or derived segments,
every attribute carries a value Schema so implementations get real column
types, and an external identifier is an ordinary attribute. A final choice is
the pattern, its contract and conformance check; implementations stay free.
[ADR-0007](0007-hybrid-logical-clock.md), [ADR-0010](0010-entity-ids-and-defining-attributes.md)
and [ADR-0011](0011-log-store-pattern.md) carry the amendments.

**Accepting a change ([D124-D129 Accepting a change][D124-D129], [I50 Contracts checked as data or by commands][I50]).** Authority accepts or rejects every
change by asking may this writer do this, is it well formed, and does the data
stay valid; each check is declared once, runs early on the device and with
authority, and has a positive control in a suite. Acceptance rules are rules
about the data alone, code beside the catalog, judged no worse so old data
stays editable; every domain writer uses a registered command that declares
what it writes. vivief's `Contract` is adopted for its placement and for being
spec, test and guard at once; contracts as datoms are not. A rule broken by
nothing happening is a workflow writing findings, deferred. Access as a pattern
that grows from membership to enterprise policies is a direction for [I54 Trust, encryption and who may sign in][I54]
([I70 Research: access from membership to enterprise][I70]). [ADR-0035](0035-accepting-a-change.md) states it; [ADR-0016 Commands, server validation and rejection][ADR-0016] and [D44 Never rename, never migrate][D44] are
amended ([D36' Shared commands, as built][D36'], [D44' Never rename, never migrate, the RPC too][D44']).

**Nodes and authority ([D103-D106 What an app is to a device and a node][D103-D106], [I48 The server-independent goal, and what an app is to a device and a node][I48]).** An app is the program; a `node` is
one installation of an app that keeps all or part of an organization's data
and writes changes to it; a device is the `node` a person uses. Authority is a
set of duties for an organization: accept or reject each change, order the
accepted ones, grant membership, fence leases. Today one `node`, the server,
holds all of them: client-server is the one authority model, read as a
peer-to-peer system in which one `node` carries the server's authority. The
server already writes into the log the way a device does; what sets it apart
is authority, not data. Tools are apps but not `node`s. [P09 Sync][P09] (sync with
server authority) and [P11 Identity][P11] (identity and organization isolation) show the one
model today; the server-independent mode ([I60 Server-independent mode][I60]) names its own gate when it is picked up: a
paired exemplar doing the same operation in both modes. Until then, [D105 What must stay possible][D105] lists
what must stay possible. A consumer app is `<product>-client` +
`<product>-server` ([D106 Consumer app shape][D106]). `node` waits for map 3 for its glossary entry,
because it clashes with Node.js.

Revisit when a learner's failure shows the languages above are not the ones
people and agents actually use, or when [I56 One shape at every level?][I56] finds one shape that describes
every level.

## Trade-offs

- **vivief's `Creation`** would cover everything humans, AI and systems make,
  including a counseling session. It brings vivief's product scope with it and
  would leave "creation" no everyday meaning. App creation is narrower and says
  what ViViEfs does.
- **A reference stack only** (no meta insight) leaves teaching as a delivery
  rule without saying what it checks, and gives the concept tickets nothing to
  choose against.
- **Learning as a verification of what we built** would let a lesson stand in
  for a gate. Gates stay the only proof of a claim ([D93 Claims in front][D93]), the same line [D68 Research records][D68]
  draws for research records.
- **Amending [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002]** instead of a new record would mix scope and the exemplar
  with eight tickets of concept decisions; [ADR-0002][ADR-0002] keeps what ViViEfs builds.

## Failure-handling

- A learner who cannot build from a guide is recorded as a finding against the
  guide or glossary, not closed as the learner's mistake ([D96 Two verifications][D96]). Map 4 decides
  how that finding is collected.
- A decision that makes an out-of-scope item harder without saying so is a
  review finding once [I57 Out-of-scope items in an ADR's trade-offs][I57] adds the Trade-offs line.
- No gate checks this record; it is intent until [I55 Accept the foundation concepts][I55].

## Outcome

### Expected

Every concept ticket of map 2 decides against this record, and [I55 Accept the foundation concepts][I55] accepts it
with the foundation concepts filled in. The glossary's ViViEfs and App creation
entries match it.

### Observed

Not yet run.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: 0002-purpose-scope-and-exemplar.md
[ADR-0006]: 0006-one-datom-log.md
[ADR-0016]: 0016-commands-and-server-validation.md
[ADR-0026]: 0026-verify-qualify-teach.md
[ADR-0033]: 0033-the-presenter-pattern.md
[ADR-0034]: 0034-origin-trust.md
[ADR-0035]: 0035-accepting-a-change.md
[D1]: ../plan/bootstrap/02-decision-log.md#d1
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D103-D106]: ../plan/bootstrap/02-decision-log.md#d103-d106
[D104]: ../plan/bootstrap/02-decision-log.md#d104
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D106]: ../plan/bootstrap/02-decision-log.md#d106
[D107-D117]: ../plan/bootstrap/02-decision-log.md#d107-d117
[D118-D123]: ../plan/bootstrap/02-decision-log.md#d118-d123
[D124-D129]: ../plan/bootstrap/02-decision-log.md#d124-d129
[D2]: ../plan/bootstrap/02-decision-log.md#d2
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[D52]: ../plan/bootstrap/02-decision-log.md#d52
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D68]: ../plan/bootstrap/02-decision-log.md#d68
[D93]: ../plan/bootstrap/02-decision-log.md#d93
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[D96]: ../plan/bootstrap/02-decision-log.md#d96
[D97]: ../plan/bootstrap/02-decision-log.md#d97
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D99]: ../plan/bootstrap/02-decision-log.md#d99
[I34]: ../issues/0034-vivief-as-the-source-of-viviefs-concepts.md
[I47]: ../issues/0047-what-viviefs-is-about.md
[I48]: ../issues/0048-where-the-server-independent-goal-is-recorded.md
[I49]: ../issues/0049-projection-one-concept-or-several-patterns.md
[I50]: ../issues/0050-contracts-checked-as-data-or-by-commands.md
[I52]: ../issues/0052-the-datom-and-its-store.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I55]: ../issues/0055-accept-the-foundation-concepts.md
[I56]: ../issues/0056-one-shape-at-every-level.md
[I57]: ../issues/0057-out-of-scope-items-in-adr-trade-offs.md
[I58]: ../issues/0058-several-servers-in-the-lab.md
[I60]: ../issues/0060-server-independent-mode.md
[I70]: ../issues/0070-research-access-from-membership-to-enterprise.md
[I8]: ../issues/0008-engine-scale-out.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
