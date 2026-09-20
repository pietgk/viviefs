# ADR-0026: Verify - Qualify - Teach

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: none (process). The pattern is the process; later ADRs are
qualified under it.

Related: D28-D30, D46, D48'.
[Verify - Qualify - Teach](../plan/bootstrap/05-verify-qualify-teach.md),
[Gates](../plan/bootstrap/06-qualification-gates.md). Principles adapted from
complyj ADR 0006.

## Problem

Passing unit tests does not establish a platform claim. A gate described only
in prose can be marked passed without a probe. Docs that are not type-checked
are slop. Teaching that does not cite evidence becomes the source of the
claim.

## Design

One pattern, three questions, each with its own mechanism.

**Verify** (every change): staged `pnpm verify`, fail fast between stages,
collect all failures within a stage. Stages `static -> unit -> integration ->
ui -> quality` are an elaboration of D48', not a separate grilling answer.
Ownership registry; ratchet lockfile; mobile JS bundle-size budget gated now;
no retries (flakiness is a defect). Vitest + `@effect/vitest` only for unit
and integration. Storybook, Maestro and Playwright remain other layers.
GitHub Actions runs `verify`. Simulator crash E2E is gated before a release,
not on every PR. `verify help` is generated from the executed table. "Done"
is green verify, with a mechanical path rule for docs-only diffs.

**Qualify** (before depending on a claim): numbered gates with retained
probes, positive controls, fingerprinted append-only ledger, sequential full
run. Gate table is code. Unknown gate ids fail. The ledger is a plain file,
not datoms. P01-P10 are the foundation stage (D46's six themes split so each
fact can fail independently). P11-P14 are follow-on, not foundation closure.
A stage closes only with one sequential full run on unchanged committed
inputs.

**Teach**: docs site in the effect.website shape; exercises (stub + failing
test + reference solution that passes in verify); lessons that cite gate
evidence and never become the source of a claim. One source: docs pages
canonical, `AGENTS.md` a map, skills thin procedures.

Delivery: accepted ADR with evidence, green exemplar, concept page, exercise,
lesson, and a link from the exemplar to that teaching material.

## Trade-offs

Two entry points (verify vs qualify) instead of one "CI" script. That keeps
contract checks off the machine-written ledger, and claims off the every-PR
path. The ledger stays a file because you cannot qualify the log store with
evidence stored in the log store.

## Failure-handling

Never loosen a gate to make it pass. Disputes about a gate go to a human.
Failures classified as product, harness, or unsupported environment. No
retries in CI.

## Outcome

### Expected

`pnpm verify` is done. `pnpm qualify` records evidence. A pattern is not
delivered until it is taught.

### Observed

Not yet run. Harness lands in later scaffolding steps.
