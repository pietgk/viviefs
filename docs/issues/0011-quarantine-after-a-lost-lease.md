# I11: Quarantine of user content after a lost lease

Status: ready-for-human

Category: enhancement

Decide when: [P14 Quarantine after a lost lease][P14]'s grilling, after Docs and teaching

## What

User content in a changeset authority rejects, the case [D15 Server authority after a lost lease][D15] called a lost lease, has no mechanism yet to keep it until a person decides.

## Direction

[D148 Quarantine is rejected user content][D148]: the user content of a changeset authority rejected, kept on the device with its blobs until a person keeps it as new (a command makes a fresh changeset) or discards it; not a conflict entry, because the content never reached the log. Gate [P14 Quarantine after a lost lease][P14]. Under the journal fence a refused history strands no user content, because an activity that captures some writes it as a domain changeset and returns its id ([D147 User content outside the journal][D147]).

## Comments

2026-10-26: [I51](0051-actors-or-the-engine.md) replaces the lease with the journal fence ([D14' The journal is the fence][D14'], [ADR-0036 The journal is the fence][ADR-0036], built by [I80 Build the journal fence][I80]). A "lost lease" now reads as a refused history: an offline device's journal from the point another writer moved the run's head is refused whole, and its user content is what this issue quarantines. The direction stands; [I53 Sync and conflict][I53] reviews this issue with that reading.

2026-10-26: Narrowed by [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), section 9; [D147 User content outside the journal][D147], [D148 Quarantine is rejected user content][D148]). The journal fence refuses engine facts only; user content travels in domain changesets, judged on their own, and an activity that captures user content writes it as a domain changeset and returns its id ([D147][D147]), so a refused history strands no user content. What is stranded is user content in a changeset authority rejected (a write-once collision, an acceptance rule, revoked access), with or without a workflow. Quarantine keeps it on the device: the rejected outbox rows that touch a user-content type, with their blobs, until a person keeps the content as new or discards it ([D148][D148]). Not a conflict fact: the content never reached the log. A copy on the server for its writer is deferred, `Decide when:` a person loses unresolved quarantined content with a lost or reset device, or must resolve it on another device. After revoked access it follows [I17 Local deletion after a revoked membership][I17]; blobs no fact refers to are [I82 Blobs no fact refers to][I82]'s. `Decide when:` unchanged: [P14 Quarantine after a lost lease][P14]'s grilling designs the screen.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D147]: ../plan/bootstrap/02-decision-log.md#d147
[D148]: ../plan/bootstrap/02-decision-log.md#d148
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[I17]: 0017-local-deletion-after-revoked-membership.md
[I53]: 0053-sync-and-conflict.md
[I80]: 0080-build-the-journal-fence.md
[I82]: 0082-blobs-no-fact-refers-to.md
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
