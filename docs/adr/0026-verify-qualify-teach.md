# ADR-0026: Verify - Qualify - Teach

Status: Proposed, unverified

Date: 2026-09-20. Amended 2026-09-29: a pattern is accepted on its guide.
Amended again 2026-09-29 (Docs and teaching grilling): verify and qualify are
separated by what a check needs, not by speed; acceptance needs current gates.

Qualifying gate: none (process). The pattern is the process; later ADRs are
qualified under it.

Related: D28-D30, D46, D48', D59-D74.
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
fact can fail independently). P11-P17 are follow-on, not foundation closure.
A stage closes only with one sequential full run on unchanged committed
inputs.

**Teach**: docs site in the effect.website shape; exercises (stub + failing
test + reference solution that passes in verify); lessons that cite gate
evidence and never become the source of a claim. One source: docs pages
canonical, `AGENTS.md` a map, skills thin procedures.

Delivery: accepted ADR with evidence, green exemplar, concept page, exercise,
lesson, and a link from the exemplar to that teaching material.

**Acceptance is on the guide** (amendment 2026-09-29). A pattern's teaching
material is its guide: what people and agents use to discuss, design,
implement and review work that uses the pattern. Accepting only the decision
before the guide exists reviews the wrong thing, so the lifecycle is
`Proposed, unverified` -> `Qualified` (gate evidence linked) -> `Accepted`
(a human accepted the pattern's guide). `Taught` is no longer a separate
status; it is part of acceptance.

Every guide follows one guide template. Its shape is found in Docs and
teaching: drafted on the log store (P04, P05), then tried on durable workflow
(P06, P07) and identity (P11), which differ from it on purpose. When a later
guide shows the template is wrong, the template changes and the guides
already written are brought up to date in the same change, so every guide
keeps one shape. Lessons still cite gate evidence and never become the source
of a claim.

**What separates verify from qualify** (amendment 2026-09-29, Docs and
teaching, D70). Not speed: the crash matrix takes 6 s, a device gate
minutes. Verify runs every check that needs only the host (Node, jsdom or a
headless browser, in-process SQLite or PGlite; no container, no device),
checks the code's contract on every change, and changes no file. Qualify
establishes a claim and records it in the ledger; device and lab legs run
only there. A probe's host part is one function both call: verify runs it as
a check, qualify records it as the claim. There is no third mode. `pnpm
verify baseline` is the one command that writes the lockfile. Time is
reported, not gated.

**Acceptance needs current gates** (D63). Before a guide is recorded as
accepted, its gates run and pass on that commit, and the commit names the
ledger run. `verify` checks that guide and ADR statuses agree; it does not
read the ledger.

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
delivered until its guide is accepted.

### Observed

Verify and Qualify are in use: `pnpm verify` gates every change, and
`pnpm qualify` recorded P01-P11 in the ledger, closed by one sequential run on
2026-09-28 ([closure note](../evidence/2026-09-28-p01-p11-closure.md)). Teach
has not started: no guide exists, so no pattern is delivered yet.

2026-09-29, Docs and teaching grilling. Three places where the build does less
than this ADR and D48' say, recorded as decisions with a place in the
Schedule: evidence owners are declared per project but not checked against
what runs, and there is no coverage lockfile (D71); the crash matrix runs only
in P06, not in verify (D71); the `ui` stage's `storybook` step is Vitest with
jsdom, and no story runs in a real browser or on a device (D72).
