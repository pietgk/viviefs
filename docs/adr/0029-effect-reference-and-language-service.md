# ADR-0029: Effect reference subtree and language service

Status: Proposed, unverified

Date: 2026-09-21

Qualifying gate: verify

Related: D30, D49, [ADR-0003](0003-effect-v4-as-backbone.md),
[ADR-0025](0025-ai-robust-guardrails.md),
[ADR-0027](0027-developer-experience-planes.md),
[ADR-0028](0028-typescript-7-cli-with-typescript-6-api.md).

## Problem

Agents guess Effect usage from docs snippets and compiled `node_modules`.
That is token-inefficient and drifts from v4 idioms. ADR-0025 already named
the Effect language service. Official v4 tooling is `@effect/tsgo` on
TypeScript 7, which this repo dual-pinned in ADR-0028. Cloning Effect into
`$HOME` would leave Cursor and CI without the same tree (D49).

## Design

- Vendor Effect v4 source at `repos/effect` with `git subtree` from
  `Effect-TS/effect` `main`, squashed. Read-only reference. Application code
  still imports `effect` and `@effect/*` from pnpm at `4.0.0-rc.116`.
- Pin `@effect/tsgo` exactly. `prepare` runs
  `effect-tsgo patch --typescript --typescript-package @typescript/native`
  so CLI `tsc` (TypeScript 7) emits Effect diagnostics. Do not patch the
  TypeScript 6 API package.
- `tsconfig.base.json` loads the plugin named `@effect/language-service`
  (the tsgo package still uses that plugin name).
- Agent extracts live in `.agents/patterns/` and cite `repos/effect`. They
  are not a second copy of docs concept pages (D30).
- Pin `effect-solutions` as a root exact devDependency. Invoke with
  `pnpm exec effect-solutions`. No global install, no home clone.
- `vendor/motel` stays the isolated motel runner. Do not mix it with `repos/`.

Revisit the dual TypeScript pin in a new ADR when 7.1 ships a stable API
and Nx plus typescript-eslint declare support. Revisit Oxlint / Vite Plus
only after a measured gap (ADR-0027).

## Trade-offs

The subtree adds tens of megabytes and a periodic `git subtree pull`. That
is the cost of a clone-identical Effect source for humans and agents.
Keeping ESLint is required for Nx module boundaries and D26. Effect
diagnostics ride on `tsc`, which verify already runs.

## Failure-handling

`repos/` is ignored by ESLint, Nx plugins, lint-scope, and ownership.
Importing from `repos/` is forbidden. `pnpm verify` is the qualifying gate.
`msgpackr-extract` is listed in `pnpm-workspace.yaml` `allowBuilds` as
`false`: it is an optional native addon pulled by `effect-solutions`, not
needed to run `pnpm exec effect-solutions`. Unperformed: Cursor Native
Preview using the patched tsgo binary; Oxlint.

## Outcome

### Expected

Agents read `repos/effect/LLMS.md` before writing Effect. `tsc` reports
Effect diagnostics. Verify stays green. Motel remains isolated under
`vendor/`.

### Observed

2026-09-21. `pnpm exec tsc --version` is `7.0.2+effect-tsgo.0.45.0`.
`repos/effect` is a squashed subtree of `Effect-TS/effect` `main` (~53M).
Nx still lists 24 projects (none under `repos/`). `mise exec -- pnpm verify`
was GREEN (12 checks). Effect `error` and `warning` diagnostics failed
typecheck until `Effect.fn` parameters, `return yield* Effect.never`, and a
tagged rollback error were fixed; remaining Effect messages are suggestions
and do not fail `tsc`.
