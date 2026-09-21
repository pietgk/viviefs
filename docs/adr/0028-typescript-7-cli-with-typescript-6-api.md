# ADR-0028: TypeScript 7 CLI with TypeScript 6 API

Status: Proposed, unverified

Date: 2026-09-21

Qualifying gate: verify

Related: D49, [ADR-0027](0027-developer-experience-planes.md). Prepares
`@effect/tsgo` (not admitted in this change). Microsoft dual-install:
https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/. Nx
guide: https://nx.dev/docs/kb/typescript-7.

## Problem

TypeScript 7 is the native compiler and the path to Effect-aware diagnostics
(`@effect/tsgo`). TypeScript 7.0 does not ship a stable programmatic API.
Nx (`@nx/js/typescript`), typescript-eslint, Vite and vitest still
`require('typescript')` and call 6.x entry points such as `readConfigFile`.
Installing `typescript@7` under the `typescript` name breaks the project
graph and lint.

## Design

Pin both compilers exactly in the root `package.json`:

- `@typescript/native`: `npm:typescript@7.0.2`. Provides `tsc` for Nx
  `typecheck`.
- `typescript`: `npm:@typescript/typescript6@6.0.2`. Provides `tsc6` and the
  6.x API under the `typescript` package name.

Do not collapse this to `typescript@7` until TypeScript 7.1+ ships a stable
API and Nx, typescript-eslint and Vite declare support. Revisit then as a
new ADR.

Editor language service stays on the aliased TypeScript 6 `tsserver`. Cursor
cannot select workspace TypeScript 7 via `typescript.tsdk` (no `tsserver.js`).
CLI typecheck (`pnpm typecheck` / `tsc`) is TypeScript 7.

## Trade-offs

Dual pins are non-obvious. A later agent may "simplify" to `typescript@7`
and break verify. Documenting the topology in `AGENTS.md` is the safeguard.
Waiting for 7.1 would delay the native checker and `@effect/tsgo`. Taking
7.1 beta would mix an unstable API into the host toolchain.

## Failure-handling

`pnpm exec tsc --version` must report 7.0.2. `pnpm exec tsc6 --version` must
report 6.x. `require('typescript').readConfigFile` must remain a function.
`pnpm verify` is the qualifying gate: `nx sync:check`, typecheck, lint and
tests. Unperformed: `@effect/tsgo` install and editor Native Preview.

## Outcome

### Expected

`tsc` typechecks the workspace on TypeScript 7. Nx, ESLint and Vite keep
the TypeScript 6 API. Verify is green.

### Observed

2026-09-21. `pnpm exec tsc --version` is 7.0.2. `pnpm exec tsc6 --version` is
6.0.3 (`@typescript/typescript6@6.0.2` wraps `typescript@^6`).
`require('typescript').readConfigFile` is a function. `mise exec -- pnpm verify`
was GREEN (12 checks: sync, typecheck, lint, lint-scope, ownership, audit,
unit, integration; ui/quality targets skipped as undeclared).
