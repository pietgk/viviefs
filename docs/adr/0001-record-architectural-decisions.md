# ADR-0001: Record architectural decisions

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: none (process). This ADR is the template and lifecycle; later ADRs
are qualified by the gates they name.

Related: [D48'](../plan/bootstrap/02-decision-log.md),
[Verify - Qualify - Teach](../plan/bootstrap/05-verify-qualify-teach.md),
[ADR 0026](0026-verify-qualify-teach.md). Copied in spirit from complyj ADR 0001
and its template (expected vs observed, failure handling, evidence links).

## Problem

ViViEfs is built across sessions and is intended to teach architectural reasoning
to humans and LLMs from the same sources. Conversation history is not a durable
record of decisions, constraints, or evidence. A plan without a status lifecycle
cannot tell proposed intent from a qualified fact.

## Design

Store numbered ADRs in `docs/adr/`, using this repository's template and index.
Required sections: Problem, Design, Trade-offs, Failure-handling, Outcome
(expected vs observed). Every ADR starts as `Proposed, unverified` and names the
gate that will qualify it.

Status lifecycle: `Proposed, unverified` -> `Qualified` (gate evidence linked) ->
`Accepted` -> `Taught`. Qualified does not mean admitted. Preserve accepted
rationale; use a superseding ADR when a decision changes.

Create ADRs for consequential architectural decisions. Routine implementation
details do not require one. A fresh session reads the plan, relevant ADRs, and
`CONTEXT.md` before working.

## Trade-offs

Git history shows changes but often omits decision drivers. A single growing
design document obscures historical alternatives. A numbered ADR collection
preserves rationale without a governance service. The cost is keeping the index,
plan, and glossary aligned.

## Failure-handling

Check unique numbering, status/index consistency, and conflicts with the plan
when updating documents. Keep proposed, accepted, implemented and verified
distinct. Missing evidence cannot be replaced with a confident status label.
Never mark a gate passed from prose.

## Outcome

### Expected

Every consequential decision in the grilling (D1-D58) has a home. Agents and
humans can tell intent from evidence. The template's expected/observed split
survives later status changes.

### Observed

Not yet run. The backlog ADRs exist as Proposed, unverified. No gate has
qualified any of them.
