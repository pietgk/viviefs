# ADR-0023: Data at rest and crypto-shredding

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P12, P13

Related: D50, D51. [ADR 0011](0011-log-store-pattern.md).

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

P12 and P13 are follow-on, not foundation closure.

## Trade-offs

Crypto-shredding keeps the log intact at the cost of unreadability depending
on key destruction on every replica and projection. SQLCipher is optional so
consumer apps that do not need it are not forced.

## Failure-handling

P12: P04 + P05 suites green on SQLCipher with keys in Keychain/Keystore.
Positive control: wrong key cannot open the database.

P13: after key destruction, personal attributes are unreadable on every
replica, projection and export; the log stays intact and syncable. Positive
control: a non-erased subject stays readable.

## Outcome

### Expected

Encryption at rest is an opt-in implementation of the log-store pattern.
Erasure is unreadability, not row deletion.

### Observed

Not yet run.
