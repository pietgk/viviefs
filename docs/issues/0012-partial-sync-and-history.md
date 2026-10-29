# I12: Partial sync, history consolidation and client data access

Status: ready-for-human

Category: enhancement

Decide when: roles restrict data within an organization, a replica grows too large, or a Presenter needs data its sync node does not hold ([D114 Partial sync on demand][D114])

## What

Every device holds its whole organization's log: no prefix subscriptions, no history consolidation, no client-side data access rules.

## Direction

Raised in the [P11 Identity][P11] grilling (2026-09-27): roles are carried, not enforced, so nothing is brought forward. Server isolation ([D18 Organization isolation on the server][D18]) stays authoritative.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) adds a trigger ([D114 Partial sync on demand][D114], [ADR-0033](../adr/0033-the-presenter-pattern.md)): partial sync on demand. A Presenter's query can say what a partial sync node fetches; the facts land in its log and the projector builds the read model, so a read model stays derived from the local log and works offline for what was fetched. This is vivief's subscription filter (`vivief:subscription-as-replication-filter`) as the direction; [I53 Sync and conflict][I53] owns the sync details. A rebuild and range-scan budget at a stated volume is [I63 The columnar copy as a Presenter implementation][I63]'s.

2026-10-26: Confirmed by [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), section 6). When the trigger fires, the sync details to decide: what the server sends for a Presenter's query (entity prefixes, [D120 Minted and derived id segments][D120], or attribute namespaces as vivief started); one sync cursor per organization with a filter, or one per query; and how a partial sync node sends a basis for data it holds only in part. Fixed already: a basis is a sync cursor and authority decides conflicts ([D34' Per-attribute conflict policies, decided at accept][D34']), so a partial sync node never has to. `Decide when:` unchanged.

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D150 Access around sync and commands][D150], [D151 The access pattern][D151]: sync's filter is an access decision ([ADR-0037 Access][ADR-0037]). When this fires, "what may this replica receive" is the access pattern's optional search capability, relations as facts are its third step, and the direction for a read scope stands: a strict-composition subtree, with accept refusing a changeset that spans two. If a replica may then hold data its reader may not see, access returns to the read.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0037]: ../adr/0037-access.md
[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D120]: ../plan/bootstrap/02-decision-log.md#d120
[D150]: ../plan/bootstrap/02-decision-log.md#d150
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[I53]: 0053-sync-and-conflict.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I63]: 0063-the-columnar-copy.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
