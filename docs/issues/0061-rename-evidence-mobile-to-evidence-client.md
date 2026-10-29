# I61: Rename `evidence-mobile` to `evidence-client`

Status: resolved

Category: enhancement

Found: 2026-10-07

## What

The Expo app's project was named `evidence-mobile` although it is also the web app; rename it to `apps/evidence-client`, the role name [D106 Consumer app shape][D106] gives a consumer app's native and web app. About 36 tracked files name it today, among them its `package.json` and `project.json`, the root `tsconfig.json`, `evidence-baseline.json`, `tools/qualification/src/ledger.ts` and the probes [P01 Platform on SDK 58][P01]-[P05 Changesets and projections][P05], [P07 Device resume E2E][P07] and `p11-device`. Ledger entries already written are machine-written history and keep the old name; never hand-edit them. The exemplar is what later apps copy, so the rename comes before more guides and probes cite the old name.

From [I48](0048-where-the-server-independent-goal-is-recorded.md) ([D106 Consumer app shape][D106]).

## Comments

2026-10-29: Renamed the app directory, Nx project and package to
`apps/evidence-client`, `evidence-client` and `@viviefs/evidence-client`.
The feature library already held both names; it now uses
`evidence-client-feature` / `@viviefs/evidence-client-feature`, following
`features/evidence/server`'s convention. Its qualification imports follow it.
TypeScript references, lint scope, evidence registry, ignored native outputs,
build and bundle outputs, qualification probes, qualification input fingerprint
and living document paths all use the new app directory. The app's native
identity and URL scheme stay the same. Dated records retain their historical text, with navigation links updated to
the renamed files; the qualification ledger is unchanged. The baseline is regenerated through
`pnpm verify baseline`, with its coverage and bundle diff reviewed; the final
batch still requires the sequential qualification run.

Validation: `mise exec -- pnpm verify baseline` and `mise exec -- pnpm verify`.
The baseline review confirms all 97 coverage tuples, minified JavaScript sizes
and dependency resolutions are unchanged; both Hermes bundles remain within
their budgets;
`pnpm ledger` reports the previous gate passes as stale, as expected for this
qualification input change.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D106]: ../plan/bootstrap/02-decision-log.md#d106
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
