# ADR-0015: Human steps as deferreds; workflows own progress

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P06, P09

Related: D11, D40. [ADR 0012](0012-datom-backed-workflow-engine.md),
[ADR 0020](0020-interaction-state-three-way-prototype.md).

## Problem

A killed app must resume at "waiting for step X" and rebuild the UI. Mixing
durable business progress with ephemeral interaction state (machines, form
focus) makes resume a merge problem. A reviewer on the web must complete a
device workflow without the server running that workflow's code.

## Design

A human step is a `DurableDeferred` inside the workflow. **Workflows own
durable business progress; machines and atoms own ephemeral interaction.** A
killed app resumes at the deferred; the UI rebuilds from read models plus
interaction state from scratch.

Server-side human steps (a reviewer approves on the web) write a
deferred-completion datom under `O{org}/W{exec}/D{name}` in the same changeset
as the review. It syncs down; the device engine resumes. Push is only a
wake-up hint. Signals become ordinary datoms: deduplicated, fenced, traced,
auditable.

## Trade-offs

This split shrinks machines to interaction state (input to P08) instead of
competing with Effect Workflow for durable progress. The cost is that UI
cannot stash durable progress in component state.

## Failure-handling

P06 covers deferred waits in the crash matrix. P09 covers deferred completion
from the server.

## Outcome

### Expected

Resume is "waiting for step X", never "half a screen of XState". Reviews are
datoms.

### Observed

Not yet run.
