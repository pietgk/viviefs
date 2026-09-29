# ViViEfs

Vision - View - Effects. A reference stack for building a modern Expo app together
with its backend, in a development environment that is AI-robust. This glossary
fixes the vocabulary the stack uses. It defines terms only; scope lives in
[the bootstrap plan](docs/plan/bootstrap/README.md) and decisions live in
[the ADRs](docs/adr/README.md). Where this file and an accepted ADR disagree, the
ADR wins and this file is corrected.

## Architecture

**ViViEfs**:
Vision - View - Effects. The reference stack and its repository; successor in spirit
to vivief.

**Pattern**:
A reusable architectural solution with one contract and possibly several
implementations (log store, telemetry sink, identity, encrypted store). Delivered
only when qualified with evidence, green in its exemplar, and its guide accepted.
_Avoid_: framework, template

**Guide**:
A pattern's teaching material, written for discussing, designing, implementing
and reviewing work that uses the pattern. A pattern is accepted on its guide.
_Avoid_: tutorial, docs page

**Guide template**:
The one shape every guide follows. It changes when a guide shows it is wrong,
and the guides already written change with it.
_Avoid_: pattern template

**Implementation**:
One concrete Layer satisfying a pattern's contract, qualified by running the
pattern's conformance probe.
_Avoid_: adapter (reserved for the `layer:adapter` tag), plugin

**Exemplar**:
The smallest real code showing a pattern end to end, which new code copies and docs
link to. Not pseudo-code.
_Avoid_: example, sample

**App**:
A composition root that selects features and provides every requirement as Layers.
Thin by rule.
_Avoid_: application package, shell

**Feature**:
A vertical slice of business capability split into `model`, `client` and `server`
projects.
_Avoid_: module, domain package

**Lib**:
Shared capability with no business meaning, used by features and apps.
_Avoid_: util, common, shared

**Drain before close**:
An owned resource waits for its in-flight work before it is released, so a
close never runs under a live operation.

## Data

**Datom**:
One fact `[e, a, v, tx, op, cs]` in the log. Each datom is its own transaction.
_Avoid_: event, row, record

**Entity**:
The subject `e` of datoms. Its id may encode its parent for strict composition.
_Avoid_: object, document

**Attribute**:
A namespaced, Schema-typed property with a declared conflict policy. Never renamed
or retyped.
_Avoid_: field, column

**Defining attribute**:
The one attribute per entity type whose assertion makes the entity exist;
retracting it deletes the entity and hides its subtree; re-asserting it restores it.
_Avoid_: tombstone, deleted flag

