# I17: Local deletion after a revoked membership

Status: ready-for-human

Category: enhancement

Decide when: with [P16 Crypto-shredding][P16]

## What

After a membership is revoked, [P11 Identity][P11] keeps the organization's copy on the device, read-only.

## Direction

Deletion is a courtesy, not security; decide it with erasure.

## Comments

2026-10-26: From [I53 Sync and conflict][I53] ([D148 Quarantine is rejected user content][D148]): quarantine keeps the user content of a rejected changeset on the device. When the rejection is `MembershipMissing`, keeping it as new cannot go back to that organization; what the device keeps, and for how long, follows this issue's rules.

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D157 The device after a revoked membership][D157]: after revocation the device keeps the organization's copy read-only; deleting it is a courtesy an app may turn on, never security. The revoked person's quarantined content stays until they discard it or remove the account. The trigger stands.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D148]: ../plan/bootstrap/02-decision-log.md#d148
[D157]: ../plan/bootstrap/02-decision-log.md#d157
[I53]: 0053-sync-and-conflict.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
