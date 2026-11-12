# I105: Suite evidence is not tied to each implementation

Status: ready-for-human

Category: enhancement

Decide when: a pattern gains another implementation (a third log store, or a second Presenter implementation, [I62 The Presenter conformance gate][I62]), or a suite is found to have passed for one implementation only

Found: 2026-10-29

## What

`verify`'s `evidence` step accepts a suite as passed for an implementation when any passing test carries the suite's tag anywhere in the producer's report, so one implementation's pass could stand in for another's. Design concern A03 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#a03-suite-evidence-is-not-tied-to-each-implementation).

The Postgres and sqlite-node entries of the evidence registry ask for the same suite tags (`tools/verify/src/evidence-registry.ts`, judged in `tools/verify/src/evidence.ts`). Today's integration files do run the suites on both stores, so nothing is failing: this is a limit of the guardrail, not a conformance failure. It matters because a pattern promises that every implementation passes the same suite ([ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]).

## To decide

Whether evidence is keyed by suite and implementation, with a required matrix and a hostile fixture that deletes one cell and must fail. The per-file coverage checks stay either way.

## Comments

2026-11-10: Split from [I100 Address the repo-wide review findings][I100] in its triage and parked. Why it waits: with two host stores that both run every suite, the limit hides nothing today; the redesign pays off when the matrix grows.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[I100]: 0100-address-the-repo-wide-review-findings.md
[I62]: 0062-presenter-conformance-gate.md
