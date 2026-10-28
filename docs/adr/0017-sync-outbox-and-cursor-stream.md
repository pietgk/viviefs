# ADR-0017: Sync: outbox and sync cursor stream over Effect RPC

Summary: Sync replicates datoms: an outbox up, one sync cursor stream per organization down, over Effect RPC.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P09 Sync][P09]

Related: [D21 Sync as datom replication (superseded)][D21], [D142 Sync from the start][D142], [D143 The sync contract as three parts][D143], [D34' Per-attribute conflict policies, decided at accept][D34']. [Architecture section 10](../plan/bootstrap/03-architecture.md),
[research/03](../plan/bootstrap/research/03-effect-eventlog-and-sync-engines.md).

## Problem

A domain read-sync engine (Zero, PowerSync) was withdrawn once domain data
lived in the same log ([D31 One datom log][D31]). Effect EventLog is the closest Effect-native
journal, but it has no server rejection, orders by device clock, and has no RN
path. PowerSync service is FSL; it is not in this plan.

## Design

Sync is datom replication. **Up:** outbox of datoms (self-committed and
changeset members + commits), idempotent by `tx`. **Down:** one sync cursor stream
(server sequence) of accepted datoms for the whole organization the identity
is a member of. Transport: Effect RPC, append-and-acknowledge. [P09 Sync][P09] confirms
this; do not list HttpApi/SSE/WebSocket as alternatives in the protocol.

Prefix subscriptions (partial sync), history consolidation, and client-side
data access on a full-org replica are later than [P09 Sync][P09].

Effect EventLog informed the design (server sequence + entry-id dedup) and is
not used.

**Read again on Effect 4.0.5** (amendment 2026-10-26, [D143 The sync contract as three parts][D143], [I53 Sync and conflict][I53]). `EventLog` is
now `effect/eventlog`, still marked unstable, and its model is unchanged: a
handler that fails on the server turns the whole batch into an
`InternalServerError` the client retries, entries order by the device's
clock, and an entry is one event with no changeset. The reasons above hold.
Like [D34' Per-attribute conflict policies, decided at accept][D34'], it finds conflicts where entries are accepted. The basis a
changeset carries is its writer's sync cursor ([D34'][D34']). Sync is in the foundation on
purpose ([D142 Sync from the start][D142]).

## Trade-offs

Full-org replica is simple and matches [D18 Organization isolation on the server][D18] isolation. The risk is unbounded
history and over-broad local reads; those are explicit later work, not silent
[P09 Sync][P09] extras.

## Failure-handling

[P09 Sync][P09]: outbox up, full-organization sync cursor down, Effect RPC
append-and-acknowledge, server validation, typed rejection, unknown attribute
upgrade error, lease fencing, durable deferred completion from the server, file
changeset manifest wait.

## Outcome

### Expected

One sync protocol. Server sequence is truth. EventLog, Zero and PowerSync are
not dependencies.

### Observed

2026-09-22. Ledger pass `2026-09-22T13-18-45.675Z-a314ca28` on sqlite-node.
Outbox up, one sync cursor per organization down, Effect RPC `Append` / `Pull` /
`PutBlob`. `Pull` returns one finite page. A second append of the same `tx`
acks. An acme pull does not include another organization's datoms. EventLog,
Zero and PowerSync are not dependencies. Not Accepted. Evidence:
[2026-09-22-p09.md](../evidence/2026-09-22-p09.md).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D142]: ../plan/bootstrap/02-decision-log.md#d142
[D143]: ../plan/bootstrap/02-decision-log.md#d143
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[D21]: ../plan/bootstrap/02-decision-log.md#d21
[D31]: ../plan/bootstrap/02-decision-log.md#d31
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[I53]: ../issues/0053-sync-and-conflict.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
