# I2: Accept the log-store guide

Status: ready-for-human

Category: enhancement

Effort: [log-store-guide](../plan/log-store-guide/spec.md)

## What

The log-store guide is a draft until a person accepts it. Acceptance ([D63 Acceptance on the guide][D63]) is one commit: run [P04 Log store conformance][P04] and [P05 Changesets and projections][P05] on it (devices and the lab), mark the guide `accepted` with the date and [ADR-0006 One datom log as the substrate][ADR-0006], [ADR-0007 Hybrid logical clock for tx][ADR-0007] and [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] `Accepted` with a link to the guide, and name the ledger run in the commit message. The `guides` step checks that the statuses agree.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: ../adr/0006-one-datom-log.md
[ADR-0007]: ../adr/0007-hybrid-logical-clock.md
[ADR-0011]: ../adr/0011-log-store-pattern.md
[D63]: ../plan/bootstrap/02-decision-log.md#d63
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
