# I11: Quarantine of user content after a lost lease

Status: ready-for-human

Category: enhancement

Decide when: [P14 Quarantine after a lost lease][P14]'s grilling, after Docs and teaching

## What

User content stranded when a device loses its lease ([D15 Server authority after a lost lease][D15]) has no mechanism yet.

## Direction

A human-conflict entry ([D34 Per-attribute conflict policies][D34]) resolved by a command; gate [P14 Quarantine after a lost lease][P14]. [P09 Sync][P09] already rejects the stale journal write before it enters the device log; user content stays in the log.

## Comments

2026-10-26: [I51](0051-actors-or-the-engine.md) replaces the lease with the journal fence ([D14' The journal is the fence][D14'], [ADR-0036 The journal is the fence][ADR-0036], built by [I80 Build the journal fence][I80]). A "lost lease" now reads as a refused history: an offline device's journal from the point another writer moved the run's head is refused whole, and its user content is what this issue quarantines. The direction stands; [I53 Sync and conflict][I53] reviews this issue with that reading.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D34]: ../plan/bootstrap/02-decision-log.md#d34
[I53]: 0053-sync-and-conflict.md
[I80]: 0080-build-the-journal-fence.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
