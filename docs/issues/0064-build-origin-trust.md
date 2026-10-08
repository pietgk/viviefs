# I64: Build origin trust

Status: ready-for-human

Category: enhancement

Decide when: the first enriching implementation ([D111 Faster and enriching implementations][D111]) is picked up; it cannot ship without an origin

Found: 2026-10-08

## What

Origin trust is decided but not built: add `origin` to the envelope, origin entities with trust levels, lineage for enriching changesets, trust as companion columns in a frame, and the commit paths, and name the gate that qualifies [ADR-0034](../adr/0034-origin-trust.md).

From [I49](0049-projection-one-concept-or-several-patterns.md) ([D115 Origin trust][D115]-[D117 Trust strategies as commit paths][D117], [D58' Envelope names the origin][D58']). Trust belongs to an origin; a value's trust is derived when read, the least trusted of its origin and its inputs' origins; a person's review raises one changeset; five levels `revoked < untrusted < unreviewed < trusted < verified`, per organization, overrides written only by authority; authoritative, sandboxed and gated commit paths. The claim to qualify: withdrawing trust from one origin changes the trust of every value it produced, and of every value derived from them, in every frame that asks, with no change to the log. Touches [D58 Envelope per changeset][D58]'s envelope ([I15 Identity, keys and trust][I15] for signing it).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D111]: ../plan/bootstrap/02-decision-log.md#d111
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D58]: ../plan/bootstrap/02-decision-log.md#d58
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[I15]: 0015-identity-keys-and-trust.md
