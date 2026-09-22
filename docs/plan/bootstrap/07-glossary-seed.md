# Glossary seed for CONTEXT.md

Seed vocabulary for `CONTEXT.md`. It defines terms only; scope lives in the plan and decisions in the ADRs.
Format follows complyj and BirVana: bold term, definition, `_Avoid_` list.

## Architecture

**ViViEfs**:
Vision - View - Effects. The reference stack and its repository; successor in spirit to vivief.

**Pattern**:
A reusable architectural solution with one contract and possibly several implementations (log store, telemetry
sink, identity, encrypted store). Delivered only when accepted with evidence, green in its exemplar, and taught.
_Avoid_: framework, template

**Implementation**:
One concrete Layer satisfying a pattern's contract, qualified by running the pattern's conformance probe.
_Avoid_: adapter (reserved for the `layer:adapter` tag), plugin

**Exemplar**:
The smallest real code showing a pattern end to end, which new code copies and docs link to. Not pseudo-code.
_Avoid_: example, sample

**App**:
A composition root that selects features and provides every requirement as Layers. Thin by rule.
_Avoid_: application package, shell

**Feature**:
A vertical slice of business capability split into `model`, `client` and `server` projects.
_Avoid_: module, domain package

**Lib**:
Shared capability with no business meaning, used by features and apps.
_Avoid_: util, common, shared

## Data

**Datom**:
One fact `[e, a, v, tx, op, cs]` in the log. Each datom is its own transaction.
_Avoid_: event, row, record

**Entity**:
The subject `e` of datoms. Its id may encode its parent for strict composition.
_Avoid_: object, document

**Attribute**:
A namespaced, Schema-typed property with a declared conflict policy. Never renamed or retyped.
_Avoid_: field, column

**Defining attribute**:
The one attribute per entity type whose assertion makes the entity exist; retracting it deletes the entity and hides
its subtree; re-asserting it restores it.
_Avoid_: tombstone, deleted flag

**Changeset**:
A set of datoms that becomes visible atomically when its commit datom arrives. Open changesets are drafts.
`cs == tx` marks a self-committed datom.
_Avoid_: transaction (a datom's own unit), batch, patch

**Commit datom**:
The write-once datom that makes a changeset visible, carrying its manifest and basis. The changeset's envelope travels alongside it.

**Manifest**:
Count and hash of a changeset's members (and file references) that must be satisfied before it is applied.

**Basis**:
The log position a changeset was built on; checked at commit against later changes per attribute policy.

**Envelope**:
One fixed-shape record per changeset, keyed by `cs`: actor, device, lease epoch, trace context, command name. Stored in the `changesets` table, not as datoms; a self-committed datom has its own.
_Avoid_: headers, metadata datoms

**HLC**:
Hybrid logical clock `(pt, c)` that mints every `tx`: server-corrected physical time plus a tie-break counter.
_Avoid_: timestamp, version

**Conflict policy**:
Per-attribute rule for concurrent writes: LWW, write-once fenced, or human conflict.

**Read model**:
A typed, disposable SQL table projected from the log; rebuilt, never migrated.
_Avoid_: view, cache

**Projector**:
The process that applies committed changesets to read models and invalidates Reactivity keys.

**Query atom**:
A reactive Effect Atom running SQL against read models, declaring its invalidation keys.

**Screen-view selector**:
A pure function from read models plus interaction state plus status to the props a screen renders.

**Log store**:
The pattern storing datoms and read models (SQLite native, SQLite wasm, SQLite Node, Postgres).

**Organization**:
The `O{org}/` root of the id tree and the isolation unit. The server enforces membership; the first sync protocol
replicates the whole organization.

**Command**:
A pure Effect function `(readModel, intent) -> changeset or DomainError`, shared by client and server.

**Intent**:
The user's requested change, input to a command. Not a datom.

**IntentComposer**:
Ephemeral machine that composes an intent. Parts: composing, reviewing,
submitting. Not durable and not a transaction; a kill discards the candidate.
Submitting hands the intent to a command. Encoding: effect-machine, with a
generated mermaid graph as part of the pattern (XState JSON viz is a later
option). No OTLP on the composer; durable work is traced from the log.
_Avoid_: capture (camera or evidence item), form wizard, transaction

**Outbox**:
The device queue of changesets waiting to be acknowledged by the server.

**Cursor**:
The server sequence position a replica has confirmed. First sync: one cursor per organization.

**Conflict datom**:
The datom raised under the human-conflict policy when both values are kept for a person to resolve.

**Changeset abort**:
The write-once fact that discards an open changeset so it never becomes visible.

**Blob**:
A file stored by content hash, referenced by a datom, not held in the log.

**Personal attribute**:
An attribute marked so its values are encrypted per subject for crypto-shredding.

**Crypto-shredding**:
Erasure by destroying the per-subject key so personal values become unreadable while the log stays intact.

## Durable execution

**Workflow**:
A versioned (by name) durable process whose body re-runs on resume and replays stored activity results.
_Avoid_: job, saga, flow

**Activity**:
A retryable side-effecting step whose result is journaled; the only place for time, randomness and ids.
_Avoid_: task, step (except in prose)

**Execution**:
One run of a workflow, entity `O{org}/W{exec}`, identified by a hash of workflow name and idempotency key.

**Journal**:
The datoms recording an execution's activity results, deferred completions, clocks, leases and result.
_Avoid_: history, event history

**Deferred**:
A durable wait completed from outside (a person, the server, a notification action).

**Durable clock**:
A durable sleep; long sleeps schedule a local notification and a `wake_at` datom.

**Lease**:
The fenced right of one device to run an execution, renewed while active.

**Engine**:
Our datom-backed implementation of Effect's `WorkflowEngine`, identical on device and server.

**Worker**:
The device or server process that runs workflow executions. Temporal vocabulary in D2; not a separate product.

**Lease epoch**:
The fencing counter on a lease. Stale epochs' journal writes are rejected.

## Validation

**Verify**:
The staged gate proving the code keeps its contract. Done = green.

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
