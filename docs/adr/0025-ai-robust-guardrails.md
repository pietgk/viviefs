# ADR-0025: AI-robust guardrails

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: verify

Related: D26. [ADR 0012](0012-datom-backed-workflow-engine.md),
[ADR 0024](0024-repository-structure.md).

## Problem

Effect cannot catch non-determinism in types. Agents reach for `Date.now()`,
`Math.random()`, raw `Promise`/`async`/`try`, and deep imports. A workflow
without a crash-matrix test is an unverified claim about durability.

## Design

- Effect language service.
- Lint forbids raw `Promise` / `async` / `try` in domain and workflow code.
  Tests stay exempt so `it()`, spawn, and characterization can remain
  `async`.
- Lint forbids `Date.now()`, `Math.random()` and id generation outside
  activities, and forbids `Date.now()` / `Math.random()` in every
  `*.test.ts` / `*.spec.ts` (including integration). Unit tests use
  `TestClock` / `TestRandom`; `it.live` uses Effect `Clock`, not
  `Date.now()`. `new Date()` without arguments is not in this slice.
- Nx boundary tags (ADR 0024).
- Schema at every boundary including SQLite rows.
- Exemplar-first `AGENTS.md`.
- Every workflow ships with a crash-matrix test.

The determinism rule is the one mistake Effect cannot catch in types.

## Trade-offs

These rules are noisy until the first real domain code exists. They still
land with the workspace so new files are born inside them, not migrated later.

## Failure-handling

verify static stage runs the lint rules. Missing crash-matrix tests fail when
the first workflow ships (P06). Unperformed as rules until those ESLint
configs exist.

## Outcome

### Expected

Illegal asynchrony and non-determinism fail lint. Workflows without a crash
matrix cannot be delivered.

### Observed

Not yet run.
