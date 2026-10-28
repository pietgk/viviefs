# I67: Minting entity id segments

Status: ready-for-human

Category: enhancement

Decide when: the first screen that creates an entity

Found: 2026-10-08

## What

Nothing mints the segment of an entity id: `listId(org, list)` in `libs/datom/src/ids.ts` takes the `1` in `Oacme/L1` as an argument, and only the suites call it, with `'1'` and `'9'`, so two offline devices creating a list have no way to get ids that never collide. Build [D120 Minted and derived id segments][D120]: each entity type declares its segment as minted or derived, and minted segments come from the HLC's encoder.

From [I52](0052-the-datom-and-its-store.md) ([D120 Minted and derived id segments][D120], [ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010] amendment of 2026-10-08).

### What to build

1. **A declaration per entity type** in the catalog: `segment: 'minted' | 'derived'`.
2. **Minting** by the HLC's encoder (`libs/datom/src/hlc.ts`): the device fingerprint keeps two `node`s apart and segments sort by creation, as `tx` does. One clock, one mechanism to test.
3. **Derived segments** stay as they are (membership `M{person}`, the account `A{sha256(iss, sub)}`, journal entries), now declared.
4. A conformance case: two `node`s minting offline in the same millisecond never collide, and a derived id is the same on every copy.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0010]: ../adr/0010-entity-ids-and-defining-attributes.md
[D120]: ../plan/bootstrap/02-decision-log.md#d120
