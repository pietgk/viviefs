# ADR-0014: Leases, fencing and server authority

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P09

Related: D13, D14, D15. [ADR 0012](0012-datom-backed-workflow-engine.md),
[ADR 0017](0017-sync-outbox-and-cursor-stream.md).

## Problem

Activities have real side effects that cannot be merged afterwards. Several
people editing the same execution at once was rejected (D13). A device that
lost its lease must not keep a divergent journal, and user content must not be
silently dropped.

## Design

The sync server holds full workflow state (execution, journal, pending
deferreds and clocks) so another device can resume. The server stores it and
**never runs device workflow code**.

One lease per execution, renewed while active, with a fencing counter (lease
epoch). Stale holders' writes are rejected; other devices show the execution
read-only until the lease expires.

Server authoritative. A device that lost its lease drops its divergent journal
entries and replays from the server. User content (photos, recordings, drafts)
is never dropped; it is quarantined for human resolution. Idempotency keys
make side effects harmless. Quarantine mechanism is unspecified (open item;
likely D34 human-conflict after P05/P09).

## Trade-offs

Single-writer leases are simpler and safer than multi-writer merge. The cost
is read-only peers and a quarantine path that is not designed yet.

## Failure-handling

P09: lease fencing across two devices. Positive control: a stale-lease journal
write is rejected while the current holder's write is accepted.

## Outcome

### Expected

At most one device runs an execution. Stale epochs cannot journal. User bytes
are never silently deleted.

### Observed

Not yet run. Quarantine remains an open named slot.
