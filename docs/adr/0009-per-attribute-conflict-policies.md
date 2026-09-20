# ADR-0009: Per-attribute conflict policies

Status: Qualified

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

The conflict-datom attribute name is `viviefs/conflict`. P05 materialises
conflicts in `projection_conflicts`; P09 may persist them as log datoms.

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

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Basis LWW kept the
highest commit `tx`; write-once accepted the first seal and rejected the
second; human-conflict kept both file values and raised `viviefs/conflict`.
Evidence: [2026-09-20-p05.md](../evidence/2026-09-20-p05.md).
