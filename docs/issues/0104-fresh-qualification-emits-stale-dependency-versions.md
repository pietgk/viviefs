# I104: Fresh qualification emits stale dependency versions

Status: ready-for-agent

Category: bug

Decide when: the next change that touches `tools/qualification` or [P02 SQLite drivers][P02]'s or [P08 UI three-way prototype][P08]'s probe, at the latest the sequential run that closes phase 3

Found: 2026-10-29

## What

A fresh, passing gate run writes dependency versions that did not run: [P08 UI three-way prototype][P08]'s `picks.json` names effect-machine 0.38.0 and atom-react 4.0.0-rc.116 while the workspace pins 0.46.0 and 4.0.5, and [P02 SQLite drivers][P02]'s claim says op-sqlite 17.x while its summary and the code use 18.2.5. Finding R06 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#r06-fresh-qualification-emits-stale-dependency-versions).

The versions are written by hand in `tools/qualification/src/probes/p08.ts` and `tools/qualification/src/gates.ts`. The update for stable Effect ([I23 effect-machine still requires the Effect release candidate][I23]) changed the dependencies and not these strings. The docs site's Claims page shows [P02 SQLite drivers][P02]'s claim as written.

Rechecked on main on 2026-11-10: both are unchanged.

## Direction

Read the versions a run records from the package manifests it ran on, and word [P02 SQLite drivers][P02]'s claim for the version tested. Add a check that a recorded version equals the installed one.

## Comments

2026-11-10: Split from [I100 Address the repo-wide review findings][I100] in its triage and parked. Why it waits: `tools/qualification` is a gate input, so the repair makes [P01 Platform on SDK 58][P01]-[P11 Identity][P11] stale, and the build queue is frozen until the log-store guide is accepted ([D214 The build queue waits for the log-store guide][D214]). It goes with the next change that touches the qualification tools anyway.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D214]: ../plan/bootstrap/02-decision-log.md#d214
[I100]: 0100-address-the-repo-wide-review-findings.md
[I23]: 0023-effect-machine-on-stable-effect.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P02]: ../plan/bootstrap/06-qualification-gates.md#p02
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
