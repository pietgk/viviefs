# ADR-0024: Repository structure

Summary: Four project kinds (apps, features, libs, tools), three tag dimensions, boundaries enforced by lint.

Status: Qualified (boundaries, ownership, lint scope). Generators unverified

Date: 2026-09-20. Amended 2026-09-30 (Evidence ownership design review): where
tests and suites live; per-file evidence replaces the per-project evidence owner.

Qualifying gate: verify (boundary lint)

Related: D19, D52-D57, D75-D80. [Repo structure](../plan/bootstrap/04-repo-structure.md).

## Problem

Without enforced kinds, layers and platforms, Node lands in Hermes and RN
lands on the server. Features import each other's UI. Apps grow business
logic. Path aliases hide the public API.

## Design

Four kinds: `apps/` (thin composition roots) -> `features/` -> `libs/`, plus
`tools/`. Nothing imports an app or a tool at runtime. Apps provide all
implementations as Layers; a feature's `R` type declares what it needs, so a
missing context is a compile error. A feature must not import an adapter.

A feature is a vertical slice split into `model`, `client`, `server` projects.
Features share only their `model`. Native vs web inside client adapters by
`.native.ts` / `.web.ts`.

Three tag dimensions enforced by `@nx/enforce-module-boundaries`: `kind:`,
`layer:`, `platform:`. A lint-scope meta check fails when a file escapes lint.

pnpm workspaces + Nx current TypeScript setup: TS project references,
`package.json` `exports` as each project's public API (no deep imports, no
path aliases), Nx sync generators, inferred tasks. Free module-boundary rule
(no paid Powerpack). Every project is `@viviefs/<name>`.

Ownership: every `project.json` declares tags; unclassified projects fail
verify. Evidence is owned per file, in the registry (amendment 2026-09-30,
D76, ADR-0026).

**Where tests live** (amendment 2026-09-30, D80). A suite ships with the
contract it checks: `src/suites/<aspect>.ts` in the lib that owns the
contract, exported as `@viviefs/<lib>/suites`, importable only by tests, other
suites, `tools/` and the evidence apps. `libs/testing` holds generic helpers
and depends on no `@viviefs` lib, so no lib sits below a hub of suites and no
test dependency can form a cycle. A suite runs in the project of the
implementation under test (`src/<pattern>-<aspect>.integration.test.ts`).
Unit tests, integration tests and stories sit next to the code they cover;
probes and device journeys in `tools/qualification`; web journeys in the
app's `e2e/`; exercise tests with the exercise.

Generators (`feature`, `lib`, `workflow`, `screen`, `exercise`) make the right
shape the easy path. Lib, generator and evidence-owner names in the plan are
indicative; scaffolding may refine them without changing these rules.

## Trade-offs

More projects than a single package. The boundary rules are the point. Nx
Powerpack is rejected so enforcement stays on the free rule.

## Failure-handling

verify's static stage runs typecheck, lint (including module boundaries),
lint-scope, and the ownership registry check. An unclassified project or a
file outside lint fails the stage.

## Outcome

### Expected

Illegal imports fail lint. Apps compose Layers. Public API is `exports`.

### Observed

2026-09-29, in `verify`'s unit stage ([`guardrails.test.ts`](../../tools/verify/src/guardrails.test.ts)). Module boundaries refuse a lib
importing an app, a client feature importing an adapter, universal core code
importing a server adapter, and core code importing the testing lib (where
the fake issuer lives); core importing core passes. The ownership check fails
a workspace package without a `project.json` and a project without a `kind:`
tag or evidence owner, and passes a classified one. The lint-scope check fails
a source file no configuration covers. Each runs on a throwaway repository
with the defect, next to one without it. `pnpm verify` is green on the repo
(25 projects classified).

2026-10-01, Evidence ownership (D75-D80). The ownership step now fails a
production file without a registry entry, a stale or duplicate entry, an empty
rationale, a shape its file treatment does not allow (a "re-export" with code,
a "named slot" that is not `export {}`, an unknown gate or suite), and a
`project.json` that still declares `evidenceOwner`
([`ownership.test.ts`](../../tools/verify/src/ownership.test.ts)). Suites moved
to their contracts; core code may still not import `@viviefs/testing`, a suite
may, and production code that imports a `suites` entry fails lint (D80
guardrail tests). `pnpm verify all` is green with 226 production files
classified.

Not verified: the generators (`@viviefs/generators` is an empty slot until
Docs and teaching), and that a feature missing a Layer fails to compile (no
feature composes Layers yet).
