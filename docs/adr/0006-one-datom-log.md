# ADR-0006: One datom log as the substrate

Status: Qualified

Date: 2026-09-20

Qualifying gate: P04

Related: D31. [Architecture](../plan/bootstrap/03-architecture.md),
[ADR 0008](0008-single-datom-transactions-with-changesets.md),
[ADR 0018](0018-tracing-and-telemetry-sinks.md).

## Problem

Durable journal, domain data, sync and tracing are usually four stores. That
splits the audit trail, doubles sync protocols, and tempts using a tracing
backend as a journal (lossy, sampled, non-transactional).

## Design

One datom log is the single substrate. The engine journal, domain data and sync
all use it; tracing is derived from it. Datom = `[e, a, v, tx, op, cs]`. Each
datom is its own transaction.

This realises vivief's "observability is projection over effect datoms" without
trusting a telemetry backend for durability.

**Domain truth lives only in the log** (made explicit 2026-09-27, P11 grilling).
Every other SQL table is one of three kinds:

| Kind | Examples | Rebuilt from the log? |
| --- | --- | --- |
| The log itself | `datoms`, `changesets` (envelopes) | It is the source |
| Read models | `projected_facts`, `projection_conflicts`, `changeset_status` | Yes: disposable, never migrated |
| Operational state of one replica | `hlc_state`, cursors, `outbox`, `sync_cursor` | No, and it holds no domain facts |

A fact that fits none of these goes into the log. P11 applied this to the
mapping from identity-provider accounts to people: a separate `people` table
was proposed and rejected, because it would have been history-less and
outside the audit trail and a future hash chain
([ADR-0022](0022-identity-and-organization-isolation.md)).

## Trade-offs

One format and one sync protocol. The cost is that the log store must be right
before anything else is built, which is why P04 is a foundation gate. Effect
EventLog was studied as a design reference and not adopted (no server rejection,
device-clock ordering, no RN path).

## Failure-handling

P04 holds the contract: append, dedup by `tx`, HLC mint and receive, cursor
streaming, prefix scans, compaction horizon, on SQLite (native including
Android, wasm, Node) and Postgres. Positive control: duplicate append is a
no-op while a new `tx` is appended.

## Outcome

### Expected

One storage format, one sync protocol, one audit trail. Tracing backends are
viewers, never the store the engine reads from.

### Observed

2026-09-20. Ledger pass
`2026-09-20T19-30-57.292Z-6aa3906d`. Eleven checks (append, duplicate append,
HLC mint, backwards clock, reboot, remote-ahead, future skew, cursor streaming,
prefix scans, compaction horizon, volume 2000) passed on sqlite-node, PGlite,
iOS, Android and web wasm/OPFS. Duplicate append was a no-op while a new `tx`
inserted. Evidence: [2026-09-20-p04.md](../evidence/2026-09-20-p04.md).
