# I12: Partial sync, history consolidation and client data access

Status: ready-for-human

Category: enhancement

Decide when: roles restrict data within an organization, a replica grows too large, or a Presenter needs data its `node` does not hold ([D114 Partial sync on demand][D114])

## What

Every device holds its whole organization's log: no prefix subscriptions, no history consolidation, no client-side data access rules.

## Direction

Raised in the [P11 Identity][P11] grilling (2026-09-27): roles are carried, not enforced, so nothing is brought forward. Server isolation ([D18 Organization isolation on the server][D18]) stays authoritative.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) adds a trigger ([D114 Partial sync on demand][D114], [ADR-0033](../adr/0033-the-presenter-pattern.md)): partial sync on demand. A Presenter's query can say what a partial `node` fetches; the facts land in its log and the projector builds the read model, so a read model stays derived from the local log and works offline for what was fetched. This is vivief's subscription filter (`vivief:subscription-as-replication-filter`) as the direction; [I53 Sync and conflict][I53] owns the sync details. A rebuild and range-scan budget at a stated volume is [I63 The columnar copy as a Presenter implementation][I63]'s.

2026-10-26: Confirmed by [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), section 6). When the trigger fires, the sync details to decide: what the server sends for a Presenter's query (entity prefixes, [D120 Minted and derived id segments][D120], or attribute namespaces as vivief started); one cursor per organization with a filter, or one per query; and how a partial `node` sends a basis for data it holds only in part. Fixed already: a basis is a server cursor and authority decides conflicts ([D34' Per-attribute conflict policies, decided at accept][D34']), so a partial `node` never has to. `Decide when:` unchanged.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D120]: ../plan/bootstrap/02-decision-log.md#d120
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[I53]: 0053-sync-and-conflict.md
[I63]: 0063-the-columnar-copy.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
