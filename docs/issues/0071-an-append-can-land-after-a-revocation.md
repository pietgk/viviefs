# I71: An append can land after a revocation

Status: ready-for-agent

Category: bug

Found: 2026-10-09

## What

The sync server checks membership before it accepts a changeset, but not in the same transaction or under the same lock as the append, so an `Append` that races a membership `revoke` can be written to the log after the revocation committed. Found by reading the code in the [I70 Research: access from membership to enterprise][I70] research ([2026-10-09 Access from membership to enterprise](../research/2026-10-09-access-from-membership-to-enterprise.md)); not reproduced.

In `libs/sync/server/src/server.ts`, the `Append` handler calls `requireMembership(request.org)` and then `accept(...)`, which ends in `store.append`. The `writes` semaphore in the `Memberships` layer serializes `grant` and `revoke` with each other only. So: (1) the member's `Append` passes the membership check; (2) the operator's `revoke` commits; (3) the `Append` appends. Zanzibar tolerates the same window for a check that runs just before a revocation; whether ViViEfs does is the question.

To decide: reproduce it first in a test that interleaves the two (a probe or a suite against the real server Layer), then decide whether accept must check membership against the state it appends on (inside the append's transaction, or ordered by the log position it read, as [D124 One checkpoint][D124]'s first question would read it), or whether the window is accepted and documented. Relates to [I54 Trust, encryption and who may sign in][I54] (access) and [I69 Accept checks every change][I69] (accept checks every change), which touches the same code.

## Comments

2026-10-09: Triaged with the human: reproduce first, with a test that interleaves an append and a revoke against the real server Layer; whether to close the window is decided with [I54 Trust, encryption and who may sign in][I54], whose first question (may this writer do this) should read membership at the position it appends on.

2026-10-09: Reproduced. [`apps/evidence-server/src/revocation-race.integration.test.ts`](../../apps/evidence-server/src/revocation-race.integration.test.ts) runs the evidence server's composition (sync RPCs over HTTP, PGlite log, OIDC verifier against the fake issuer) with one test seam: the server's log store holds a device's append until the test releases it, so the interleaving is pinned without sleeps. Alice, a member of `acme`, sends an `Append`; it passes `requireMembership` and every accept check and waits at `store.append`; the operator's `revoke` returns at once (nothing it takes is held by the append) and `isMember` reads false; then the append is released. The `Append` acks `ok`, the revocation's datom is at seq 6, and the changeset's three datoms land at seq 7, 8 and 9, after it. Control: an `Append` sent after the revoke gets `MembershipMissing`. A passing test pins the race and the control; the invariant (no datom of the changeset after the revocation) is an `it.live.fails` known-bug test that keeps `verify` green and turns red once the window is closed, either by rejecting the append or by ordering it before the revocation. The window is not specific to the gate: every accept read between the membership check and `store.append` (tx lookups, `blobs.has`, lease and write-once reads) is an await where a concurrent revoke can commit.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D124]: ../plan/bootstrap/02-decision-log.md#d124
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I69]: 0069-accept-checks-every-change.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
