# I5: Confirm the suite catalogue as the one declaration place

Status: resolved

Category: enhancement

Effort: [evidence-ownership](../plan/evidence-ownership/spec.md)

## What

Every suite is declared once in `libs/testing/src/suites.ts`, a choice made while building Evidence ownership (build record), because Vitest needs every tag in its config and `verify` needs the list without importing every lib. Confirm it, or decide where suites are declared instead.

## Answer

Confirmed with the human on 2026-10-09: every suite is declared once in `libs/testing/src/suites.ts`. [D82 Patterns build on each other][D82] already builds on it (the pattern id there is the guide folder, the suite prefix and the `metadata.guides` value), and the coming suites (`changesets/acceptance` from [I69 Accept checks every change][I69], the Presenter's from [I62 The Presenter conformance gate][I62]) are declared there.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D82]: ../plan/bootstrap/02-decision-log.md#d82
[I62]: 0062-presenter-conformance-gate.md
[I69]: 0069-accept-checks-every-change.md
