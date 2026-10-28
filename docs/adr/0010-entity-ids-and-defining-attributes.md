# ADR-0010: Entity ids, defining attributes and strict-composition prefixes

Summary: Entity ids encode their parent only for strict composition; a defining attribute makes an entity exist.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P05 Changesets and projections][P05]

Related: [D38 Entity ids and strict composition][D38], [D120 Minted and derived id segments][D120], [D122 External identifiers][D122]. [Architecture section 5](../plan/bootstrap/03-architecture.md).

## Problem

Hierarchical ids give cheap tree deletes and prefix scans, and they freeze
parentage: an id that encodes a parent cannot move. GRC and ERP have entities
that move (a finding reassigned, a line moved). A single rule for all ids is
wrong.

## Design

Entity ids encode their parent **only for strict composition**: part of the
parent, shared lifetime, can never move. Declared per entity type. Guideline:
"can it ever move? then it is a reference".

- Root: `O{org}/...`. Organization is the isolation unit.
- Composition examples: list -> todo, order -> line, execution -> journal
  entries (`O{org}/W{exec}/A{activity}#{attempt}`), durable deferreds
  (`O{org}/W{exec}/D{name}`).
- Everything else uses reference attributes.

Separator `/`. Ids are branded Schema types.

**Defining attribute:** one per entity type. Asserted = exists, retracted =
deleted (subtree hidden), re-asserted = restored with its other attributes.

**Projection rule:** visible iff the defining attribute is asserted and the
owner (id parent or owner reference) is visible. Orphaned writes to
user-content types raise a human conflict (never silent loss).

Prefix power: authorization, compaction, export and Reactivity keys all work by
prefix. First sync is full-store per organization (one sync cursor), not prefix
subscriptions.

**Server-only roots** (amendment 2026-09-27, [P11 Identity][P11] grilling; qualified by [P11][P11]).
Facts that belong to no organization live in the server's log under a root
other than `O{org}/` and are never replicated. The first is the account
entity `A{sha256(iss, sub)}`, which maps an identity-provider account to a
person ([ADR-0022](0022-identity-and-organization-isolation.md)). Existing
prefix rules already keep such roots on the server: a client changeset with an
entity outside the requested organization is refused (`OrgMismatch`), and
`Pull` only sends changesets that touch the organization. Rule: a
server-authored changeset never mixes a server-only root with organization
entities, because `Pull` sends every member of a changeset that touches the
organization.

**Minted and derived segments** (amendment 2026-10-08, [D120 Minted and derived id segments][D120], [I52 The datom and its store][I52]; built with
[I67 Minting entity id segments][I67]). Each segment of an id is minted or derived, declared per entity type in
the catalog. A minted segment comes from the HLC's encoder
([ADR-0007](0007-hybrid-logical-clock.md)): any `node` mints offline, the device fingerprint keeps
two `node`s apart, and segments sort by creation, as `tx` does
(`Oacme/L01JC8Z4K7M0001A3F9QX2B7KDE`). A derived segment is computed from what
identifies the thing, wherever every copy must compute the same id: membership
`M{person}`, the account `A{sha256(iss, sub)}`, journal entries. vivief's flat
ULID ids are not adopted: the path carries isolation, tree deletes,
compaction, Reactivity keys and partial sync on demand ([D114 Partial sync on demand][D114]). An external
identifier, such as a company's KvK number, is an attribute, never a segment
([D122 External identifiers][D122]).

## Trade-offs

Keeps one-datom tree deletes where composition is real, avoids immutable ids
that cannot move. The cost is a per-type declaration and the discipline of the
guideline.

## Failure-handling

[P05 Changesets and projections][P05]: defining-attribute lifecycle, prefix-id cascade, orphan conflict.
Positive control lives with changesets ([P05][P05]).

## Outcome

### Expected

`O{org}/` is the backbone for isolation and sync. Moveable things are
references.

### Observed

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Retracting a
defining attribute hid the entity; re-asserting restored its other attributes.
Retracting a list hid composed items; restoring the list restored them. A
user-content write under a deleted owner raised an orphan conflict rather than
dropping the write. Evidence:
[2026-09-20-p05.md](../evidence/2026-09-20-p05.md).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D114]: ../plan/bootstrap/02-decision-log.md#d114
[D120]: ../plan/bootstrap/02-decision-log.md#d120
[D122]: ../plan/bootstrap/02-decision-log.md#d122
[D38]: ../plan/bootstrap/02-decision-log.md#d38
[I52]: ../issues/0052-the-datom-and-its-store.md
[I67]: ../issues/0067-minting-entity-id-segments.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
