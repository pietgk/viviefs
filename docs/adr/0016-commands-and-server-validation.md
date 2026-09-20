# ADR-0016: Commands, server validation and rejection

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P09

Related: D36. [Architecture section 7](../plan/bootstrap/03-architecture.md).

## Problem

Offline-capable writes and server authority fight if the client and server do
not share one write function. A custom "reject this event" protocol was why
Effect EventLog was not adopted: a failing server handler becomes a poison
batch.

## Design

Commands are shared pure Effect functions
`(readModel, intent) -> changeset or DomainError`, in `features/<f>/model`,
run on client and server.

Client: run command, apply locally (optimistic), append to outbox. Server:
receive changeset, Schema, membership/authorization (`O{org}` prefix),
invariants (independent review, lease fencing, basis check), accept or reject
the whole changeset with a typed error. On rejection the client rebuilds read
models from confirmed datoms, reapplies its remaining outbox, and traces the
rejection.

One write path for app and engine.

## Trade-offs

Pure shared commands mean the server cannot "fix up" a changeset; it accepts
or rejects. That is the point of server authority. Optimistic apply plus
rebuild-on-reject is more work than "trust the client".

## Failure-handling

P09: typed rejection with rebuild and reapply; unknown-attribute upgrade
error. web-interview ADR 008 is the behavioural reference.

## Outcome

### Expected

No second write path. Rejection is typed and recoverable. Unknown attributes
demand an upgrade, not a silent drop.

### Observed

Not yet run.
