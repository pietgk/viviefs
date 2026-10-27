# I15: Identity, keys and trust

Status: ready-for-human

Category: enhancement

Decide when: an app needs proof of who wrote what (the first consumer app that makes audit claims), or a `node` accepts from a peer ([I60 Server-independent mode][I60])

## What

Stored history is trusted, not provable: `actor` is a server-checked label, not a signature, `envelope.device` is not authenticated, and who may take over a lease is unspecified. This merges tamper-evidence of stored history and signed changesets ([P11 Identity][P11] grilling Q15).

## Direction

Research inputs: vivief (per-device keypairs, device links as datoms, transport identity kept apart from authorization, Holochain considered) and Holochain from primary sources. Candidate direction: a hash chain with device-held checkpoints, device keys linked to a person, signed changesets. Until then the server log is never compacted, and crypto-shredding hashes stored ciphertext ([P11 Identity][P11] grilling Q15, Q23, Q24). Explainer: [identity, keys and trust](../research/2026-09-28-identity-keys-and-trust.html).

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) adds `origin` to the envelope ([D58' Envelope names the origin][D58'], [D115 Origin trust][D115], [ADR-0034](../adr/0034-origin-trust.md)): a reference to the origin entity the content came from, apart from the actor. Signing the envelope, when decided here, covers the origin too ([D105 What must stay possible][D105] (5)).

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D155 A hash chain per organization][D155], [D156 Levels of proof of authorship][D156], [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]: narrowed. Tamper-evidence no longer waits here: a hash chain per organization is built in phase 3 ([I85 Build the hash chain][I85]). What stays is the **signed** level: device keys, their binding to an identity (a fact in the chain, so a key added in someone's name is visible to their devices), the authored bytes the chain already pins, key loss, rotation and recovery, and peer validation (`vivief:peer-validation-as-contract`, with [I60 Server-independent mode][I60]). Every device signs in through OIDC on its own; vivief's device link waits for the **signed and bound elsewhere** level. Who may take over a run is answered by [ADR-0036 The journal is the fence][ADR-0036]. `Decide when:` changed to match.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[ADR-0038]: ../adr/0038-tamper-evidence-and-proof-of-authorship.md
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I60]: 0060-server-independent-mode.md
[I85]: 0085-build-the-hash-chain.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
