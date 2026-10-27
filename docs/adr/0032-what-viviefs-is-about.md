# ADR-0032: What ViViEfs is about and its foundation concepts

Summary: ViViEfs is about app creation: people and AI agents building apps and their proven parts in one shared language, checked by gates for what we built and by learning for the language. Its foundation is twelve concepts read as one turn, from a command deciding a changeset to a Presenter answering a surface, each a pattern that can be done another way under the same suite.

Status: Accepted (2026-10-27, directly, [D65' Intent records accepted directly][D65'])

Date: 2026-10-07

Qualifying gate: none (intent). Each foundation concept names the gate that
shows it, or the issue that will, in the table under Foundation concepts.

Related: [D95 App creation][D95], [D96 Two verifications][D96], [D97 Our languages by type][D97], [D98 Vision - View - Effects][D98], [D99 Facts kept, meaning derived][D99], [D100 Out of scope means not yet][D100], [D101 Lab and production][D101], [D102 Tools are apps][D102], [D55' Consumer apps live here][D55'], [D103 Nodes and authority][D103], [D104 The server-independent goal][D104], [D105 What must stay possible][D105],
[D106 Consumer app shape][D106], [D107-D117 Presenters and origin trust][D107-D117], [D118-D123 The datom and its store][D118-D123], [D124-D129 Accepting a change][D124-D129], [D36' Shared commands, as built][D36'], [D44' Never rename, never migrate, the RPC too][D44'], [D130-D135 One shape at every level][D130-D135], [D98' Vision - View - Effects, at every level][D98'], [D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39'], [D142-D148 Sync and conflict][D142-D148], [D34' Per-attribute conflict policies, decided at accept][D34'], [D149-D157 Trust, encryption and who may sign in][D149-D157], [D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159], [D160 The foundation concepts][D160], [D161 Libs stay one per pattern and implementation][D161], [D162 Portability, two halves][D162], [D65' Intent records accepted directly][D65']. [ADR-0033 The Presenter pattern][ADR-0033] (the Presenter pattern) and [ADR-0034 Origin trust][ADR-0034] (origin trust),
from [I49 Projection: one concept or several patterns][I49]; [ADR-0035 Accepting a change][ADR-0035] (accepting a change), from [I50 Contracts checked as data or by commands][I50]; [ADR-0036 The journal is the fence][ADR-0036] (the journal is the fence), from [I51 Actors or the engine][I51]; [ADR-0037 Access][ADR-0037] (access) and [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038] (tamper-evidence and proof of authorship), from [I54 Trust, encryption and who may sign in][I54]. [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] (what ViViEfs builds), [ADR-0026 Verify - Qualify - Teach][ADR-0026] (Verify - Qualify - Teach), [D93 Claims in front][D93]
(claims). Opened by [I47 What ViViEfs is about][I47]; completed by I48-[I54][I54] and [I56 One shape at every level?][I56]; accepted in [I55 Accept the foundation concepts][I55].
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
evidence, a lesson a learner tries). One shape at every level, below, answers
how far the loop is one shape ([D98' Vision - View - Effects, at every level][D98']).

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
nodes is the case to protect ([I48 The server-independent goal, and what an app is to a device and a node][I48]). The list itself is 01-vision's, six items each
saying what must stay possible and lab or not yet ([D158 The out-of-scope list, item by item][D158]); a consumer app's
product choices are not on it, because they stay with that app for good ([D159 Product choices stay with the consumer app][D159], [I59 Bring ADR-0002 and the vision page in line with I47][I59]).

**Foundation concepts ([D160 The foundation concepts][D160]).** A foundation concept is an idea the
[P01 Platform on SDK 58][P01]-[P10 Trace projection][P10] stage built on. There are twelve, read top to bottom as one turn: a
command decides a changeset of datoms naming its origin, authority accepts it
having asked access and chains it, sync carries it, the projector builds read
models, and a Presenter answers a surface with a frame; long work runs as a
workflow whose journal is in the same log; each is a pattern, so each can be
done another way that passes the same suite. All five of vivief's `concepts`
are adopted, each in the form below; the set is not closed, because patterns
build on each other and new ones join ([D82 Patterns build on each other][D82], as [D125 Acceptance rules][D125] did for the six contract
sub-types). The paragraphs after the table are the detail.

