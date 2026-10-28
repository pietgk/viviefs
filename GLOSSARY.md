# ViViEfs

Vision - View - Effects. A reference stack for building a modern Expo app together
with its backend, in a development environment that is AI-robust. This glossary
fixes the vocabulary the stack uses. It defines terms only; scope lives in
[the bootstrap plan](docs/plan/bootstrap/README.md) and decisions live in
[the ADRs](docs/adr/README.md). Where this file and an accepted ADR disagree, the
ADR wins and this file is corrected.

Every definition starts with one plain sentence that someone outside software
can follow ([D94 A glossary a newcomer can read][D94]). The docs site shows that sentence when a term is hovered and
links the first use of each term on a page to its entry here; the rest of a
definition is the precise meaning, for people and agents who need it.

## Architecture

**ViViEfs**:
The project these docs describe: people and AI agents building apps together,
and the proven parts those apps are built from, where tests prove what we built
and learners show whether we explained it well, so each new app starts from
what is proven. Vision - View - Effects: what we intend, what we show, and what
actually happens ([ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]). What ViViEfs builds is the reference stack and its
repository ([ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002]), and the consumer apps built on it live there too ([D55' Consumer apps live here][D55']).
What it is about is app creation, in one language people and agents read the
same way: gates verify what we built, learning verifies the language ([D96 Two verifications][D96]).
Today its apps are an Expo app (phone and web) and a Node.js server, which
holds authority for every organization ([D103 Nodes and authority][D103]). Successor in spirit to vivief.

