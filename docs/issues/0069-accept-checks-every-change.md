# I69: Accept checks every change

Status: ready-for-human

Category: enhancement

Decide when: before the first consumer app's writes, at the latest the app shell ([P12 UI on every platform][P12], [P13 Links and routing][P13]); the gap below exists today

Found: 2026-10-09

## What

The server's accept checks only structure, so a rule that lives in a command never reaches authority: a crafted changeset setting `evidence/list-title` to a blank string is accepted, although `renameList` refuses it on the device. Build [D124 One checkpoint][D124]-[D127 Registered commands][D127]: registered commands with declared writes, an acceptance rule runner in accept judged no worse, and the suite that proves it.

From [I50 Contracts checked as data or by commands][I50] ([ADR-0035 Accepting a change][ADR-0035]). [ADR-0016 Commands, server validation and rejection][ADR-0016]'s Observed section already records that the server "does not re-execute the command"; `accept` in `libs/sync/server/src/server.ts` checks membership, actor, manifest, server-only attributes, organization, catalog, files, lease and write-once.

### What to build

1. **Registered commands** ([D127 Registered commands][D127]): each command registered with a name, an intent Schema, a version name and its declared writes. Accept rejects an unknown command, and a changeset that writes an attribute outside its command's declared set.
2. **Every domain writer through a command** ([D127 Registered commands][D127]): the operator's membership grant and revoke now; enriching activities when they are built ([I64 Build origin trust][I64]). The workflow engine's journal stays the durable-workflow pattern's own.
3. **An acceptance rule runner** in accept ([D125 Acceptance rules][D125]): declarations beside the catalog (required attributes, allowed transitions) and entity rules in code against a read model, so any `node` could run them ([D105 What must stay possible][D105] (2)). Judged no worse ([D126 No worse][D126]): a rule breaks only where it held before the changeset, or for an entity it creates. Commands call the same rules, so the device rejects early with the same typed error.
4. **The suite `changesets/acceptance`**, each rule with a positive control; a rule without one fails `verify`. The first positive control is today's gap: the blank title, moved from `renameList` into the catalog as the value rule of `evidence/list-title`.
5. **Extend and rerun [P09 Sync][P09]**: a changeset that breaks a rule, comes from an unknown command or writes outside its declared set is rejected with a typed error, and the device rebuilds and reapplies its outbox.

[I66 Attribute value types and the typed reference read model][I66]'s value Schemas and [I68 Uniqueness as an acceptance rule][I68]'s uniqueness are acceptance rules too: they plug into this runner and stay their own issues. A rule that names the writer (independent review) is an access decision, [I54 Trust, encryption and who may sign in][I54]'s.

## Comments

2026-10-26: From [I53 Sync and conflict][I53] ([D34' Per-attribute conflict policies, decided at accept][D34'], [I81 Build conflicts decided at accept][I81]): orphans (user content whose owner is not visible, [D38 Entity ids and strict composition][D38]) are decided at accept too, with the read model this issue brings to the server. [I81][I81] builds the rest of conflicts at accept and comes after this issue in phase 3.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[ADR-0035]: ../adr/0035-accepting-a-change.md
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D126]: ../plan/bootstrap/02-decision-log.md#d126
[D127]: ../plan/bootstrap/02-decision-log.md#d127
[D34']: ../plan/bootstrap/02-decision-log.md#d34p
[D38]: ../plan/bootstrap/02-decision-log.md#d38
[I50]: 0050-contracts-checked-as-data-or-by-commands.md
[I53]: 0053-sync-and-conflict.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I64]: 0064-build-origin-trust.md
[I66]: 0066-attribute-value-types.md
[I68]: 0068-uniqueness-as-an-acceptance-rule.md
[I81]: 0081-build-conflicts-decided-at-accept.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
