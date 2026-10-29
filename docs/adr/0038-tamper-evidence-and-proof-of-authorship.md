# ADR-0038: Tamper-evidence and proof of authorship

Summary: Every organization's accepted history is a hash chain each device recomputes, so a rewrite is caught; who wrote a changeset is shown at a level an app chooses, from the server vouching to device signatures bound outside the operator.

Status: Proposed, unverified

Date: 2026-10-27

Qualifying gate: [P09 Sync][P09] qualified again on the hash chain ([I85 Build the hash chain][I85]); signing names its gate when [I15 Identity, keys and trust][I15] is picked up.

Related: [D155 A hash chain per organization][D155], [D156 Levels of proof of authorship][D156], [D152 One meaning of identity][D152], [D146 One checkpoint enforces trust][D146], [D105 What must stay possible][D105], [D44' Never rename, never migrate, the RPC too][D44'], [D51 Crypto-shredding][D51]. [ADR-0022 Identity and organization isolation][ADR-0022] (its stated limitation), [ADR-0023 Data at rest and crypto-shredding][ADR-0023], [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] (no server compaction). [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), sections 11 and 12), [I15 Identity, keys and trust][I15], [I60 Server-independent mode][I60], [I85 Build the hash chain][I85].

## Problem

Stored history is trusted, not provable: an operator or a database
administrator can change a datom and no device notices, and a new device
receives the edited value as if it were always there ([ADR-0022 Identity and organization isolation][ADR-0022]). `actor` is a
label the server checked, not a proof, and a device's id is chosen by the
device. A reference implementation should show how far that can be closed,
and a chain started later covers only history from that day.

## Design

**The hash chain** ([D155 A hash chain per organization][D155]). Every accepted changeset gets a hash over its
canonical bytes and the previous hash, written in the same transaction as
the append.

- One chain per organization, in server sequence. The server-only root has
  its own, checked by an audit tool, since no device receives it.
- The canonical encoding has a version name and is frozen. It is the
  changeset as its writer made it (the envelope without what authority adds at
  accept, the datoms in order) with sealed values as stored ciphertext, so
  erasure does not break the chain ([D51 Crypto-shredding][D51]). The same bytes are what a
  signature signs.
- A device recomputes the chain over what it pulls and compares it with the
  head the server names. A mismatch is a typed alarm, never a silent repair.
- The server log stays uncompacted until a compaction design keeps the chain
  checkable.

**Proof of authorship** ([D156 Levels of proof of authorship][D156]), one level per app, holding for every
changeset of an organization from a named point in its chain:

| Level | Who vouches for the writer | Against the operator |
| --- | --- | --- |
| server vouches (reference) | authority, from the access token and the actor check | no |
| signed | a device key bound to its identity by a fact in the chain; the device signs the authored bytes, apart from authority's acceptance | a key added in someone's name is visible to their devices |
| signed and bound elsewhere | the binding signed by the identity provider or another of the person's devices | yes |

**signed** is deferred to [I15 Identity, keys and trust][I15]: `Decide when:` an app needs proof of who wrote
what, or a sync node accepts from a peer. A person's identity, a device's signing
key, a transport key and the provider-account mapping stay distinct, and a key
never authorizes. Every device signs in through OIDC on its own.

**Peers.** A device applies the sync cursor stream unchecked ([D146 One checkpoint enforces trust][D146]); a sync node
that accepts from a peer runs the same checkpoint and, once changesets are
signed, checks the signature ([I60 Server-independent mode][I60]).

## Trade-offs

- **Waiting for an app with audit claims** (the earlier plan) keeps the
  encoding open longer, but every changeset accepted before the chain starts
  stays unprovable.
- **A per-changeset hash without a chain** shows a changeset is intact, not
  that none was removed or inserted.
- **Signing now** buys key storage, loss and rotation on iOS, Android and web
  before anything but the server checks a signature; the encoding is pinned
  now, so signing later needs no migration.
- **A key the server alone binds** proves nothing against the operator; the
  chain makes each binding visible to the identity's devices.
- **Out-of-scope items:** server-independent mode is made easier: forwarded
  history becomes checkable, and **signed and bound elsewhere** is its proof of
  authorship. A different history shown to a new device is caught only by
  comparing heads between devices, left to [I60 Server-independent mode][I60].

## Failure-handling

[P09 Sync][P09], qualified again: a datom edited in the database is caught by the next
pull on every device (positive control: an unedited log raises no alarm); an
erased subject's ciphertext still chains; the server-only chain is checked by
the audit tool. Not built ([I85 Build the hash chain][I85]); signing not designed beyond this
record.

## Outcome

### Expected

Tamper-evidence is a qualified claim instead of a stated absence: a rewrite of
accepted history is caught by any device that pulled it.

### Observed

Not yet run.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0011]: 0011-log-store-pattern.md
[ADR-0022]: 0022-identity-and-organization-isolation.md
[ADR-0023]: 0023-data-at-rest-and-crypto-shredding.md
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D146]: ../plan/bootstrap/02-decision-log.md#d146
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[D51]: ../plan/bootstrap/02-decision-log.md#d51
[I15]: ../issues/0015-identity-keys-and-trust.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I60]: ../issues/0060-server-independent-mode.md
[I85]: ../issues/0085-build-the-hash-chain.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