**Changeset**:
A set of datoms that becomes visible atomically when its commit datom arrives. Open
changesets are drafts. `cs == tx` marks a self-committed datom.
_Avoid_: transaction (a datom's own unit), batch, patch

**Commit datom**:
The write-once datom that makes a changeset visible, carrying its manifest and
basis. The changeset's envelope travels alongside it.

**Manifest**:
Count and hash of a changeset's members (and file references) that must be
satisfied before it is applied.

**Basis**:
The log position a changeset was built on; checked at commit against later changes
per attribute policy.

**Envelope**:
One fixed-shape record per changeset, keyed by `cs`: actor, device, lease epoch,
trace context, command name, acceptance time. Stored in the `changesets` table,
not as datoms; a self-committed datom has its own.
_Avoid_: headers, metadata datoms

**actor**:
The envelope field naming who authored a changeset: a person, or the server. A
field name only; there is no Actor entity or type.
_Avoid_: Actor as an entity or type name, author

**Acceptance time**:
The server's clock time when it accepted a changeset, recorded on its envelope.
Unlike `tx`, not a device claim.
_Avoid_: timestamp, received time

**HLC**:
Hybrid logical clock `(pt, c)` that mints every `tx`: server-corrected physical
time plus a tie-break counter.
_Avoid_: timestamp, version

**Conflict policy**:
Per-attribute rule for concurrent writes: LWW, write-once fenced, or human conflict.

**Read model**:
A typed, disposable SQL table projected from the log; rebuilt, never migrated.
_Avoid_: view, cache

**Projector**:
The process that applies committed changesets to read models and invalidates
Reactivity keys. Not the trace projector.

**Query atom**:
A reactive Effect Atom running SQL against read models, declaring its invalidation
keys.

**Screen-view selector**:
A pure function from read models plus interaction state plus status to the props a
screen renders.

**Log store**:
The pattern storing datoms and read models (SQLite native, SQLite wasm, SQLite
Node, Postgres).

**Organization**:
The `O{org}/` root of the id tree and the isolation unit. The server enforces
membership; the first sync protocol replicates the whole organization.
_Avoid_: tenant, org account

**Command**:
A pure Effect function `(readModel, intent) -> changeset or DomainError`, shared by
client and server.

**Intent**:
The user's requested change, input to a command. Not a datom.

**IntentComposer**:
Ephemeral machine that composes an intent. Parts: composing, reviewing,
submitting. Not durable and not a transaction; a kill discards the candidate.
Submitting hands the intent to a command. Encoding: effect-machine, with a
generated mermaid graph as part of the pattern (XState JSON viz is a later
option). The pattern name is IntentComposer; the teaching page and directory
are `intent-composer`. No OTLP on the composer; durable work is traced from
the log.
_Avoid_: capture (camera or evidence item), form wizard, transaction

**Outbox**:
The device queue of changesets waiting to be acknowledged by the server.

**Cursor**:
The server sequence position a replica has confirmed. First sync: one cursor per
organization. Not the trace cursor.

**Acknowledged cursor**:
A consumer advances its cursor only after the receiver acknowledged; redelivery
is safe because ids are stable. Used by sync pull, trace export and the
compaction horizon.

**Conflict datom**:
The datom raised under the human-conflict policy when both values are kept for a
person to resolve.

**Changeset abort**:
The write-once fact that discards an open changeset so it never becomes visible.

**Blob**:
A file stored by content hash, referenced by a datom, not held in the log.

**Personal attribute**:
An attribute marked so its values are encrypted per subject for crypto-shredding.

**Crypto-shredding**:
Erasure by destroying the per-subject key so personal values become unreadable
while the log stays intact.

**Tamper-evidence**:
The property that a change to accepted history can be detected afterwards. Not
provided yet: stored history is trusted, not provable.
_Avoid_: tamper-proof, immutable storage

## Identity

**Identity provider**:
The external service that authenticates the holder of a provider account and
issues access tokens: Keycloak in the lab, any OIDC provider in production. It
does not know people or memberships.
_Avoid_: auth server, IdP (in code), account provider

**Access token**:
A short-lived signed token that proves who is calling, sent with every request
to the server.
_Avoid_: session, API key

**Sign-in session**:
On one device, the tokens that prove a provider account recently authenticated
at the identity provider, with their state: signed in, or sign-in needed. It
keeps the server's statement about that account (its person and
organizations), fetched at every sign-in. Signing out ends it. A device has at
most one active. The only thing called a session.
_Avoid_: login state, identity

**Device**:
One installation of an app. It keeps one local replica per provider account
that signed in on it. Its id is chosen by the device and not authenticated.
_Avoid_: client, peer

**Local replica**:
A device's copy of what one provider account may sync, in its own database.
Signing out closes it; removing the account from the device deletes it.
_Avoid_: cache, local store

**Provider account**:
A person's account at one identity provider, identified by the token's issuer
and subject. Recorded as an account entity in the server's log, which names its
person.
_Avoid_: user, login, subject (reserved for crypto-shredding)

**Server-only root**:
An id-tree root outside any organization, held only in the server's log and
never replicated. Account entities live there.
_Avoid_: global entity, system table

**Token verifier**:
The server-side check that turns an access token into the provider account it
proves, or rejects it.
_Avoid_: authenticator

**Fake issuer**:
The test implementation of the identity provider: it signs real access tokens
with a local key. Allowed only in tests, tools and dev composition.
_Avoid_: mock identity, stub auth

