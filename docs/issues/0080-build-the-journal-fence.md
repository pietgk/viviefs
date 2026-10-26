# I80: Build the journal fence

Status: ready-for-agent

Category: enhancement

Blocked by: [I71 An append can land after a revocation][I71]

Found: 2026-10-26

## What

A run's lease is a second record of who runs it, beside its journal, and today it never expires, any member device may take it, and its check is not atomic with the append; build [D14' The journal is the fence][D14'] ([ADR-0036 The journal is the fence][ADR-0036]) so the journal itself is the fence and the lease is no longer written.

From [I51 Actors or the engine][I51] ([the review page](../research/2026-10-24-actors-or-the-engine-review.html), sections 5 and 13-15). Today's lease is safe: a write under an older epoch is always refused ([P09 Sync][P09]). What it lacks is found in [ADR-0014 Leases, fencing and server authority][ADR-0014]'s Observed entry of 2026-10-26: `expiresAtMs` is always null and nothing renews it, a higher epoch from any member device is accepted, and accept's lease read is not atomic with the append ([I71 An append can land after a revocation][I71]). [D14' The journal is the fence][D14'] replaces it rather than completing it.

### What to build

1. **Follows.** Every engine fact (the start, an activity's start and exit, a durable clock, the result) names the engine fact of its run it follows. `viviefs/activity/started` joins the chain; it is write-once today but not in the server's journal check.
2. **The head check at accept.** An engine fact is accepted only if it follows the run's head, or is the start of a run with no head; otherwise it is refused (behind), and so is anything built on it. Checked in one step with the append, which needs [I71 An append can land after a revocation][I71]'s fix.
3. **Outside inputs stay outside.** A deferred completed by a person, the server or a notification action is write-once on its own entity and does not move the head.
4. **The lease goes.** `viviefs/lease/holder` and the envelope's `leaseEpoch` are no longer written; old values still decode, nothing is renamed ([D44 Never rename, never migrate][D44]). The engine's `Leases` service and its handoff go; a takeover is a replay plus a write. The holder is derived from the head.
5. **Policy.** Only the holder resumes on its own; another device continues when a person asks; a server runner takes over a run whose head has not moved within its running step's timeout; an online writer may claim a step before acting.
6. **Gates.** [P06 Workflow engine crash matrix][P06] keeps its crash matrix, with "during lease handoff" becoming "during a takeover". [P09 Sync][P09]'s `staleLease` check becomes: a second writer on one step refused, a spliced history refused (an offline phone's later steps on top of another device's step), and an outside input not moving the head. Both qualified again in phase 3's closing sequential run.

### To design first

- Where "follows" lives: an envelope field (journal writes are one-fact changesets already) or a journal attribute.
- An await that races two outside inputs (a deferred against a durable clock) records which one it took as an engine fact, so every replay takes the same one.
- Claim before acting: always for server runners; for an online phone or not.
- Where a step's timeout comes from (the activity's own declaration), and what "Continue on this phone?" looks like.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0014]: ../adr/0014-leases-fencing-and-server-authority.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I51]: 0051-actors-or-the-engine.md
[I71]: 0071-an-append-can-land-after-a-revocation.md
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
