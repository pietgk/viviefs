# ADR-0036: The journal is the fence

Summary: A run's journal fences its own writers: every workflow engine fact names the fact it follows and is accepted only on the run's head, so a takeover is always allowed and no lease is needed.

Status: Proposed, unverified

Date: 2026-10-26

Qualifying gate: [P06 Workflow engine crash matrix][P06] and [P09 Sync][P09], qualified again on the journal fence.

Related: [D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39'], [D2 Temporal model][D2], [D10 Effect Workflow over our engine][D10], [D11 Human steps as deferreds][D11], [D13 Server holds workflow state][D13], [D15 Server authority after a lost lease][D15], [D40 Server-side human steps][D40], [D103 Nodes and authority][D103], [D147 User content outside the journal][D147], [D148 Quarantine is rejected user content][D148]. [ADR-0012 Durable execution over one datom-backed workflow engine][ADR-0012], [ADR-0014 Leases, fencing and server authority][ADR-0014] (its lease design is superseded once this ADR qualifies). [I71 An append can land after a revocation][I71], [I80 Build the journal fence][I80]. Decided in [I51 Actors or the engine][I51] ([the review page](../research/2026-10-24-actors-or-the-engine-review.html), sections 8 and 13-15).

## Problem

One workflow run must have one history, written by one writer at a time,
across devices that go offline for days and workflow runners on the server that can pause.
Today a lease per run with an epoch does it ([ADR-0014 Leases, fencing and server authority][ADR-0014], [D14 Leases with fencing][D14]), and the fence
holds: a write under an older epoch is refused. But the lease never expires
(`expiresAtMs` is always null), any member device may write a higher epoch
and so take a run at any time, and accept's check is not atomic with the
append ([I71 An append can land after a revocation][I71]). A lease is also a second record of who runs a run, beside the
journal, and it would need liveness (heartbeats, expiry, a takeover rule) to
move without its holder's help.

Effect Cluster, the scale-out path [D39 One engine everywhere][D39] named, owns a shard of runs by a lock
that is fenced by time only, keeps its own journal in `MessageStorage`, and
assumes Cluster runners that are always reachable. A device cannot be a Cluster runner, so
Cluster would add a second journal and a second fence beside the lease.

Write-once journal facts already make a second write of the same fact fail,
but that is not enough: an offline device's later steps, computed from a step
another device has since written differently, would be accepted on top of
it, and the journal would hold a history no run produced.

## Design

The workflow engine facts of a run (its start, an activity's start and exit, a durable
clock, its result) form one chain. Each names the workflow engine fact of its run it
follows. Authority accepts a workflow engine fact only if:

- the run has no head yet and the fact is its start (write-once: of two starts
  with one idempotency key, the second is refused), or
- the fact it follows is the run's head, which it then becomes.

Anything else is refused, and so is anything built on a refused fact. The
check and the append are one step. Outside inputs (a durable deferred completed by a
person, the server or a notification action, [D11 Human steps as deferreds][D11], [D40 Server-side human steps][D40]) are write-once on their
own entity, outside the chain: they never refuse the workflow runner's next write.

A takeover is always allowed: whoever is up to date writes on the head. The
holder of a run is derived, not stored: whoever wrote its head. Who runs a run
is policy, not safety:

- The holder resumes on its own (launch, wake-up, a completed durable deferred).
- Another device continues only when a person asks; a device offline for days
  may be doing legitimate work.
- A workflow runner on the server takes over a run whose head has not moved within its
  running step's timeout, read from the journal's acceptance times.
- An online writer may claim a step (its start fact accepted) before acting,
  so a race duplicates no side effect.

`viviefs/lease/holder` and the envelope's `leaseEpoch` are no longer written;
old values still decode, and nothing is renamed ([D44 Never rename, never migrate][D44]). Where "follows" lives
(an envelope field or a journal attribute) is [I80 Build the journal fence][I80]'s to design, with the other
details its review page lists (section 15h). Server scale-out is more workflow runners
on the same fence ([D39' One engine, one journal, one fence][D39']). Revisit if a measured server load needs Cluster's
routing in memory.

## Trade-offs

- **The lease everywhere, with liveness** (a heartbeat per holder, a takeover
  rule at accept, a policy per kind of holder): safe, but more parts, and a
  second record of who runs a run that can disagree with the journal.
- **Effect Cluster on the server**: two journals (`MessageStorage` fits the
  log poorly: claims rewritten on every read, deletes, a compare-and-delete)
  and a fence by time, beside the device lease.
- **Write-once facts alone**: no new field, but a spliced history gets in.
- **The journal fence**: the least stored and one record, at the cost of
  qualifying [P06 Workflow engine crash matrix][P06] and [P09 Sync][P09] again and a per-run head read at accept.
- **Out-of-scope items**: none made harder. The head check is a duty of
  authority, so the server-independent mode ([I60 Server-independent mode][I60], [D105 What must stay possible][D105]) can hold it on any
  sync node that holds authority.

## Failure-handling

- Two writers on one step: the second is refused and stops; at most one side
  effect is duplicated, made harmless by its idempotency key, and none when the
  step was claimed before acting.
- An offline device overtaken: its history from the divergence is refused whole;
  its domain changesets are judged on their own. User content never lives only
  in a journal value ([D147 User content outside the journal][D147]), and user content in a changeset that is rejected
  goes to quarantine ([D148 Quarantine is rejected user content][D148], [P14 Quarantine after a lost lease][P14]).
- A paused workflow runner: its late write follows a fact that is no longer the head and
  is refused.
- Two starts with one idempotency key: the second is refused.

To be shown by [P06 Workflow engine crash matrix][P06] (a kill during a takeover) and [P09 Sync][P09] (a second writer
refused, a spliced history refused, an outside input not moving the head).
Not yet run.

## Outcome

### Expected

One history per run, whoever writes it, with no lease, epoch or heartbeat; a
takeover is a replay plus a write.

### Observed

Not yet run. Built by [I80 Build the journal fence][I80].

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0012]: 0012-datom-backed-workflow-engine.md
[ADR-0014]: 0014-leases-fencing-and-server-authority.md
[D10]: ../plan/bootstrap/02-decision-log.md#d10
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D11]: ../plan/bootstrap/02-decision-log.md#d11
[D13]: ../plan/bootstrap/02-decision-log.md#d13
[D14]: ../plan/bootstrap/02-decision-log.md#d14
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D147]: ../plan/bootstrap/02-decision-log.md#d147
[D148]: ../plan/bootstrap/02-decision-log.md#d148
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D2]: ../plan/bootstrap/02-decision-log.md#d2
[D39]: ../plan/bootstrap/02-decision-log.md#d39
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[D40]: ../plan/bootstrap/02-decision-log.md#d40
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I51]: ../issues/0051-actors-or-the-engine.md
[I60]: ../issues/0060-server-independent-mode.md
[I71]: ../issues/0071-an-append-can-land-after-a-revocation.md
[I80]: ../issues/0080-build-the-journal-fence.md
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
