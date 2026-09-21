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

Product-specific criteria (voice, affordance) stay out (D55). After P08 the
interaction-state library is Effect + Atom. XState and effect-machine stay
as retained probes behind `CaptureSession`.

## Trade-offs

Building the screen three times is cost; picking from blogs is cheaper and
wrong. `@typeonce/effect-machine` is a single-maintainer project; interaction
state is a pattern behind a contract.

## Failure-handling

A variant that cannot render the screen and pass those tests fails the study.
The harness is broken if nothing can fail.

## Outcome

### Expected

One recorded winner with linked P08 evidence. Feature interaction state uses
that winner; the other two variants remain retained probes.

### Observed

2026-09-21. Ledger pass `2026-09-21T19-08-57.550Z-921495ef`. Winner: Effect +
Atom (`effect/unstable/reactivity/Atom`). Driver LOC: Atom 76, XState 113,
effect-machine 173. All three passed the same capture contract, screen tests
and stories; the broken variant failed `confirm reaches idle`. Query atoms
used prefix/attribute Reactivity keys. Evidence:
[2026-09-21-p08.md](../evidence/2026-09-21-p08.md).
