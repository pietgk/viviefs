# ADR-0012: Durable execution over one datom-backed engine

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P06

Related: D2, D10, D39. [Architecture section 9](../plan/bootstrap/03-architecture.md),
[research/01](../plan/bootstrap/research/01-effect-v4-durable-execution.md).

## Problem

Device and server need the same Temporal-style model (workflows, workers,
retryable activities, replay from stored activity results). Effect Cluster is
the scale-out path, not the on-device path. Inventing a parallel workflow API
would split the stack.

## Design

Use Effect's `Workflow` / `Activity` / `DurableDeferred` / `DurableClock` API
everywhere, over **our** implementation of `WorkflowEngine.Encoded` that stores
everything as datoms. One engine, one journal format, on device and server.
Effect Cluster (`ClusterWorkflowEngine`) is the later scale-out path behind the
same interface.

Workflows are versioned by name (`Inspection.v3`). Effect has no versioning
API. Activity names are unique and stable within a version. Old versions ship
until drained. Activities must not suspend (a suspending activity re-runs on
replay). Time, randomness and ids only inside activities.

Id shapes (`O{org}/W{exec}`, `/A{name}#{attempt}`, `/D{name}`) are decided.
Attribute names for engine facts are illustrative until the P05/P06 vocabulary
pass (D44).

## Trade-offs

Custom engine (estimated 300-600 lines) instead of Cluster-on-device. Cluster
on a killed mobile app is untested territory. Public Effect interfaces only:
no private engine hooks.

## Failure-handling

P06 is the crash matrix: kill before an activity, during it, after it before
the journal write, during a deferred wait, during a clock, during a lease
handoff, and during a content-hash file upload. Every case resumes; every
external effect is observable at most once thanks to idempotency keys.
Positive control: the same matrix on `WorkflowEngine.layerMemory` fails the
durability cases.

## Outcome

### Expected

One workflow API on device and server. Replay is re-run plus journaled exits.
In-memory engine is not durability.

### Observed

Not yet run. The 300-600 line estimate is unverified.
