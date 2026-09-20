# ADR-0024: Repository structure

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: verify (boundary lint)

Related: D19, D52-D57. [Repo structure](../plan/bootstrap/04-repo-structure.md).

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

Ownership: every `project.json` declares tags and its evidence owner.
Unclassified projects fail verify.

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

Not yet run until the Nx skeleton lands and verify exists.
