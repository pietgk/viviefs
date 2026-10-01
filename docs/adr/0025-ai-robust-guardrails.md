# ADR-0025: AI-robust guardrails

Status: Qualified (lint rules, Schema at every boundary). The per-workflow crash-matrix rule unverified

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

2026-09-29, in `verify`'s unit stage ([`guardrails.test.ts`](../../tools/verify/src/guardrails.test.ts) and
[`d26-tests.test.ts`](../../tools/verify/src/d26-tests.test.ts)). In domain
and workflow code (`features/`, `libs/datom`, `libs/workflow-engine`) lint
refuses `async` functions and arrows, `try`, `Promise`, `Date.now()`,
`Math.random()`, and, added that day, `DateTime.nowUnsafe()`,
`performance.now()`, `randomUUID()` and `getRandomValues()`; the same work
written with Effect passes. The live clock and entropy Layers moved to
`libs/datom/src/clock-live.ts`, the one exempt file, so the rest of the HLC
code stays under the rule. In tests, `Date.now()` and `Math.random()` are
refused and `async` is allowed.

Not verified: "every workflow ships with a crash-matrix test" has no
mechanical check (the one engine has P06's matrix); Schema at every boundary
is a convention, not a rule.

2026-10-01, Evidence ownership (D78, D79). Schema at every boundary is a lint
rule ([`eslint.config.js`](../../eslint.config.js), D79): in production code
under `apps/`, `libs/` and `features/`, a `sql<T>` row type, `JSON.parse`, a
response's `.json()` and `as unknown as` fail, each shown failing and its
Schema form passing in [`guardrails.test.ts`](../../tools/verify/src/guardrails.test.ts).
The 38 `sql<T>` sites decode through row Schemas (`rowsOf` in `libs/datom`);
a row that does not decode fails as the store's `SqlError`. Three double casts
remain as reasoned exceptions (platform globals and op-sqlite's unresolvable
typings); the engine's became `satisfies`.

Correction to the line above: the engine's crash matrix has run in `verify`
since 2026-09-20, through the store projects' integration tests. It now runs
in `libs/workflow-engine` itself, on sqlite-node and PGlite, with the
memory-engine positive control that only P06 ran before, and `verify`'s
evidence step fails when it did not pass. What stays unverified is the
per-workflow harness (D26), designed with the durable workflow guide.
