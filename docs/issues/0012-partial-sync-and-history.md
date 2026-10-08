# I12: Partial sync, history consolidation and client data access

Status: ready-for-human

Category: enhancement

Decide when: roles restrict data within an organization, a replica grows too large, or a Presenter needs data its `node` does not hold (D114)

## What

Every device holds its whole organization's log: no prefix subscriptions, no history consolidation, no client-side data access rules.

## Direction

Raised in the P11 grilling (2026-09-27): roles are carried, not enforced, so nothing is brought forward. Server isolation (D18) stays authoritative.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) adds a trigger (D114, [ADR-0033](../adr/0033-the-presenter-pattern.md)): partial sync on demand. A Presenter's query can say what a partial `node` fetches; the facts land in its log and the projector builds the read model, so a read model stays derived from the local log and works offline for what was fetched. This is vivief's subscription filter (`vivief:subscription-as-replication-filter`) as the direction; I53 owns the sync details. A rebuild and range-scan budget at a stated volume is I63's.
