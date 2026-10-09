# I68: Uniqueness as an acceptance rule

Status: ready-for-human

Category: enhancement

Decide when: an app declares an external identifier

Found: 2026-10-08

## What

No attribute can say that its value is unique among the entities of one organization, such as a supplier's KvK number; build [D122 External identifiers][D122]'s declaration `unique: 'per-organization'`, checked by the `node` holding authority when it accepts a changeset.

From [I52](0052-the-datom-and-its-store.md) ([D122 External identifiers][D122]). An external identifier is an id another system gives a thing (the KvK number the Dutch Chamber of Commerce gives a company); it is an ordinary attribute that travels with its entity.

### What to build

1. **The declaration** on an attribute in the catalog: `unique: 'per-organization'`, documented as "No two entities of this type in one ViViEfs organization hold the same value". "Organization" means only ViViEfs's isolation unit; examples call the thing a KvK number identifies a company or a supplier.
2. **The acceptance rule**: the `node` holding authority checks it against a read model on accept, written so any `node` could run it ([D105 What must stay possible][D105] (2)); a duplicate made offline is rejected through the existing path ([D36 Shared commands][D36]).
3. **A lookup by value**: a read model, typed per [I66 Attribute value types and the typed reference read model][I66].

Not here: the scheme's own uniqueness (ViViEfs does not check that a KvK number names one company; two organizations may each hold the same company), and personal external identifiers, which are encrypted per subject; their lookup by value is the blind index noted on [I54 Trust, encryption and who may sign in][I54].

## Comments

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md): uniqueness is an acceptance rule ([D125 Acceptance rules][D125]), run by [I69 Accept checks every change][I69]'s rule runner and judged no worse ([D126 No worse][D126]), so an old duplicate stays editable and is listed as a finding.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D122]: ../plan/bootstrap/02-decision-log.md#d122
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D126]: ../plan/bootstrap/02-decision-log.md#d126
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I66]: 0066-attribute-value-types.md
[I69]: 0069-accept-checks-every-change.md
