# ADR-0023: Data at rest and crypto-shredding

Summary: Encryption at rest per app with SQLCipher, and erasure by destroying per-subject keys.

Status: Proposed, unverified

Date: 2026-09-20. Amended 2026-10-27 with encryption levels ([D149 Encryption levels][D149], [I54 Trust, encryption and who may sign in][I54]).

Qualifying gate: [P15 Encrypted store][P15], [P16 Crypto-shredding][P16]

Related: [D50 Data at rest on device][D50], [D51 Crypto-shredding][D51], [D149 Encryption levels][D149], [D157 The device after a revoked membership][D157]. [ADR-0037 Access][ADR-0037], [I87 Group and role encryption levels][I87]. [ADR 0011](0011-log-store-pattern.md).

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
  decided here. Amended 2026-10-27 ([D157 The device after a revoked membership][D157]): the copy stays read-only;
  deleting it is a courtesy an app may turn on, never security.

**Encryption levels** (amendment 2026-10-27, [D149 Encryption levels][D149], [I54 Trust, encryption and who may sign in][I54]). Encryption
serves erasure and data at rest, never access: it narrows who can open a value
and never grants it, because who may read is the access decision ([ADR-0037 Access][ADR-0037]).
Encryption is a pattern: seal a value at a level, open it for a holder, erase
a subject; an erased subject is unreadable everywhere, a non-holder cannot
open, and encryption never grants. The level is chosen per attribute in the
catalog, by who holds the key:

| Level | Who holds the key | What authority can check | State |
| --- | --- | --- | --- |
| open | no key | everything | every attribute today |
| subject (reference) | authority, one random key per subject | everything | this record, [P16 Crypto-shredding][P16] |
| group | the organization's members; the operator stores ciphertext | presence and shape | deferred ([I87 Group and role encryption levels][I87]) |
| role | members with a role or consent, narrower than membership | presence and shape | deferred ([I87 Group and role encryption levels][I87]) |

Only the value is encrypted; entity, attribute, `tx` and `op` stay in clear.
A subject key is random bytes, never derived from a passphrase or other
lasting secret, so destroying it is final. Where keys live and whether a
device holds them is [P16 Crypto-shredding][P16]'s design. At rest (SQLCipher) is a log-store
implementation under every level, not a level. The `:personal` mark above is
the **subject** level. The working word "encryption level" is map 3's to settle.

[P15 Encrypted store][P15] and [P16 Crypto-shredding][P16] are follow-on, not foundation closure.

## Trade-offs

Crypto-shredding keeps the log intact at the cost of unreadability depending
on key destruction on every replica and projection. SQLCipher is optional so
consumer apps that do not need it are not forced.

Encryption as access (vivief's Trust Contract, amendment 2026-10-27): keys per
role decide who reads. Authority could then check only the shape of a value,
and a rotated key does not recall what was read; the **role** level keeps it
possible as a second wall under the access decision. vivief's keys derived from
a passphrase are rejected: a derived key comes back, so erasure cannot hold.

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

[ADR-0037]: 0037-access.md
[D149]: ../plan/bootstrap/02-decision-log.md#d149
[D157]: ../plan/bootstrap/02-decision-log.md#d157
[D50]: ../plan/bootstrap/02-decision-log.md#d50
[D51]: ../plan/bootstrap/02-decision-log.md#d51
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I87]: ../issues/0087-group-and-role-encryption-levels.md
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P15]: ../plan/bootstrap/06-qualification-gates.md#p15
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
