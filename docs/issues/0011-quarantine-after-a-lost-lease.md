# I11: Quarantine of user content after a lost lease

Status: ready-for-human

Category: enhancement

Decide when: [P14 Quarantine after a lost lease][P14]'s grilling, after Docs and teaching

## What

User content stranded when a device loses its lease ([D15 Server authority after a lost lease][D15]) has no mechanism yet.

## Direction

A human-conflict entry ([D34 Per-attribute conflict policies][D34]) resolved by a command; gate [P14 Quarantine after a lost lease][P14]. [P09 Sync][P09] already rejects the stale journal write before it enters the device log; user content stays in the log.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D34]: ../plan/bootstrap/02-decision-log.md#d34
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