| # | Foundation concept | In one plain sentence | From vivief | Decisions | Owning pattern | Shown by |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Pattern | A part built once with one promise, several ways to keep it, and a check every way must pass. | Portability, its lock-in half | [D82 Patterns build on each other][D82], [D110 The reference implementation][D110], [D123 The final choice is the pattern][D123] | every pattern | [P04 Log store conformance][P04] |
| 2 | Datom and the one log | Every fact is one small record, kept forever in one log per organization. | `Datom`, stands | [ADR-0006 One datom log as the substrate][ADR-0006], [D118-D123 The datom and its store][D118-D123] | log store | [P04 Log store conformance][P04] |
| 3 | Command and changeset | A command decides what should change and returns it as one batch, without writing it. | `effectHandler`, the function | [D36' Shared commands, as built][D36'], [D130 One shape at the data level][D130], [D131 The changeset is the step][D131] | changesets | [P05 Changesets and projections][P05] |
| 4 | Authority and accepting a change | One place decides whether a batch counts: may this writer do it, is it well formed, does the data stay valid. | `Contract`, its placement | [D103 Nodes and authority][D103], [D124-D129 Accepting a change][D124-D129], [ADR-0035 Accepting a change][ADR-0035] | changesets (acceptance rules) | [P09 Sync][P09]; every rule: [P09][P09] extended ([I69 Accept checks every change][I69]) |
| 5 | Read model and projector | What the facts mean is worked out from the log and can be thrown away and rebuilt. | - | [D37 Log store tables][D37], [D99 Facts kept, meaning derived][D99] | changesets | [P05 Changesets and projections][P05] |
| 6 | Presenter, frame and surface | A screen, or a speaker, asks for data and keeps receiving the latest answer. | `Projection`, its read side; `Surface` | [D107 The Presenter pattern][D107]-[D114 Partial sync on demand][D114], [D134 Presenting in any modality][D134], [ADR-0033 The Presenter pattern][ADR-0033] | Presenter | [P05 Changesets and projections][P05], [P08 UI three-way prototype][P08] in part; the Presenter gate ([I62 The Presenter conformance gate][I62]) |
| 7 | Origin and origin trust | Every batch says where it came from, and how far we trust that source can change at once. | `Projection`, its trust scope | [D58' Envelope names the origin][D58'], [D115 Origin trust][D115]-[D117 Trust strategies as commit paths][D117], [ADR-0034 Origin trust][ADR-0034] | origin trust | named when built ([I64 Build origin trust][I64]) |
| 8 | Durable workflow and its journal | Work that must not lose progress writes down each step, so it resumes where it stopped. | `effectHandler`, the actor | [ADR-0012 Durable execution over one datom-backed engine][ADR-0012], [D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'], [ADR-0036 The journal is the fence][ADR-0036] | durable workflow | [P06 Workflow engine crash matrix][P06], [P07 Device resume E2E][P07]; the fence: [P06][P06], [P09 Sync][P09] again ([I80 Build the journal fence][I80]) |
| 9 | Sync | Each device sends what it wrote and reads what it missed, and a clash between people is decided once, at accept. | Sync Contract | [ADR-0017 Sync: outbox and cursor stream over Effect RPC][ADR-0017], [D142-D148 Sync and conflict][D142-D148], [D34' Per-attribute conflict policies, decided at accept][D34'] | sync | [P09 Sync][P09]; conflicts: [P05 Changesets and projections][P05], [P09][P09] again ([I81 Build conflicts decided at accept][I81]) |
| 10 | Identity and access | Every change is accountable to someone, and one decision says what they may write and receive. | `Projection`, its access scope | [ADR-0022 Identity and organization isolation][ADR-0022], [D150 Access around sync and commands][D150]-[D154 Whoever grants is the actor][D154], [ADR-0037 Access][ADR-0037] | identity, access | [P11 Identity][P11]; the contract: [P11][P11] again ([I84 Build the access pattern][I84]) |
| 11 | Encryption that narrows | Locking a value limits who can open it, and never gives anyone access. | `Projection`, its encryption scope | [ADR-0023 Data at rest and crypto-shredding][ADR-0023], [D149 Encryption levels][D149] | encrypted store | [P15 Encrypted store][P15], [P16 Crypto-shredding][P16] |
| 12 | Tamper-evident history | Each organization's history is a chain in which any change to the past shows. | Verified segments | [D155 A hash chain per organization][D155], [D156 Levels of proof of authorship][D156], [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038] | log store | [P09 Sync][P09] again ([I85 Build the hash chain][I85]) |

The shape above the code and its four states ([D132 Four states at every level][D132]) are a lens, not a
concept, and Vision - View - Effects names the loop the table reads as; both
stay paragraphs. Code maps to the concepts through the owning pattern: a lib
is one pattern's core or one of its implementations, and names its pattern in
`metadata.guides` once the guide exists ([D161 Libs stay one per pattern and implementation][D161], [D84 Exemplar of several guides][D84]). The newcomer's question,
"what is this like where I come from", is answered in the glossary, not here
([D162 Portability, two halves][D162]). The words `Contract`, `effectHandler`, surface, `node` and foundation
concept itself wait for map 3.

**Nodes and authority ([D103-D106 What an app is to a device and a node][D103-D106], [I48 The server-independent goal, and what an app is to a device and a node][I48]).** An app is the program; a `node` is
one installation of an app that keeps all or part of an organization's data
and writes changes to it; a device is the `node` a person uses. Authority is a
set of duties for an organization: accept or reject each change, order the
accepted ones, grant membership, fence each run's journal ([D14' The journal is the fence][D14']). Today one `node`, the server,
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

**One shape at every level ([D130-D135 One shape at every level][D130-D135], [D98' Vision - View - Effects, at every level][D98'], [I56 One shape at every level?][I56]).** At the data level, every
change to kept state goes from a state and an input, through a step, to the
next state: a command decides (a changeset or a typed error, pure, its ids
passed in), authority accepts the step into the log, and the projector evolves
the read models from it. A workflow runs the same way over its journal, and an
activity is the only place the world comes in, its result kept. Failure is
data. The changeset is the step; the log after accept is the new state, and
read models are its views. Reads and pure helpers make no new state, so they
are outside the shape. Shown by [P05 Changesets and projections][P05], [P06 Workflow engine crash matrix][P06] and [P09 Sync][P09]. vivief's `effectHandler` is
adopted in this form; its name is map 3's. Above the code the shape is a lens,
not a concept: people and agents compose intent, and apps and tools,
themselves built from intent, carry it out to reach a goal. At every level
(data, decisions, code, claims, patterns) a thing is hot while it is open,
crosses a frontier where a checkpoint decides, is kept warm with its history,
and turns cold as net truth others build on. Something cold that someone reads
becomes a hot intent at another level. Intent comes in kinds from a WayFinder
map down to a button press, and the more abstract the intent, the longer its
turn. A verified commit, a commit on which `pnpm verify` is green, is the code
level's crossing. A frame reaches a person through a surface of any modality,
a screen being one. vivief's fractal factory is adopted as this lens; datoms
for development artifacts and "velocity compounds" are not. Where Effect
already names a concept, ViViEfs uses Effect's name and meaning.

**Actors or the engine ([D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39'], [I51 Actors or the engine][I51]).** vivief's actor level is
the durable workflow: each execution is one actor, its state the journal, its
mailbox the outside inputs, one writer at a time, restarted by resuming from
its journal. There is no actor runtime and no supervision tree: work that must
not lose progress is a workflow, anything else rebuilds from its cursor. There
is no event bus: Reactivity in process, the cursor stream between `node`s,
push only a hint. Commands and the engine are the handler runtime; a model
call is an activity. An entity is a thing with an identity that facts are
about, and some entity types act; the execution is one. The envelope's actor
is the identity authority checked; the model is an origin. A run's journal is
its own fence ([ADR-0036 The journal is the fence][ADR-0036]), so one engine, one journal and one fence serve
device and server, and Effect Cluster is not needed. Shown by [P06 Workflow engine crash matrix][P06], [P07 Device resume E2E][P07] and
[P09 Sync][P09]; the fence is to be shown by [P06][P06] and [P09][P09] again.

**Sync and conflict ([D142-D148 Sync and conflict][D142-D148], [D34' Per-attribute conflict policies, decided at accept][D34'], [I53 Sync and conflict][I53]).** Sync is in the foundation on
purpose: the first app is phones offline for days with a server and people who
switch devices, and the engine, domain data and sync share one log; vivief made
sync possible from its first phase too and deferred only the build. vivief's
Sync Contract is three parts ViViEfs has: the conflict policy, the organization
as scope with partial sync on demand later, and the journal fence as the claim.
The `node` holding authority decides a human conflict when it accepts a change,
against the cursor its writer had pulled, and writes the conflict as a fact a
command resolves. An attribute holds one value; a set is entities, one per
member. Text has no CRDT until two people type in one text at once. One
checkpoint is the one place trust is enforced. User content never lives only in
a journal, and quarantine keeps the user content of a rejected change on the
device until a person resolves it. Sync is shown by [P09 Sync][P09]; conflicts decided at
accept are to be shown by [P05 Changesets and projections][P05] and [P09][P09] again ([I81 Build conflicts decided at accept][I81]), quarantine by [P14 Quarantine after a lost lease][P14].

**Trust, encryption and who may sign in ([D149-D157 Trust, encryption and who may sign in][D149-D157], [I54 Trust, encryption and who may sign in][I54]).**
Access is one decision made on authority where every change and every replica
passes: at accept, for what may be written, and at sync's filter, for what a
replica receives; a read carries no access rule. Access is a pattern whose
reference implementation is today's membership, server-only attributes and
declared writes, behind one request of subject, action, resource and context,
with roles, relations and policies as later implementations ([ADR-0037 Access][ADR-0037]).
Encryption narrows who can open a value and never grants it: it serves erasure
and data at rest, at a level each attribute chooses, the per-subject key of
crypto-shredding the reference. An identity is who a request or a change is
accountable to, a person, the server or an agent account, proved by a
credential; whoever grants is the actor. Each organization's accepted history
is a hash chain every device recomputes, and who wrote a changeset is shown at
a level an app chooses ([ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]). Identity and membership are shown by
[P11 Identity][P11]; the access contract is to be shown by [P11][P11] again ([I84 Build the access pattern][I84]), the chain by
[P09 Sync][P09] again ([I85 Build the hash chain][I85]), erasure by [P16 Crypto-shredding][P16].

Revisit when a learner's failure shows the languages above are not the ones
people and agents actually use, or when a gate shows the shape at a level above
the code, where [D132 Four states at every level][D132] keeps it a lens.

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
- **vivief's five as a closed set**, everything else a pattern composing them,
  is one short list a newcomer can hold. It would make every new pattern
  (access and the Presenter, both added by map 2) a breach of the model
  rather than the way the stack grows. The table keeps the short list without
  closing it ([D160 The foundation concepts][D160]).
- **Libs grouped by concept**, as vivief's packages are, would put the log
  store on op-sqlite and on Postgres in one package, against the boundary
  lint that keeps a platform's code apart ([D52 Four project kinds][D52], [D161 Libs stay one per pattern and implementation][D161]).
- **Out-of-scope items**: none made harder. This record states the rule ([D100 Out of scope means not yet][D100])
  and the list's home ([D158 The out-of-scope list, item by item][D158]); each decision it links names what it makes
  harder in its own ADR.

## Failure-handling

- A learner who cannot build from a guide is recorded as a finding against the
  guide or glossary, not closed as the learner's mistake ([D96 Two verifications][D96]). Map 4 decides
  how that finding is collected.
- A decision that makes an out-of-scope item harder without saying so is a
  review finding.
- No gate checks this record; the human accepted it directly in [I55 Accept the foundation concepts][I55] ([D65' Intent records accepted directly][D65']).

## Outcome

### Expected

Every concept ticket of map 2 decides against this record, and [I55 Accept the foundation concepts][I55] accepts it
with the foundation concepts filled in. The glossary's ViViEfs and App creation
entries match it.

### Observed

Accepted by the human on 2026-10-27 in [I55 Accept the foundation concepts][I55], with every one of the 101 map-2
rows disposed of in an Answer of I47-[I59 Bring ADR-0002 and the vision page in line with I47][I59]. The glossary's ViViEfs and App
creation entries match it.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: 0002-purpose-scope-and-exemplar.md
[ADR-0006]: 0006-one-datom-log.md
[ADR-0012]: 0012-datom-backed-workflow-engine.md
[ADR-0016]: 0016-commands-and-server-validation.md
[ADR-0017]: 0017-sync-outbox-and-cursor-stream.md
[ADR-0022]: 0022-identity-and-organization-isolation.md
[ADR-0023]: 0023-data-at-rest-and-crypto-shredding.md
[ADR-0026]: 0026-verify-qualify-teach.md
[ADR-0033]: 0033-the-presenter-pattern.md
[ADR-0034]: 0034-origin-trust.md
[ADR-0035]: 0035-accepting-a-change.md
[ADR-0036]: 0036-the-journal-is-the-fence.md
[ADR-0037]: 0037-access.md
[ADR-0038]: 0038-tamper-evidence-and-proof-of-authorship.md
[D1]: ../plan/bootstrap/02-decision-log.md#d1
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D102]: ../plan/bootstrap/02-decision-log.md#d102
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D103-D106]: ../plan/bootstrap/02-decision-log.md#d103-d106
[D104]: ../plan/bootstrap/02-decision-log.md#d104
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D106]: ../plan/bootstrap/02-decision-log.md#d106
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D107-D117]: ../plan/bootstrap/02-decision-log.md#d107-d117
[D110]: ../plan/bootstrap/02-decision-log.md#d110
[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D118-D123]: ../plan/bootstrap/02-decision-log.md#d118-d123
[D123]: ../plan/bootstrap/02-decision-log.md#d123
[D124-D129]: ../plan/bootstrap/02-decision-log.md#d124-d129
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D130-D135]: ../plan/bootstrap/02-decision-log.md#d130-d135
[D131]: ../plan/bootstrap/02-decision-log.md#d131
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D134]: ../plan/bootstrap/02-decision-log.md#d134
[D136-D141]: ../plan/bootstrap/02-decision-log.md#d136-d141
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D142-D148]: ../plan/bootstrap/02-decision-log.md#d142-d148
[D149]: ../plan/bootstrap/02-decision-log.md#d149
[D149-D157]: ../plan/bootstrap/02-decision-log.md#d149-d157
[D150]: ../plan/bootstrap/02-decision-log.md#d150
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D159]: ../plan/bootstrap/02-decision-log.md#d159
[D160]: ../plan/bootstrap/02-decision-log.md#d160
[D161]: ../plan/bootstrap/02-decision-log.md#d161
[D162]: ../plan/bootstrap/02-decision-log.md#d162
[D2]: ../plan/bootstrap/02-decision-log.md#d2
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D37]: ../plan/bootstrap/02-decision-log.md#d37
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[D52]: ../plan/bootstrap/02-decision-log.md#d52
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[D65']: ../plan/bootstrap/02-decision-log.md#d65p
[D68]: ../plan/bootstrap/02-decision-log.md#d68
[D82]: ../plan/bootstrap/02-decision-log.md#d82
[D84]: ../plan/bootstrap/02-decision-log.md#d84
[D93]: ../plan/bootstrap/02-decision-log.md#d93
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[D96]: ../plan/bootstrap/02-decision-log.md#d96
[D97]: ../plan/bootstrap/02-decision-log.md#d97
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D98']: ../plan/bootstrap/02-decision-log.md#d98p
[D99]: ../plan/bootstrap/02-decision-log.md#d99
[I34]: ../issues/0034-vivief-as-the-source-of-viviefs-concepts.md
[I47]: ../issues/0047-what-viviefs-is-about.md
[I48]: ../issues/0048-where-the-server-independent-goal-is-recorded.md
[I49]: ../issues/0049-projection-one-concept-or-several-patterns.md
[I50]: ../issues/0050-contracts-checked-as-data-or-by-commands.md
[I51]: ../issues/0051-actors-or-the-engine.md
[I52]: ../issues/0052-the-datom-and-its-store.md
[I53]: ../issues/0053-sync-and-conflict.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I55]: ../issues/0055-accept-the-foundation-concepts.md
[I56]: ../issues/0056-one-shape-at-every-level.md
[I57]: ../issues/0057-out-of-scope-items-in-adr-trade-offs.md
[I58]: ../issues/0058-several-servers-in-the-lab.md
[I59]: ../issues/0059-bring-adr-0002-and-the-vision-in-line-with-i47.md
[I60]: ../issues/0060-server-independent-mode.md
[I62]: ../issues/0062-presenter-conformance-gate.md
[I64]: ../issues/0064-build-origin-trust.md
[I69]: ../issues/0069-accept-checks-every-change.md
[I70]: ../issues/0070-research-access-from-membership-to-enterprise.md
[I8]: ../issues/0008-engine-scale-out.md
[I80]: ../issues/0080-build-the-journal-fence.md
[I81]: ../issues/0081-build-conflicts-decided-at-accept.md
[I84]: ../issues/0084-build-the-access-pattern.md
[I85]: ../issues/0085-build-the-hash-chain.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
[P15]: ../plan/bootstrap/06-qualification-gates.md#p15
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
