# ADR-0009: Per-attribute conflict policies

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P05

Related: D34. [Architecture section 6](../plan/bootstrap/03-architecture.md).

## Problem

One global LWW rule is wrong for GRC, ERP and the journal. Journal facts and
lease grants must not be overwritten. User content and approvals must not
silently drop a value.

## Design

Conflict policy is declared per attribute in its Schema:

| Policy | Used for | Behaviour |
| --- | --- | --- |
| LWW | domain scalars | highest commit `tx` wins |
| write-once, fenced | journal facts, deferred completions, lease grants, changeset commit/abort | first valid write under a valid lease wins; others rejected |
| human conflict | references, evidence attachments, approvals, user content | both values kept; a conflict datom raised; a person resolves |

The conflict-datom attribute name is illustrative until P05.

## Trade-offs

Per-attribute policy is more to declare than global LWW, and it is the only way
the journal and GRC/ERP references stay honest. Quarantine of user content
after a lost lease (D15) is likely a human-conflict datom plus a review
surface; the mechanism is unspecified until after P05/P09.

## Failure-handling

P05 runs the basis check under all three policies. A write-once collision
rejects; a human-conflict collision keeps both and raises a conflict datom.

## Outcome

### Expected

No silent loss of user content. Journal facts are fenced. Scalars LWW.

### Observed

Not yet run.
