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

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D148]: ../plan/bootstrap/02-decision-log.md#d148
[I53]: 0053-sync-and-conflict.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
