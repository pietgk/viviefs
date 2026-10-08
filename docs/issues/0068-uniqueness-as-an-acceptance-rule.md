# I68: Uniqueness as an acceptance rule

Status: ready-for-human

Category: enhancement

Decide when: an app declares an external identifier

Found: 2026-10-08

## What

No attribute can say that its value is unique among the entities of one organization, such as a supplier's KvK number; build D122's declaration `unique: 'per-organization'`, checked by the `node` holding authority when it accepts a changeset.

From [I52](0052-the-datom-and-its-store.md) (D122). An external identifier is an id another system gives a thing (the KvK number the Dutch Chamber of Commerce gives a company); it is an ordinary attribute that travels with its entity.

### What to build

1. **The declaration** on an attribute in the catalog: `unique: 'per-organization'`, documented as "No two entities of this type in one ViViEfs organization hold the same value". "Organization" means only ViViEfs's isolation unit; examples call the thing a KvK number identifies a company or a supplier.
2. **The acceptance rule**: the `node` holding authority checks it against a read model on accept, written so any `node` could run it (D105 (2)); a duplicate made offline is rejected through the existing path (D36).
3. **A lookup by value**: a read model, typed per I66.

Not here: the scheme's own uniqueness (ViViEfs does not check that a KvK number names one company; two organizations may each hold the same company), and personal external identifiers, which are encrypted per subject; their lookup by value is the blind index noted on I54.

## Comments
