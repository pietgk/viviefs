# I61: Rename `evidence-mobile` to `evidence-client`

Status: ready-for-agent

Category: enhancement

Found: 2026-10-07

## What

The Expo app's project is `apps/evidence-mobile` although it is also the web app; rename it to `evidence-client`, the role name [D106 Consumer app shape][D106] gives a consumer app's native and web app. About 36 tracked files name it today, among them its `package.json` and `project.json`, the root `tsconfig.json`, `evidence-baseline.json`, `tools/qualification/src/ledger.ts` and the probes [P01 Platform on SDK 58][P01]-[P05 Changesets and projections][P05], [P07 Device resume E2E][P07] and `p11-device`. Ledger entries already written are machine-written history and keep the old name; never hand-edit them. The exemplar is what later apps copy, so the rename comes before more guides and probes cite the old name.

From [I48](0048-where-the-server-independent-goal-is-recorded.md) ([D106 Consumer app shape][D106]).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D106]: ../plan/bootstrap/02-decision-log.md#d106
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
