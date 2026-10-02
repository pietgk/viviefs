# I5: Confirm the suite catalogue as the one declaration place

Status: ready-for-human

Category: enhancement

Effort: [evidence-ownership](../plan/evidence-ownership/spec.md)

## What

Every suite is declared once in `libs/testing/src/suites.ts`, a choice made while building Evidence ownership (build record), because Vitest needs every tag in its config and `verify` needs the list without importing every lib. Confirm it, or decide where suites are declared instead.

## Comments