**Bearer authentication**:
The server boundary that requires and verifies an access token before any
handler runs. Authentication only; authorization is membership, actor and lease.
_Avoid_: auth middleware

**Caller**:
The verified requester of one server request: a person and the provider
account they signed in with.
_Avoid_: principal, current user, session

**Person**:
One human, across all organizations, identified by an opaque id the server
mints and maps from provider accounts.
_Avoid_: user, member, Actor

**Membership**:
A person's right to act in one organization, granted and revoked only by the
server.
_Avoid_: access, role (roles are carried, not enforced yet)

**Server-only attribute**:
An attribute that only server-authored changesets may write, such as membership.

## Durable execution

**Workflow**:
A versioned (by name) durable process whose body re-runs on resume and replays
stored activity results.
_Avoid_: job, saga, flow

**Activity**:
A retryable side-effecting step whose result is journaled; the only place for time,
randomness and ids.
_Avoid_: task, step (except in prose)

**Execution**:
One run of a workflow, entity `O{org}/W{exec}`, identified by a hash of workflow
name and idempotency key.

**Journal**:
The datoms recording an execution's activity results, deferred completions, clocks,
leases and result.
_Avoid_: history, event history

**Deferred**:
A durable wait completed from outside (a person, the server, a notification
action).

**Durable clock**:
A durable sleep; long sleeps schedule a local notification and a `wake_at` datom.

**Lease**:
The fenced right of one device to run an execution, renewed while active.

**Engine**:
Our datom-backed implementation of Effect's `WorkflowEngine`, identical on device
and server.

**Worker**:
The device or server process that runs workflow executions. Temporal vocabulary in
D2; not a separate product.

**Lease epoch**:
The fencing counter on a lease. Stale epochs' journal writes are rejected.

## Tracing

**Durable span**:
A span the trace projector derives from journal facts: from its entity's start
fact and end fact. A deferred has no start fact, so its span has zero length.
Never produced by a live tracer.
_Avoid_: bracket facts, journal span

**Live span**:
A span from Effect's in-process tracer (`Effect.withSpan`, `Effect.fn`), exported
when it ends and lost on a kill. Workflow bodies emit none; activity bodies do,
under their durable span.
_Avoid_: live island

**Entity-keyed id**:
An id that is a hash of an entity id, so every replica and every replay derives
it without coordination. Durable span ids hash the journal entity; the trace id
hashes the execution entity.

**Causing span**:
The span an envelope names as the cause of its write: the caller's live span when
an outside caller asked (start, approval, lease handoff), else the durable span
of the fact's entity.
_Avoid_: envelope origin

**Trace projector**:
Reads the log from its trace cursor, derives durable spans and exports them to a
telemetry sink.

**Trace cursor**:
The log position a trace projector has exported and a sink has acknowledged; one
per sink. It is the log store's acknowledged cursor for the consumer
`trace/<sink>`, so compaction never removes facts it has not exported.

## Validation

**Verify**:
The staged gate proving the code keeps its contract. Runs only checks that
need nothing but the host, on every change, and changes no file. Done = green.

**Qualify**:
Establishing a claim about the stack by running gates and recording them in
the ledger. Device and lab runs happen only here. Separated from verify by
what a check needs and produces, not by speed.
_Avoid_: slow tests, the heavy suite

**Crash matrix**:
The test that kills the engine at every boundary where a workflow's state is
half-written, relaunches it on the same store, and checks that the run
finishes with every external effect done at most once.

**Gate**:
A numbered check establishing one fact through a retained, rerunnable probe.

**Probe**:
The code a gate runs; retained, not a prototype.

**Positive control**:
The paired check proving a probe can detect the thing it claims is absent.

**Ledger**:
The append-only, machine-written record of gate runs, fingerprinted by inputs.

**Evidence owner**:
The single test layer responsible for proving a project's behaviour.

**Lesson**:
Teaching material that cites gate evidence and never becomes the source of a claim.

**Exercise**:
A stub, a failing test and a reference solution that passes in verify.
