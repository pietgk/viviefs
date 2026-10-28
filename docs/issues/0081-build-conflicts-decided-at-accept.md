# I81: Build conflicts decided at accept

Status: ready-for-agent

Category: enhancement

Found: 2026-10-26

## What

Human conflict is decided by each projector against a basis that means nothing across `node`s, never written as a fact and never resolvable; build [D34' Per-attribute conflict policies, decided at accept][D34'] ([ADR-0009 Per-attribute conflict policies][ADR-0009]) so authority decides it at accept and a command resolves it.

From [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), sections 3-5). As built: the basis is a `seq` in whichever log projects it, and every changeset outside [P05 Changesets and projections][P05] sends `0` (`tools/qualification/src/probes/sync-world.ts`, `apps/evidence-mobile/src/p11-runtime.ts`); a conflict is a `projection_conflicts` row each projector derives and a rebuild deletes (`libs/datom/src/projector.ts`); the server checks write-once only, as `BasisRejected` (`libs/sync/server/src/server.ts`); and `reduceAttribute` keeps every asserted value of a human-conflict attribute and ignores retracts (`libs/datom/src/visibility.ts`), so a replace keeps both values and no command can resolve a conflict. No gate put two devices on human conflict.

### What to build

1. **The basis is the sync cursor.** The sync client gives a command the sync cursor it had pulled for the organization; the commit datom carries it beside the changeset manifest.
2. **Conflicts at accept.** Accept finds a fact for the same entity and attribute accepted after the basis from another device (the writer's own earlier outbox is not a conflict) and appends a server-authored `viviefs/conflict` fact in the same step as the changeset, which needs [I71 An append can land after a revocation][I71]'s fix for one step.
3. **Projectors read conflicts from the log.** `projection_conflicts` becomes a read model of `viviefs/conflict` facts; a device may show a preview before accept.
4. **Per value, the later wins.** For a human-conflict attribute, the later of a value's assert and retract decides whether it is shown; a replace command writes "retract old, assert new".
5. **A resolving command** retracts the values not chosen and closes the conflict.
6. **Orphans at accept**, with [I69 Accept checks every change][I69]'s read model on the server ([D38 Entity ids and strict composition][D38]'s user content whose owner is not visible).
7. **Gates.** [P05 Changesets and projections][P05] keeps its policy checks with the new reduce; [P09 Sync][P09] gains two devices on a human-conflict attribute: concurrent (one conflict, the same on both), sequential (none), resolved (one value on both).

### To design first

- The conflict fact's entity and value shape, and how a resolving command names it.
- How "another device" is read: the envelope's `device`, and what a person's two devices count as.
- The device preview, and what a screen shows while a conflict is open.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0009]: ../adr/0009-per-attribute-conflict-policies.md
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[D38]: ../plan/bootstrap/02-decision-log.md#d38
[I53]: 0053-sync-and-conflict.md
[I69]: 0069-accept-checks-every-change.md
[I71]: 0071-an-append-can-land-after-a-revocation.md
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
