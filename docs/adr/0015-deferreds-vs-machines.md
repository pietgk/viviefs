# ADR-0015: Human steps as deferreds; workflows own progress

Summary: A human step is a durable deferred in the workflow; machines and atoms own only ephemeral interaction.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P06 Workflow engine crash matrix][P06], [P09 Sync][P09]

Related: [D11 Human steps as deferreds][D11], [D40 Server-side human steps][D40]. [ADR 0012](0012-datom-backed-workflow-engine.md),
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

This split shrinks machines to interaction state (input to [P08 UI three-way prototype][P08]) instead of
competing with Effect Workflow for durable progress. The cost is that UI
cannot stash durable progress in component state.

## Failure-handling

[P06 Workflow engine crash matrix][P06] covers deferred waits in the crash matrix. [P09 Sync][P09] covers deferred completion
from the server.

## Outcome

### Expected

Resume is "waiting for step X", never "half a screen of XState". Reviews are
datoms.

### Observed

2026-09-20. [P06 Workflow engine crash matrix][P06]: kill during a deferred wait resumed at "waiting for approval";
completing the deferred continued the workflow. Evidence:
[2026-09-20-p06.md](../evidence/2026-09-20-p06.md).

2026-09-22. [P09 Sync][P09]: the server appends a self-committed deferred exit
(`server.deferred`, no device lease). The waiting device pulls that datom and
`Wait` finishes `{ok: true}`. The server does not run the workflow. Not
Accepted. Evidence:
[2026-09-22-p09.md](../evidence/2026-09-22-p09.md).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D11]: ../plan/bootstrap/02-decision-log.md#d11
[D40]: ../plan/bootstrap/02-decision-log.md#d40
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
