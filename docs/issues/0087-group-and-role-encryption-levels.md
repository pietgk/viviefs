# I87: Group and role encryption levels

Status: ready-for-human

Category: enhancement

Decide when: an app must keep content from the operator (group), or must keep a value from some members of an organization that syncs whole (role)

Found: 2026-10-27

## What

Only the open and subject encryption levels exist ([D149 Encryption levels][D149]); the group level (the operator stores ciphertext only members can open) and the role level (a key narrower than membership) are named and not designed.

From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), section 10, [ADR-0023 Data at rest and crypto-shredding][ADR-0023]). On either level an acceptance rule checks presence and shape only, because authority cannot read the value. When this fires, decide: key distribution to members and its rotation on a revoked membership (what was opened cannot be recalled); how a member's device gets the keys offline; how erasure combines with a group key; and, for group, with [I60 Server-independent mode][I60]. Effect's `EventLogEncryption` is the group level for one owner, a reference to read first ([D135 Effect's names first][D135]).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0023]: ../adr/0023-data-at-rest-and-crypto-shredding.md
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D149]: ../plan/bootstrap/02-decision-log.md#d149
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I60]: 0060-server-independent-mode.md
