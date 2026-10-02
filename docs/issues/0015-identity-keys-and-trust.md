# I15: Identity, keys and trust

Status: ready-for-human

Category: enhancement

Decide when: before the first consumer app that makes audit claims, as one research and grilling step, with P16

## What

Stored history is trusted, not provable: `actor` is a server-checked label, not a signature, `envelope.device` is not authenticated, and who may take over a lease is unspecified. This merges tamper-evidence of stored history and signed changesets (P11 grilling Q15).

## Direction

Research inputs: vivief (per-device keypairs, device links as datoms, transport identity kept apart from authorization, Holochain considered) and Holochain from primary sources. Candidate direction: a hash chain with device-held checkpoints, device keys linked to a person, signed changesets. Until then the server log is never compacted, and crypto-shredding hashes stored ciphertext (P11 grilling Q15, Q23, Q24). Explainer: [identity, keys and trust](../research/2026-09-28-identity-keys-and-trust.html).

## Comments
