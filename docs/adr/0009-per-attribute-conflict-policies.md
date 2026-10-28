# ADR-0009: Per-attribute conflict policies

Summary: Each attribute declares how concurrent writes resolve: last writer wins, write-once fenced, or a human decides.

Status: Qualified

Date: 2026-09-20

Qualifying gate: [P05 Changesets and projections][P05]

Related: [D34 Per-attribute conflict policies][D34], [D34' Per-attribute conflict policies, decided at accept][D34'], [D144 A set is entities][D144], [D147 User content outside the journal][D147], [D148 Quarantine is rejected user content][D148]. [Architecture section 6](../plan/bootstrap/03-architecture.md). [I53 Sync and conflict][I53], [I81 Build conflicts decided at accept][I81].

## Problem

One global LWW rule is wrong for GRC, ERP and the journal. Journal facts and
lease grants must not be overwritten. User content and approvals must not
silently drop a value.

## Design

Conflict policy is declared per attribute in its Schema:

| Policy | Used for | Behaviour |
| --- | --- | --- |
| LWW | domain scalars | highest commit `tx` wins |
| write-once, fenced | journal facts, durable deferred completions, lease grants, changeset commit/abort | first valid write under a valid lease wins; others rejected |
| human conflict | references, evidence attachments, approvals, user content | both values kept; a conflict datom raised; a person resolves |

The conflict-datom attribute name is `viviefs/conflict`. [P05 Changesets and projections][P05] materialises
conflicts in `projection_conflicts`; authority writes them as log datoms ([D34' Per-attribute conflict policies, decided at accept][D34']).

**Decided at accept** (amendment 2026-10-26, [D34' Per-attribute conflict policies, decided at accept][D34'], [D144 A set is entities][D144], [I53 Sync and conflict][I53]). A commit's basis
is the sync cursor its writer had pulled when the command ran. The `node`
holding authority decides a human conflict at accept: a fact for the same
entity and attribute accepted after the basis from another device is a
conflict (the writer's own earlier outbox is not), and authority appends a
`viviefs/conflict` fact in the same step as the changeset, so every `node`
shows the same conflict. Projectors read conflicts from the log; a device may
show a preview. An orphan (user content whose owner is not visible) is decided
at accept too, with [I69 Accept checks every change][I69]'s read model. Per value, the later of its assert and
retract wins: a replace writes "retract old, assert new", so one writer leaves
one value and two concurrent replaces leave both, marked by the open conflict;
a resolving command retracts the values not chosen and closes the conflict.
There is no cardinality: an attribute holds one value, and a set is an entity
per member ([D144][D144]). Built by [I81 Build conflicts decided at accept][I81]; until it qualifies [P05 Changesets and projections][P05] and [P09 Sync][P09] again
with two devices, this amended design is Proposed, unverified.

## Trade-offs

Per-attribute policy is more to declare than global LWW, and it is the only way
the journal and GRC/ERP references stay honest. Quarantine of user content
after a lost lease ([D15 Server authority after a lost lease][D15]) is likely a human-conflict datom plus a review
surface; the mechanism is unspecified until after [P05 Changesets and projections][P05]/[P09 Sync][P09]. Decided in [I53 Sync and conflict][I53]: quarantine
keeps the user content of a rejected changeset on the device ([D148 Quarantine is rejected user content][D148]), not as a
conflict datom, because the content never reached the log.

Deciding at accept puts one more read (facts for the touched attributes after
the basis) into accept. Out-of-scope items: none made harder; any `node`
holding authority decides ([D105 What must stay possible][D105]).

## Failure-handling

[P05 Changesets and projections][P05] runs the basis check under all three policies. A write-once collision
rejects; a human-conflict collision keeps both and raises a conflict datom.

## Outcome

### Expected

No silent loss of user content. Journal facts are fenced. Scalars LWW.

### Observed

2026-09-20. Ledger pass `2026-09-20T19-57-57.045Z-1dba2339`. Basis LWW kept the
highest commit `tx`; write-once accepted the first seal and rejected the
second; human-conflict kept both file values and raised `viviefs/conflict`.
Evidence: [2026-09-20-p05.md](../evidence/2026-09-20-p05.md).

2026-10-26, found in [I53 Sync and conflict][I53] by reading the code. [P05 Changesets and projections][P05] showed the three policies in
one projector on one store. Across `node`s, human conflict is not built as
decided: the basis is a `seq` in whichever log projects it, and every
changeset outside [P05][P05] sends `0`; a conflict is a `projection_conflicts` row
each projector derives and a rebuild deletes, never a log datom; the server
checks write-once only (`BasisRejected`) and has no projector; and the reduce
keeps every asserted value of a human-conflict attribute and ignores retracts,
so a replace keeps both values and no command can resolve a conflict. No gate
put two devices on human conflict. [D34' Per-attribute conflict policies, decided at accept][D34'] and [I81 Build conflicts decided at accept][I81] fix it. Status stays Qualified
for the three policies on one store.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D144]: ../plan/bootstrap/02-decision-log.md#d144
[D147]: ../plan/bootstrap/02-decision-log.md#d147
[D148]: ../plan/bootstrap/02-decision-log.md#d148
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D34]: ../plan/bootstrap/02-decision-log.md#d34
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[I53]: ../issues/0053-sync-and-conflict.md
[I69]: ../issues/0069-accept-checks-every-change.md
[I81]: ../issues/0081-build-conflicts-decided-at-accept.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
