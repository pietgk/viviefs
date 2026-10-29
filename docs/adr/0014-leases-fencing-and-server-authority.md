# ADR-0014: Leases, fencing and server authority

Summary: One fenced lease per execution; the server holds all workflow state, decides, and never runs device work.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P09 Sync][P09]

Related: [D13 Server holds workflow state][D13], [D14 Leases with fencing][D14], [D15 Server authority after a lost lease][D15], [D14' The journal is the fence][D14']. [ADR-0036 The journal is the fence][ADR-0036] (the journal fence, which supersedes this ADR's lease design once qualified). [ADR 0012](0012-datom-backed-workflow-engine.md),
[ADR 0017](0017-sync-outbox-and-cursor-stream.md).

## Problem

Activities have real side effects that cannot be merged afterwards. Several
people editing the same execution at once was rejected ([D13 Server holds workflow state][D13]). A device that
lost its lease must not keep a divergent journal, and user content must not be
silently dropped.

## Design

The sync server holds full workflow state (execution, journal, pending
durable deferreds and clocks) so another device can resume. The server stores it and
**never runs device workflow code**.

One lease per execution, renewed while active, with a fencing counter (lease
epoch). Stale holders' writes are rejected; other devices show the execution
read-only until the lease expires.

Server authoritative. A device that lost its lease drops its divergent journal
entries and replays from the server. User content (photos, recordings, drafts)
is never dropped; it is quarantined for human resolution. Idempotency keys
make side effects harmless. Quarantine mechanism is unspecified (open item;
likely [D34 Per-attribute conflict policies][D34] human-conflict after [P05 Changesets and projections][P05]/[P09 Sync][P09]).

## Trade-offs

Single-writer leases are simpler and safer than multi-writer merge. The cost
is read-only peers and a quarantine path that is not designed yet.

## Failure-handling

[P09 Sync][P09]: lease fencing across two devices. Positive control: a stale-lease journal
write is rejected while the current holder's write is accepted.

## Outcome

### Expected

At most one device runs an execution. Stale epochs cannot journal. User bytes
are never silently deleted.

### Observed

2026-09-22. Ledger pass `2026-09-22T13-18-45.675Z-a314ca28`. Two devices:
epoch 1 is `StaleLease`; epoch 2 is accepted; the stale device's later pull
sees only the holder's activity exit. The server appends datoms and does not
run the workflow. A self-committed journal write stays off the device log
until the server acks it. Quarantine is still an empty named slot. Not
Accepted. Evidence:
[2026-09-22-p09.md](../evidence/2026-09-22-p09.md).

2026-10-26, found in [I51 Actors or the engine][I51] by reading the code. The lease never expires: the
workflow engine writes `expiresAtMs: null` on grant and handoff, nothing renews it, and
the server checks only the epoch and the device. Any member device may write a
higher epoch and so take a run at any time ([P09 Sync][P09]'s `staleLease` check does
exactly that), which the Design's "read-only until the lease expires" does not
match. Accept's lease read is not atomic with the append ([I71 An append can land after a revocation][I71]). None of these
lets an older epoch write. [D14' The journal is the fence][D14'] replaces the lease with the journal fence
([ADR-0036 The journal is the fence][ADR-0036], built by [I80 Build the journal fence][I80]), which supersedes this ADR's lease design once
qualified; until then the lease runs as qualified.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: 0036-the-journal-is-the-fence.md
[D13]: ../plan/bootstrap/02-decision-log.md#d13
[D14]: ../plan/bootstrap/02-decision-log.md#d14
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D34]: ../plan/bootstrap/02-decision-log.md#d34
[I51]: ../issues/0051-actors-or-the-engine.md
[I71]: ../issues/0071-an-append-can-land-after-a-revocation.md
[I80]: ../issues/0080-build-the-journal-fence.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