**Vision - View - Effects**:
The loop this project runs at every level: what we intend, what we show, and
what actually happens. Vision is what we intend and decide (decisions, ADRs,
claims); Effects is what actually happened (the log, evidence, traces), an
effect in its last phase; View is what a person or an agent sees and learns
from (guides, diagrams, the app's screens). A gate is one turn, a guide another,
a grilling a third ([D98 Vision - View - Effects][D98], [D98' Vision - View - Effects, at every level][D98'], [D168 Vision - View - Effects, one entry][D168]). The three words are not terms on their own:
View is not React Native's `View`, and Effects is not the library.

**App creation**:
Building apps, and the proven parts and tools later apps are built with, by
people and AI agents together; using a part in a real app is how it gets
better. It is
what ViViEfs is about ([D95 App creation][D95], [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]): what we build is checked by gates, and
how we explained it is checked by whether others can learn it. vivief's broader
`Creation` (everything humans, AI and systems make) is not adopted. A tool,
such as `verify`, is an app for the people and agents building apps ([D102 Tools are apps][D102]).
_Avoid_: creation (alone, for this meaning)

**Pattern**:
A proven way to build one part of an app, written down once so every app here
builds that part the same way. It has one contract and may have several
implementations (log store, telemetry sink, identity, encrypted store). It is
delivered when gates have proven its claims, its exemplar passes verify, and a
person has accepted its guide.
_Avoid_: framework, template

**Contract**:
What a part of the system promises to the code that uses it, written down so a
check can catch a broken promise. In code it is an Effect service and its
types; its suites check that every implementation keeps it.
_Avoid_: interface (alone), API (for the promise)

**Implementation**:
One concrete way of keeping a pattern's contract, such as the log store on
SQLite or on Postgres. In code it is one Layer, qualified by running the
pattern's suites against it.
_Avoid_: adapter (reserved for the `layer:adapter` tag), plugin

**Reference implementation**:
The simplest way of keeping a pattern's contract, which every other way must
agree with. For the Presenter, SQLite read models with query atoms: every
implementation returns its frame for the same query at the same `tx` ([D110 The reference implementation][D110]).
It changes only by decision; the default an app gets can differ.

**Builds on**:
How one pattern uses another: it relies on the other's promises instead of
explaining them again. Patterns do not nest. A concept lives in the guide of
the pattern whose contract defines it and whose suite checks it.
_Avoid_: sub-pattern, nested pattern

**Guide**:
Everything a person or an agent needs to understand and use one pattern: why it
exists, how to use it, what to check in a review, and lessons with exercises.
A pattern is accepted on its guide.
_Avoid_: tutorial, docs page

**Guide template**:
The one shape every guide follows, so all guides read the same way. It is a
skeleton guide in `apps/docs/src/guide-template/`, from which `verify` derives
the required pages, headings and frontmatter. It changes when a guide shows it
is wrong, and the guides already written change with it.
_Avoid_: pattern template

**Exemplar**:
The real, working code that shows a pattern from start to finish, which new
code copies and the guides point to. It is the smallest code that does so, and
never pseudo-code.
_Avoid_: example, sample

**App**:
A program people run, such as the phone app or the server, put together from
features and libraries. In code it is a composition root that selects features
and provides every requirement as Layers, and it stays thin by rule.
_Avoid_: application package, shell

**Server**:
The program that decides which changes count for an organization. It accepts
or rejects every change, orders the accepted ones, grants membership and fences
leases; together these duties are its authority ([D103 Nodes and authority][D103]). To accept a change it asks
may this writer do this, is it well formed, and does the data stay valid ([D124 One checkpoint][D124]). It is a `node` like a
device, one that holds authority. Today one server holds all of these duties
for every organization; they could later be split across `node`s or shared by
all ([D104 The server-independent goal][D104], [I60 Server-independent mode][I60]).

**Feature**:
One piece of what the app does for its users, such as collecting evidence,
kept together from screen to server. In code it is a vertical slice split into
`model`, `client` and `server` projects.
_Avoid_: module, domain package

**Lib**:
Shared code with no business meaning of its own, such as storage or tracing,
used by features and apps.
_Avoid_: util, common, shared

**Effect**:
The TypeScript library this whole stack is written with; it makes errors,
dependencies and side effects visible in the types. Effect v4, pinned to one
exact version for `effect` and every `@effect` package ([ADR-0003 Effect v4 as the backbone][ADR-0003]). An `Effect`
value is an effect described and not yet run; how it ended is its `Exit`
([D164 Effect and effect, told apart by case][D164]).

**effect**:
Something that happens and makes a difference: a fact written, a message
sent, a screen redrawn, a model asked. An effect passes through phases, and
the stack names each: asked for (an intent), proposed (a changeset), happened
(a fact in the log, an activity's journaled exit). The library writes an
effect down as a value of its type `Effect` before it runs, and calls how it
ended an `Exit`: that is how it carries one effect through its phases, not
another meaning. Write effect alone only where the phase does not matter. A
read makes no difference, so it is not an effect. Written in lower case, and
reworded at the start of a sentence, where it would read as the library
([D163 One meaning of effect, named by phase][D163], [D164 Effect and effect, told apart by case][D164]).

**Effect handler**:
A step that takes what is known and an effect asked for, and decides which
effects follow, without making them happen. A command is one (a read model
and an intent in, a changeset or a `DomainError` out), authority's accept
another (the log and a changeset in, accepted facts or a `Rejection` out), and
a workflow body a third, over its journal; reads and pure helpers are not
([D165 The effect handler][D165], [D130 One shape at the data level][D130], [D136 The actor level is the durable workflow][D136]). Each keeps its signature in its own
terms, with no formula of its own ([D166 No formula with names of its own][D166]). Like Elm's `update`, except that what it returns is
proposed and counts only once accepted. vivief's `effectHandler`, in this
form. Not an effect handler of algebraic effects (OCaml 5, Koka), which
resumes a paused computation; Effect has no effect handler, and a handler
alone keeps Effect's meaning, the code behind a declared operation such as an
`Rpc`.
_Avoid_: handler (alone, for this meaning)

**Service**:
A named capability that code asks for instead of building it itself, such as
"the log store". In Effect it is a tag with an interface; which implementation
answers is decided where the app is put together, by a Layer.

**Layer**:
The recipe that supplies a service, and what it needs in turn, when an app is
put together. Swapping an implementation is swapping a Layer, for example the
log store on SQLite for the one on Postgres.

**Drain before close**:
A part that is shutting down first lets the work it already started finish. An
owned resource waits for its in-flight work before it is released, so a close
never runs under a live operation.

## Data

**Datom**:
One fact the system knows, such as "this list's title is Site visit", stored
once and never changed. Written `[e, a, v, tx, op, cs]`: entity, attribute,
value, transaction id, assert or retract, changeset. Each datom is its own
transaction.
_Avoid_: event, row, record

**Entity**:
The thing a fact is about, such as one list, one photo or one workflow run. A
type and an id; the subject `e` of datoms; its id may encode its parent for
strict composition. Most entities only have facts said about them; a workflow
run also acts.
_Avoid_: object, document

**Derived id**:
An id worked out from what identifies a thing, so every copy gets the same id
without asking anyone. Used wherever every copy must compute the same id: a
membership `M{person}`, an account `A{sha256(iss, sub)}`, journal entries,
entity-keyed ids. Other id segments are minted by the HLC's encoder ([D120 Minted and derived id segments][D120]).

**Attribute**:
A named kind of fact, such as "title", with a fixed type. Namespaced, typed by
a value Schema in the catalog that each store maps to its column type
([D121 Attribute value types][D121]), with a declared conflict policy; never renamed or retyped.
_Avoid_: field, column

**Defining attribute**:
The fact that makes a thing exist: while it is asserted, the thing exists. One
attribute per entity type; retracting it deletes the entity and hides its
subtree, and re-asserting it restores it.
_Avoid_: tombstone, deleted flag

**Changeset**:
Several facts that must appear together or not at all, such as a whole form.
It becomes visible atomically when its commit datom arrives; open changesets
are drafts. `cs == tx` marks a self-committed datom, a changeset of one.
_Avoid_: transaction (a datom's own unit), batch, patch, code changeset (a commit)

**Commit datom**:
The last fact of a changeset, which makes all of it appear at once. It is
write-once and carries the changeset's manifest and basis; the changeset's
envelope travels alongside it.

**Manifest**:
The packing list of a changeset: how many facts and files it has, so nothing
is applied half. The count and hash of its members (and file references) that
must be satisfied before it is applied.

**Basis**:
The point a change was made from: how far its writer had caught up with the
server. The server cursor the writer had pulled; authority uses it at accept to
notice that someone else changed the same thing since ([D34' Per-attribute conflict policies, decided at accept][D34']).

**Envelope**:
The label on a changeset: who made it, on which device, and why. One
fixed-shape record per changeset, keyed by `cs`: actor, device, lease epoch,
trace context, command name, acceptance time. Stored in the `changesets` table,
not as datoms; a self-committed datom has its own.
_Avoid_: headers, metadata datoms

**Origin**:
Where the content of a change came from: a person, a mail account, a website,
a model. Named in the envelope as a reference to an origin entity, apart from
the actor who committed the change; an enriching change also names its
inputs' origins ([D58' Envelope names the origin][D58'], [D115 Origin trust][D115]). Not the causing span, which is the step that
caused a write.

**Origin trust**:
How far an organization trusts what came from one origin, so trust can be
withdrawn from a source and everything it produced at once. Datoms on the
origin entity; a value's trust is derived when it is read, the least trusted of
its origin and its inputs' origins ([D115 Origin trust][D115], [ADR-0034 Origin trust][ADR-0034]).

**Trust level**:
How far a value can be relied on, from revoked to verified. Five ordered
levels: `revoked`, `untrusted`, `unreviewed`, `trusted`, `verified`; set per
origin by authority, with defaults per kind of origin ([D116 Trust levels and who sets them][D116]).
_Avoid_: trust score

**actor**:
Who is accountable for a change: the signed-in identity authority checked
before accepting it. Today a person or the server. An envelope field; the
kind of identity is a fact about that identity, not part of the envelope.
_Avoid_: Actor as an entity or type name, author

**Acceptance time**:
When the server accepted a change, by the server's own clock. Recorded on the
envelope; unlike `tx`, not a device's claim.
_Avoid_: timestamp, received time

**HLC**:
The clock that puts every fact in order, even on phones that are offline or
have the wrong time. A hybrid logical clock `(pt, c)` that mints every `tx`:
physical time corrected against the `node` holding authority (today the
server, [D119 Time corrected by authority][D119]) plus a tie-break counter.
_Avoid_: timestamp, version

**Conflict policy**:
The rule for what happens when two people change the same thing at once. Per
attribute: last writer wins (LWW), write-once fenced, or human conflict,
decided by authority when the change is accepted. An attribute holds one
value; a set is entities, one per member ([D144 A set is entities][D144]).

**Read model**:
A table built from the facts so a screen can show them quickly; it can be
thrown away and rebuilt at any time. Typed and disposable, projected from the
log, never migrated.
_Avoid_: view, cache

**Projector**:
The part that keeps the read models up to date as new facts arrive. It applies
committed changesets to read models and invalidates Reactivity keys; not the
trace projector.

**Query atom**:
A live question a screen asks of the read models, answered again when the
answer can have changed. A reactive Effect Atom running SQL against read
models, declaring its invalidation keys.

**Presenter**:
What a screen asks for data, and what keeps the answer up to date. A pattern:
a query written as data goes in, a frame comes out; its implementations range
from the reference (SQL over read models) to columnar copies and gathering
from outside sources ([D107 The Presenter pattern][D107], [ADR-0033 The Presenter pattern][ADR-0033]).
_Avoid_: projection (deriving a store from the log), view

**Frame**:
The rows a screen shows, with typed columns, where each value came from and
how fresh it is. A Presenter's result; one entity is a one-row frame, and its
status says fresh, gathering, remote or failed ([D109 Frame and frame subscription][D109]).
_Avoid_: data frame, result set

**Frame subscription**:
A screen's live hold on a frame, updated as new facts are committed and ending
when the screen closes ([D109 Frame and frame subscription][D109]).
_Avoid_: subscription (alone), live query

**Enrichment**:
Adding to the log what it cannot work out itself: content fetched from
outside, or a model's judgment. Written as an ordinary changeset naming its
origin, so a rebuild shows the same result ([D111 Faster and enriching implementations][D111]).

**Screen-view selector**:
The step that decides exactly what one screen shows, from the data and what
the user is doing. A pure function from read models, interaction state and
status to the props a screen renders.

**Log store**:
Where the facts are kept, on the phone, in the browser and on the server. The
pattern storing datoms and read models (SQLite native, SQLite wasm, SQLite
Node, Postgres).

**Organization**:
A company or team whose data is kept separate from every other one. The
`O{org}/` root of the id tree and the isolation unit; the server enforces
membership, and the first sync protocol replicates the whole organization.
_Avoid_: tenant, org account

**Command**:
A named kind of change, the only way people, agents and outside sources write
data. A pure Effect function `(readModel, intent) -> changeset or
DomainError`, registered with its intent Schema, a version name and the
attributes it may write; it runs on the device, and authority accepts what it
produced ([D127 Registered commands][D127], [ADR-0035 Accepting a change][ADR-0035]). The workflow engine's journal is the one writer
that is not a command. A command decides what should change, in event
sourcing's sense (decide, beside evolve, [D130 One shape at the data level][D130], [D169 A command decides][D169]); not Effect's
`DecisionModel.decide`, where a model answers a question about one input. Not
a command-line command (`effect/cli`'s `Command`).

**Intent**:
What someone asks to happen, before it is checked: a person, an agent or an
outside source. An effect in its first phase; the input to a command; not a
datom. A clock firing, a sync arriving or an activity's exit is not an intent
([D167 Intent: what someone asks to happen][D167]).

**Acceptance rule**:
A rule every change must keep, whoever made it, checked when the change is
accepted. Written in code beside the attribute or entity type it is about: a
value's type, uniqueness, a required attribute, an allowed transition, or a
rule over one entity and what it refers to. A command checks it early and
authority checks it again; a change may not break a rule that held before it
([D125 Acceptance rules][D125], [D126 No worse][D126]). A rule about who may make a change is access, not an acceptance
rule.
_Avoid_: contract (for this meaning), validation (alone), invariant (alone)

**IntentComposer**:
The part of a screen that helps a user put together a request step by step
before it is sent. An ephemeral machine with three parts: composing, reviewing,
submitting. Not durable and not a transaction; a kill discards the candidate.
Submitting hands the intent to a command. Encoding: effect-machine, with a
generated mermaid graph as part of the pattern (XState JSON viz is a later
option). The pattern name is IntentComposer; the teaching page and directory
are `intent-composer`. No OTLP on the composer; durable work is traced from
the log.
_Avoid_: capture (camera or evidence item), form wizard, transaction

**Outbox**:
The phone's queue of changes waiting until the server has confirmed it got
them. The device queue of changesets waiting to be acknowledged by the server.

**Cursor**:
A bookmark: how far a phone has caught up with the server's list of changes.
The server sequence position a replica has confirmed; first sync keeps one
cursor per organization. Not the trace cursor.

**Acknowledged cursor**:
A bookmark that moves only after the other side confirmed it received
everything before it. Redelivery is safe because ids are stable; used by sync
pull, trace export and the compaction horizon.

**Conflict datom**:
A note that two people changed the same thing and a person must choose.
Written by authority under the human-conflict policy, in the same step as the
change it found; a resolving command closes it.

**Quarantine**:
A person's work in a change the server refused, such as a photo sent with a
seal someone else set first, kept on their phone until they keep it as new or
throw it away. The user content of a rejected changeset, kept on the device
with its blobs until a person resolves it ([D148 Quarantine is rejected user content][D148]).
_Avoid_: lost lease

**Changeset abort**:
The fact that cancels an unfinished changeset so it never appears. Write-once.

**Blob**:
A file, such as a photo, stored by its content and pointed to by a fact. Stored
by content hash, referenced by a datom, not held in the log.

**Personal attribute**:
A kind of fact about a person that must be erasable on request. Marked so its
values are encrypted per subject for crypto-shredding: the subject encryption
level.

**Encryption level**:
How far a kind of fact is locked, by who holds the key that opens its values:
open, subject (one key per person, for erasure), group (members only, not the
operator) or role. Chosen per attribute; it narrows who can read and never
grants access ([D149 Encryption levels][D149]). The word waits for map 3.
_Avoid_: aperture, seal, trust level

**External identifier**:
An id another system gives a thing, such as the KvK number the Dutch Chamber
of Commerce gives a company. It belongs to its scheme, and within that scheme
it identifies exactly one thing. Stored as an ordinary attribute that travels
with its entity; an attribute may declare `unique: 'per-organization'`, checked
when a changeset is accepted ([D122 External identifiers][D122]).

**Crypto-shredding**:
Erasing someone's personal data by destroying the key that unlocks it, so the
history stays whole but their data becomes unreadable. Erasure by destroying the
per-subject key; the log stays intact.

**Tamper-evidence**:
Being able to tell afterwards that stored history was changed. Each
organization's accepted history is a hash chain every device recomputes, so a
rewrite is caught ([D155 A hash chain per organization][D155]); not built yet.
_Avoid_: tamper-proof, immutable storage

## Identity

**Identity**:
Who a request or a change is answerable to: a person, the server, or an agent
account. It proves itself with a credential, today an access token from a
provider account, later a key bound to it; the envelope's actor is an identity
([D152 One meaning of identity][D152]). One whose credential is its own key, with no one vouching, is
self-certifying, as Effect's `EventLog.Identity`. A device and a provider
account are not identities.
_Avoid_: user, principal, account (alone)

**Identity provider**:
The outside service people sign in with, such as a company login. It
authenticates the holder of a provider account and issues access tokens:
Keycloak in the lab, any OIDC provider in production. It does not know people
or memberships.
_Avoid_: auth server, IdP (in code), account provider

**Access token**:
A short-lived pass that proves who is asking, sent with every request to the
server. Signed by the identity provider.
_Avoid_: session, API key

**Sign-in session**:
Being signed in on one device. The tokens that prove a provider account
recently authenticated at the identity provider, with their state: signed in,
or sign-in needed. It keeps the server's statement about that account (its
person and organizations), fetched at every sign-in. Signing out ends it. A
device has at most one active. The only thing called a session.
_Avoid_: login state, identity

**Device**:
One installation of an app, on one phone or in one browser. It is the `node`
a person uses ([D103 Nodes and authority][D103]), and it keeps one local
replica per provider account that signed in on it; its id is chosen by the
device and not authenticated.
_Avoid_: client, peer

**Local replica**:
The device's own copy of the data a signed-in account may see, so the app also
works offline. In its own database; signing out closes it, and removing the
account from the device deletes it.
_Avoid_: cache, local store

**Provider account**:
A person's login at one identity provider. Identified by the token's issuer and
subject; recorded as an account entity in the server's log, which names its
person.
_Avoid_: user, login, subject (reserved for crypto-shredding)

**Server-only root**:
A part of the data that exists only on the server and is never copied to
devices. An id-tree root outside any organization; account entities live
there.
_Avoid_: global entity, system table

**Token verifier**:
The server's check of an access token: it either names the account or refuses.
Turns an access token into the provider account it proves, or rejects it.
_Avoid_: authenticator

**Fake issuer**:
A stand-in for the identity provider, used only in tests. It signs real access
tokens with a local key; allowed only in tests, tools and dev composition.
_Avoid_: mock identity, stub auth

**Bearer authentication**:
The server's front door: no request gets in without a valid access token. It
verifies the token before any handler runs. Authentication only; authorization
is the access decision.
_Avoid_: auth middleware

**Caller**:
Who sent one request to the server, once that is verified. An identity (today
a person) and the provider account it signed in with.
_Avoid_: principal, current user, session

**Person**:
One human, the same across every organization they belong to. Identified by an
opaque id the server mints and maps from provider accounts.
_Avoid_: user, member, Actor

**Membership**:
A person's right to act in one organization. Granted and revoked only by the
server, with whoever granted it as the actor ([D154 Whoever grants is the actor][D154]); the first rule of
the access decision.
_Avoid_: access, role (a role is a later access step)

**Access decision**:
The answer to whether an identity may do something: write this change, or
receive this part of the data. Made by authority at accept and at sync's filter
for one request of subject, action, resource and context, as of a position;
an error denies ([D151 The access pattern][D151]). Always the two words: a decision alone is a
decision-log entry.
_Avoid_: permission check, authz, policy decision

**Agent account**:
An identity of its own for an AI agent that acts on its own, created by a
person. It signs in, holds a membership and roles, and is refused what only a
person may do ([D153 Agent accounts][D153]). Not built yet.
_Avoid_: bot user, service user

**Server-only attribute**:
A kind of fact only the server may write, such as membership. Only
server-authored changesets may write it.

## Durable execution

**Workflow**:
A multi-step process that survives the app being closed or the phone
restarting, and carries on where it stopped. Versioned by name; its body
re-runs on resume and replays stored activity results.
_Avoid_: job, saga, flow

**Activity**:
One step of a workflow that touches the outside world, such as an upload, which
may be retried. Its result is journaled; it is the only place for time,
randomness and ids.
_Avoid_: task, step (except in prose)

**Execution**:
One run of a workflow. Entity `O{org}/W{exec}`, identified by a hash of
workflow name and idempotency key.

**Journal**:
The record of what a workflow run has done so far, so it can carry on after a
restart. The datoms recording an execution's activity results, deferred
completions, clocks, leases and result.
_Avoid_: history, event history

**Deferred**:
A point where a workflow waits for something from outside, such as a person's
approval. A durable wait completed from outside (a person, the server, a
notification action).

**Durable clock**:
A wait in a workflow that still ends on time after a restart. A durable sleep;
long sleeps schedule a local notification and a `wake_at` datom.

**Lease**:
The right of one device to run a given workflow run, so two devices never run
it at once. Fenced, and renewed while active.

**Lease epoch**:
The counter that tells an old lease from a newer one. The fencing counter on a
lease; journal writes under a stale epoch are rejected.

**Engine**:
The part that runs workflows and keeps their journals, the same on the phone and
on the server. Our datom-backed implementation of Effect's `WorkflowEngine`.

**Worker**:
The phone or server program that runs workflows. The device or server process
that runs workflow executions; Temporal vocabulary in [D2 Temporal model][D2], not a separate
product.

## Tracing

**Durable span**:
One step of a workflow as it appears in a trace, built from the stored facts so
it is never lost. Derived by the trace projector from journal facts: from its
entity's start fact and end fact. A deferred has no start fact, so its span has
zero length. Never produced by a live tracer.
_Avoid_: bracket facts, journal span

**Live span**:
A timing of work recorded while it runs, which is lost if the app is killed
before it ends. From Effect's in-process tracer (`Effect.withSpan`,
`Effect.fn`), exported when it ends. Workflow bodies emit none; activity bodies
do, under their durable span.
_Avoid_: live island

**Entity-keyed id**:
An id every copy of the data can compute on its own and get the same answer.
A derived id: a hash of an entity id, so every replica and every replay derives it without
coordination. Durable span ids hash the journal entity; the trace id hashes
the execution entity.

**Causing span**:
The step that caused a write, as named on the write's label. The span an
envelope names as the cause: the caller's live span when an outside caller
asked (start, approval, lease handoff), else the durable span of the fact's
entity.
_Avoid_: envelope origin

**Trace projector**:
The part that turns the stored facts into traces that monitoring tools can
show. Reads the log from its trace cursor, derives durable spans and exports
them to a telemetry sink.

**Trace cursor**:
A bookmark of how far traces have been sent to one monitoring tool. The log
position a trace projector has exported and a sink has acknowledged, one per
sink. It is the log store's acknowledged cursor for the consumer
`trace/<sink>`, so compaction never removes facts it has not exported.

## Decisions and evidence

**Decision**:
An answer agreed in a design discussion, numbered `D<n>` and named. Recorded in
the decision log with its reason; accepted intent until a gate proves the
claims it rests on. Not Effect's `Decision`, a model's answer about one input:
that answer is an enrichment, with the model as its origin ([D111 Faster and enriching implementations][D111]).

**ADR**:
A short document that records one important decision and why it was made, so
the reason is not lost later (architecture decision record, `ADR-NNNN`). It
names its claims and the gates that prove them; its status moves from Proposed
to Qualified to Accepted.

**Claim**:
A statement the stack depends on that could be false, such as "the log store
contract holds on every store". Each claim is proven by exactly one gate.
_Avoid_: assumption, fact (for a claim not yet proven)

**Gate**:
A numbered check that proves one claim, and can fail if the claim is false. Its
id starts with P, for proof ([P04 Log store conformance][P04]); it runs a retained, rerunnable probe.

**Probe**:
The program a gate runs to test its claim, kept so it can run again. Retained,
not a prototype.

**Positive control**:
A second check that proves the test can fail: it shows the problem is caught
when it is really there. The paired check proving a probe can detect the thing
it claims is absent.

**Ledger**:
The list of every gate run, written only by the tool that runs them. Append
only, machine-written, fingerprinted by inputs; a run is stale when an input
changed since.

**Evidence note**:
A dated write-up of a gate run: what ran, on what, and what it showed. Kept in
`docs/evidence/`; a lesson cites it, and it never replaces the ledger.

**Qualified**:
An ADR whose claims its gates have proven, with the evidence linked. Not yet
accepted.

**Accepted**:
An ADR or a guide that a person has reviewed and agreed to, after its gates
passed on that commit. An ADR is accepted on its pattern's guide; one that
records intent, with no pattern and no gate, is accepted directly ([D65' Intent records accepted directly][D65']).

**Delivered**:
A pattern that is finished: its claims are proven, its exemplar passes verify,
and a person has accepted its guide.

## Validation

**Verify**:
The full set of checks every change must pass before it is done. Staged; it
proves the code keeps its contract, runs only checks that need nothing but the
host, and changes no file. Done means verify passes.

**Verified commit**:
A saved version of the code on which every check passed. A commit on which
`pnpm verify` is green. A commit is to the repository what a changeset is to
the log: one step, prepared in a worktree, checked by verify and agreed by the
human, then kept on `main`, where CI runs verify again. The verdict is kept
only in the CI run ([D133 Verified commit][D133]). Not GitHub's "Verified" badge, which means a signed commit.
_Avoid_: passing tree, code changeset, merged commit

**Qualify**:
Proving claims about the stack by running gates, including on phones and
emulators, and recording each run in the ledger. Device and lab runs happen
only here; separated from verify by what a check needs and produces, not by
speed.
_Avoid_: slow tests, the heavy suite

**Crash matrix**:
The test that kills the workflow engine at every risky moment and checks that
it recovers without doing anything twice. It relaunches on the same store and
checks that the run finishes with every external effect done at most once.

**Gate step**:
One unit of the work that builds or runs a gate. Written `Pnn.k` (`P11.7`).
_Avoid_: step (alone)

**Verify step**:
One named check inside verify, such as `typecheck` or `unit`. One named unit of
a `verify` stage, from the stage table in `tools/verify`.
_Avoid_: step (alone), check (for the unit)

**Coverage producer**:
A verify step that runs tests and measures which code they reached. It emits a
coverage map and a test report: `unit`, `integration`, `storybook`.
_Avoid_: producer (alone), runner

**File treatment**:
For one source file, how verify shows that it works. The verify step that
produces its evidence and the verdict applied to it; every production file has
exactly one, with a written rationale, in the registry.
_Avoid_: treatment (alone), evidence owner, coverage owner

**Verdict**:
The rule that decides whether a file's checks are good enough. What a file
treatment applies to what its verify step produced: exact coverage, stories
ran, reached, statically checked, or gate named.

**Owning producer**:
The one coverage producer whose measurement of a file counts. Another producer
reaching the file is informational.

**Suite**:
A set of checks that tests one promise of a pattern, written once and run
against every implementation. The executable form of one aspect of a pattern's
contract, with a positive control that must fail it, named `<pattern>/<aspect>`
(`durable-workflow/crash-matrix`). A pattern has one or more suites; a suite
belongs to exactly one pattern. The same function runs in a verify step as a
check and in a gate's probe as the claim.
_Avoid_: conformance probe, test suite (a test file), host checks

**Registry**:
The reviewed list of every source file and how it is checked. Every production
file with its file treatment, rationale and suites; filesystem rules only
discover files.

**Evidence lockfile**:
The saved record of exactly how much of each file the tests reach, so a drop is
noticed. Each owning producer's exact per-file coverage, the providers' names
and versions, the registry digest and the bundle-size references; written only
by `pnpm verify baseline`.
_Avoid_: coverage baseline (as a target), ratchet

**Lesson**:
One page that teaches one idea and ends in a small exercise you do yourself.
It has recall questions before and after and one primary source; it cites gate
evidence and never becomes the source of a claim.
_Avoid_: module, unit (of a course)

**Exercise**:
A small piece of code to fix yourself, with a check that tells you when it is
right. A stub, a failing test and a reference solution that passes in verify.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: docs/adr/0002-purpose-scope-and-exemplar.md
[ADR-0003]: docs/adr/0003-effect-v4-as-backbone.md
[ADR-0032]: docs/adr/0032-what-viviefs-is-about.md
[ADR-0033]: docs/adr/0033-the-presenter-pattern.md
[ADR-0034]: docs/adr/0034-origin-trust.md
[ADR-0035]: docs/adr/0035-accepting-a-change.md
[D102]: docs/plan/bootstrap/02-decision-log.md#d102
[D103]: docs/plan/bootstrap/02-decision-log.md#d103
[D104]: docs/plan/bootstrap/02-decision-log.md#d104
[D107]: docs/plan/bootstrap/02-decision-log.md#d107
[D109]: docs/plan/bootstrap/02-decision-log.md#d109
[D110]: docs/plan/bootstrap/02-decision-log.md#d110
[D111]: docs/plan/bootstrap/02-decision-log.md#d111
[D115]: docs/plan/bootstrap/02-decision-log.md#d115
[D116]: docs/plan/bootstrap/02-decision-log.md#d116
[D119]: docs/plan/bootstrap/02-decision-log.md#d119
[D120]: docs/plan/bootstrap/02-decision-log.md#d120
[D121]: docs/plan/bootstrap/02-decision-log.md#d121
[D122]: docs/plan/bootstrap/02-decision-log.md#d122
[D124]: docs/plan/bootstrap/02-decision-log.md#d124
[D125]: docs/plan/bootstrap/02-decision-log.md#d125
[D126]: docs/plan/bootstrap/02-decision-log.md#d126
[D127]: docs/plan/bootstrap/02-decision-log.md#d127
[D130]: docs/plan/bootstrap/02-decision-log.md#d130
[D133]: docs/plan/bootstrap/02-decision-log.md#d133
[D136]: docs/plan/bootstrap/02-decision-log.md#d136
[D144]: docs/plan/bootstrap/02-decision-log.md#d144
[D148]: docs/plan/bootstrap/02-decision-log.md#d148
[D149]: docs/plan/bootstrap/02-decision-log.md#d149
[D151]: docs/plan/bootstrap/02-decision-log.md#d151
[D152]: docs/plan/bootstrap/02-decision-log.md#d152
[D153]: docs/plan/bootstrap/02-decision-log.md#d153
[D154]: docs/plan/bootstrap/02-decision-log.md#d154
[D155]: docs/plan/bootstrap/02-decision-log.md#d155
[D163]: docs/plan/bootstrap/02-decision-log.md#d163
[D164]: docs/plan/bootstrap/02-decision-log.md#d164
[D165]: docs/plan/bootstrap/02-decision-log.md#d165
[D166]: docs/plan/bootstrap/02-decision-log.md#d166
[D167]: docs/plan/bootstrap/02-decision-log.md#d167
[D168]: docs/plan/bootstrap/02-decision-log.md#d168
[D169]: docs/plan/bootstrap/02-decision-log.md#d169
[D2]: docs/plan/bootstrap/02-decision-log.md#d2
[D34']: docs/plan/bootstrap/02-decision-log.md#d34p
[D55']: docs/plan/bootstrap/02-decision-log.md#d55p
[D58']: docs/plan/bootstrap/02-decision-log.md#d58p
[D65']: docs/plan/bootstrap/02-decision-log.md#d65p
[D94]: docs/plan/bootstrap/02-decision-log.md#d94
[D95]: docs/plan/bootstrap/02-decision-log.md#d95
[D96]: docs/plan/bootstrap/02-decision-log.md#d96
[D98]: docs/plan/bootstrap/02-decision-log.md#d98
[D98']: docs/plan/bootstrap/02-decision-log.md#d98p
[I60]: docs/issues/0060-server-independent-mode.md
[P04]: docs/plan/bootstrap/06-qualification-gates.md#p04
