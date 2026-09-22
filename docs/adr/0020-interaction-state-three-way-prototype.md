# ADR-0020: Interaction state: outcome of the three-way prototype

Status: Qualified

Date: 2026-09-20

Qualifying gate: P08

Related: D12. [ADR 0015](0015-deferreds-vs-machines.md),
[ADR 0019](0019-ui-state-ownership-and-query-atoms.md).

## Problem

The ecosystem has not settled on XState vs Effect for interaction state.
Argument will not pick a winner faster than real code. After D11, machines
shrink to ephemeral interaction, which changes the comparison.

## Design

Settle XState vs Effect by one prototype built three ways, after D11:

1. XState v5 + Effect (via `fromPromise`)
2. `@typeonce/effect-machine`
3. Plain Effect + Atom

One screen of the evidence flow, with ADR 0019's three state owners and query
atoms. Compared on type safety, test and story ergonomics, and lines of code.
All three variants must pass the same screen tests and stories. This ADR
records the winner once P08 passes.

Product-specific criteria (voice, affordance) stay out (D55). The probe
recorded Effect + Atom on file LOC and sharing query atoms. Human review
in [p08-comparison.md](../evidence/p08-comparison.md) copies
**IntentComposer** in **effect-machine**, on typing (illegal states
unrepresentable, Effect errors kept) and a generated mermaid graph that
verify can check. XState and Atom stay retained probes behind the session
seam. Query atoms stay Atom (D42). Acceptance is a separate status.

## Trade-offs

Building the screen three times is cost; picking from blogs is cheaper and
wrong. `@typeonce/effect-machine` is a single-maintainer project; interaction
state is a pattern behind a contract.

## Failure-handling

A variant that cannot render the screen and pass those tests fails the study.
The harness is broken if nothing can fail.

## Outcome

### Expected

One recorded winner with linked P08 evidence. Feature IntentComposer uses
that winner; the other two variants remain retained probes.

### Observed

2026-09-21. Ledger pass `2026-09-21T19-08-57.550Z-921495ef`. Probe axes
(file LOC, sharing query atoms) named Effect + Atom. Driver LOC: Atom 76,
XState 113, effect-machine 173. All three passed the same contract, screen
tests and stories; the broken variant failed `confirm reaches idle`. Query
atoms used prefix/attribute Reactivity keys. Evidence:
[2026-09-21-p08.md](../evidence/2026-09-21-p08.md).

2026-09-22. Human review of
[p08-comparison.md](../evidence/p08-comparison.md). Encoding to copy:
`@typeonce/effect-machine`. Pattern name: IntentComposer (composing |
reviewing | submitting). Generated mermaid is part of the pattern; XState
JSON viz remains a future option. No OTLP on the composer; only durable
command / workflow is traced. Ephemeral UI inspection is a devTool next to
screen-view and status, not live `withSpan` on states. The exemplar is
renamed to IntentComposer (`composing` | `reviewing` | `submitting`,
`candidateHash`). The teaching page is `intent-composer.md`, generated from
`intentComposerGraph` (state diagram, then the effect-machine Confirm
sequence). Re-qualified `2026-09-22T11-51-27.689Z-d7884f03` after that page
replaced `intent-composer.mmd`. Rename pass
`2026-09-22T11-35-35.936Z-b49dc64b`. Driver LOC on the rename run:
effect-machine 200, XState 113, Atom 77. XState and Atom remain retained
probes. Query atoms stay Atom.
