# ADR-0023: Data at rest and crypto-shredding

Summary: Encryption at rest per app with SQLCipher, and erasure by destroying per-subject keys.

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: [P15 Encrypted store][P15], [P16 Crypto-shredding][P16]

Related: [D50 Data at rest on device][D50], [D51 Crypto-shredding][D51]. [ADR 0011](0011-log-store-pattern.md).

## Problem

GRC probably needs encryption at rest; BirVana does not. The log is
append-only, so GDPR-style erasure cannot delete rows. Both are hypotheses
until their gates and must not constrain other work.

## Design

Data at rest on device: OS file protection as baseline; SQLCipher via
op-sqlite with keys in Keychain/Keystore (expo-secure-store) as a qualified
option per consumer app, passing the same log-store conformance suite.

Erasure via crypto-shredding: attributes marked `:personal` store values
encrypted with a per-subject key; erasure destroys the key; projections show
"erased". Bulky personal files are content-hashed blobs that can be deleted.
The log stays immutable and syncable.

Design inputs from the [P11 Identity][P11] grilling (2026-09-27,
[ADR-0022](0022-identity-and-organization-isolation.md)):

- The subject is the person: one per human, across organizations. Erasing a
  person destroys one key and affects every organization at once.
- Anything that hashes the log (a future tamper-evidence chain) hashes the
  stored ciphertext, never plaintext, so erasure does not break it.
- Local deletion of an organization's copy after a revoked membership is
  decided here.

[P15 Encrypted store][P15] and [P16 Crypto-shredding][P16] are follow-on, not foundation closure.

## Trade-offs

Crypto-shredding keeps the log intact at the cost of unreadability depending
on key destruction on every replica and projection. SQLCipher is optional so
consumer apps that do not need it are not forced.

## Failure-handling

[P15 Encrypted store][P15]: [P04 Log store conformance][P04] + [P05 Changesets and projections][P05] suites pass on SQLCipher with keys in Keychain/Keystore.
Positive control: wrong key cannot open the database.

[P16 Crypto-shredding][P16]: after key destruction, personal attributes are unreadable on every
replica, projection and export; the log stays intact and syncable. Positive
control: a non-erased subject stays readable.

## Outcome

### Expected

Encryption at rest is an opt-in implementation of the log-store pattern.
Erasure is unreadability, not row deletion.

### Observed

Not yet run.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D50]: ../plan/bootstrap/02-decision-log.md#d50
[D51]: ../plan/bootstrap/02-decision-log.md#d51
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P15]: ../plan/bootstrap/06-qualification-gates.md#p15
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
