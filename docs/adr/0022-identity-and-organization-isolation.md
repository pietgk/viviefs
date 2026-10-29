# ADR-0022: Identity and organization isolation

Summary: People sign in through OIDC; the server enforces organization isolation on every pull, push, lease and command.

Status: Qualified

Date: 2026-09-20. Amended 2026-09-27 by the [P11 Identity][P11] grilling; 2026-09-28 with how the device signs in (step 6); 2026-10-27 with one meaning of identity, agent accounts and who grants ([I54 Trust, encryption and who may sign in][I54]).

Qualifying gate: [P11 Identity][P11]

Related: [D18 Organization isolation on the server][D18], [D47 Identity via OIDC][D47], [D152 One meaning of identity][D152], [D153 Agent accounts][D153], [D154 Whoever grants is the actor][D154], [D157 The device after a revoked membership][D157]. complyj `ADR 0005` and 0009 as lesson sources.
[P11 design review](../evidence/p11-design-review.md) (grilling record, Q1-Q24).
[ADR-0016](0016-commands-and-server-validation.md) (server validation),
[ADR-0011](0011-log-store-pattern.md) (no server compaction),
[ADR-0023](0023-data-at-rest-and-crypto-shredding.md) (erasure), [ADR-0037 Access][ADR-0037] (access), [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038] (the hash chain and signing).

## Problem

GRC and ERP need organization-scoped roles. A client-supplied org id is an
attack. Early gates still need *an* identity so other probes can run.

[P09 Sync][P09] left three concrete gaps: every RPC carries a client-supplied `org` that
the server believes; `envelope.actor` is whatever the client wrote; and blobs
are global, so `FileMissing` tells a caller whether another organization holds
a file.

## Design

Authenticated people. Per-organization isolation is enforced **server-side**
on every sync pull and push, lease and command. Never trust a client-supplied
org id. `O{org}/` is the id-tree root and the isolation unit.

**Identity provider.** OIDC: Keycloak on Apple Container locally, PKCE on
device (`expo-auth-session`), any OIDC provider in production. The identity
provider only authenticates. It does not hold membership.

**Two services under one identity pattern** (amendment, naming only). [D47 Identity via OIDC][D47] says
"behind an `Identity` service". The pattern and `@viviefs/identity` keep that
name; the service is split by side:

- `SignInSession` (device): sign in, current access token, refresh, sign out,
  and the state signed-out / signed-in / sign-in-needed.
- `TokenVerifier` (server): checks a token's signature, `iss`, `aud` and `exp`
  against the provider's cached JWKS (`jose`, found through OIDC discovery)
  and returns the provider account `(iss, sub)` with the roles it carries.
  No introspection.
- `FakeIssuer`: the fake for early gates and tests. It signs real JWTs with a
  local key and serves its own JWKS, so it goes through the same verification.
  Only tests, `tools/` and dev composition may import it.

**Boundary.** Effect RPC over HTTP in `apps/evidence-server`. The
`BearerAuthentication` RPC middleware is on the whole sync RPC group: it
requires `authorization: Bearer`, verifies it, maps `(iss, sub)` to a person
and provides `Caller`. A new RPC in the group is authenticated by default.
Authentication only; authorization happens in the handlers.

**Person.** One per human, across organizations: an opaque id minted by the
server's HLC. `envelope.actor` holds the person id, or `server` for
server-authored changesets. A person is not an entity in any organization's
log.

**Account entity.** The mapping from an identity-provider account to a person
is datoms in the server's log, not a separate table ([ADR-0006 One datom log as the substrate][ADR-0006]: domain truth
lives only in the log). Entity `A{sha256(iss, sub)}` under a server-only root
([ADR-0010 Entity ids, defining attributes and strict-composition prefixes][ADR-0010]), defining attribute `viviefs/account/person` (value: the person id),
plus `viviefs/account/issuer` and `viviefs/account/subject`. Authentication
reads it by entity id on the existing EAVT index; it never writes. Linking an
account, or moving a person to a new identity provider, is history with an
actor and an acceptance time. Account datoms travel in their own changeset,
never with organization datoms.

**Membership.** The entity `O{org}/M{person}`, defining attribute
`viviefs/membership/granted` (value: the person id), written only by the
server through `grantMembership` / `revokeMembership` (operator commands
outside the device RPC group). `grantMembership` is the only place a person is
minted, so a request never writes; an account without a person is a member of
nothing. The operator commands are serialized; with more than one server
process (Effect Cluster, deferred) uniqueness of the account entity needs a
database-level guard. The server reads it on
every request, so revocation is immediate even while a token is valid. Roles
are carried in the caller and not enforced (roles in use, invitations and
self-service membership come with the first consumer app that needs them).
Amended 2026-10-27: the roles the caller carries are the identity provider's
realm roles, the same in every organization, so they are not the roles access
will use; roles are per-organization facts beside membership ([D151 The access pattern][D151], [I16 Roles in use, invitations and self-service membership][I16]).

**Handler checks**, in addition to [ADR-0016 Commands, server validation and rejection][ADR-0016]'s validation:

- `org` in a payload is a selector; not a member gives `MembershipMissing`.
- The envelope's actor must be the caller's person; otherwise `ActorMismatch`.
- Attributes flagged server-only in the catalog cannot appear in a client
  changeset; otherwise `ServerOnlyAttribute`.
- The server stamps `acceptedAt` (its own wall clock, integer milliseconds) on
  the envelope of every accepted changeset. It is set once: a device that
  already holds the envelope fills it from `Pull` and never changes it again.
- Blobs are keyed per organization.
- `CompleteDeferred` is an authenticated RPC.

**One meaning of identity** (amendment 2026-10-27, [D152 One meaning of identity][D152]-[D154 Whoever grants is the actor][D154], [I54 Trust, encryption and who may sign in][I54]). An
identity is who a request or a change is accountable to: a person, the server
or an agent account, a kind read when access is decided. It proves itself with
a credential: today an access token from a provider account, later a key bound
to it ([ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]). The envelope's `actor` is an identity. A device is
not an identity, and a provider account is where a credential comes from. An
identity whose credential is its own key, with no one vouching, is
self-certifying (Effect's `EventLog.Identity`). This replaces the reading that
nothing is called an identity; the pattern keeps its name. An agent may have
its own identity, an agent account, created only by a person, deferred
([D153 Agent accounts][D153], [I86 Agent accounts][I86]). Whoever creates an identity or grants or revokes a
membership is that changeset's actor; `server` is the actor only for what the
server decides itself, and the operator signs in with an operator role
([D154][D154], built by [I84 Build the access pattern][I84]). Authorization in the handlers is the
access decision of [ADR-0037 Access][ADR-0037]. Until [I84][I84] qualifies [P11 Identity][P11] again,
this amended part is Proposed, unverified.

**Authenticated but not a member.** An account that was never granted
membership verifies, and its caller has no person. Every handler then answers
`MembershipMissing`; nothing is minted.

**Device.** The workflow engine writes its journal on behalf of the signed-in
person (`WorkflowEngineConfig.actor`), so a pushed journal write passes the actor
check. Lab runs that never reach a server use a fixed lab person. One local
replica per provider account; signing out closes it. Refresh
token in `expo-secure-store` with `offline_access` on iOS and Android; in
memory on web. A failed refresh enters sign-in-needed and keeps the outbox.
After `MembershipMissing` the org's local copy is read-only and its outbox rows
become `rejected`.

**How the device signs in** (amendment 2026-09-28, step 6). `oidcSignInSession`
in `@viviefs/identity` is platform-free: the authorization code flow with
PKCE (S256), refresh, and revocation of the refresh token at sign out, over
three ports (the login page, where the session is kept, the server's
statement). The Expo ports are `@viviefs/platform-native/sign-in`. The device
reads no token: right after the code exchange it asks `Caller` with exactly
the new access token and takes its provider account from that statement. The
statement lives in the session state and is stored with it. Every sign-in
asks for the password (`prompt=login`), and iOS uses an ephemeral
authentication session, so the next person on a device never inherits the
last one's provider session. A refresh the provider refuses is sign-in needed;
one it does not answer is `IdentityProviderUnreachable` and changes nothing.
Requests to the identity provider carry no trace context. A replica's
database is named from a hash of `(iss, sub)`; removing the account from the
device deletes it.

## Trade-offs

Fake-then-OIDC keeps [P01 Platform on SDK 58][P01]-[P10 Trace projection][P10] unblocked. The risk is leaking fake-identity
assumptions into server checks; the fake therefore issues real signed tokens
and one contract suite runs against both.

Local JWKS verification over introspection: no provider round trip per
request, and the server survives short provider outages. The cost, a token
that cannot be revoked before `exp`, does not matter because membership is
read per request.

Membership in the log over provider group claims: immediate revocation and no
coupling to Keycloak. Over a server-only table: devices see membership through
normal sync ([D31 One datom log][D31]).

The account-to-person mapping in the log over a `people` table: one source of
truth, history for every link, and coverage by a future hash chain, which
matters most for the mapping that decides who someone is. The cost is a
server-only root in the id tree, and uniqueness from a deterministic id plus
serialized operator commands instead of a database constraint.

A person id across organizations over a per-organization person entity: one
id per human, no second sync scope, and one key to destroy for erasure.
Members of one organization cannot read another's log, so the shared id
reveals nothing.

Bearer tokens over server sessions with cookies (complyj): works the same on
iOS, Android and web.

## Failure-handling

[P11 Identity][P11] checks, each able to fail on its own, are listed in the
[design review](../evidence/p11-design-review.md#1-the-claim): the token
contract on fake and Keycloak; PKCE on iOS, Android and web; membership on
`Append`, `Pull`, `PutBlob` and `CompleteDeferred`; lease; actor; server-only
attributes; immediate revocation; `acceptedAt`; blobs per organization;
sign-in-needed; one local replica per provider account. Positive control: cross-organization
access denied while same-organization access allowed.

Stated limitation: stored history is trusted, not provable, against an
operator or database administrator. Amended 2026-10-27: a hash chain per
organization is built now ([D155 A hash chain per organization][D155], [I85 Build the hash chain][I85]), and signed changesets
wait for an app that needs proof of who wrote what ([D156 Levels of proof of authorship][D156], [I15 Identity, keys and trust][I15]).
Until the chain is checkable across compaction the server log is never compacted.

The lab runs plain HTTP. TLS is decided with production hosting.

Known limitations ([P11 Identity][P11] grilling Q23, 2026-09-28), decided in the identity,
keys and trust step (Q24): `envelope.device` is chosen by the device and not
authenticated; any member of an organization may take over any execution's
lease there by raising the epoch, which is how failover works ([D15 Server authority after a lost lease][D15]), but who
may take a lease is unspecified. Amended 2026-10-27: who may take over a run
is answered by [ADR-0036 The journal is the fence][ADR-0036]; nothing trusts the device id once the journal
fence is built ([I80 Build the journal fence][I80]).

**How a device labels its writes** (Q22). The device keeps a copy of the
server's statement about the signed-in provider account, from the `Caller`
RPC: its person (or none) and its memberships. It is fetched again at every
sign-in and treated as stale when the server refuses. The device never
decides who it is.

## Outcome

### Expected

One identity contract; the fake issuer and Keycloak both pass it. The server
never trusts the client for organization membership or authorship. Every
accepted changeset names a verified person and a server acceptance time.

### Observed

[P11 Identity][P11], 2026-09-28. Ledger pass `2026-09-28T19-38-22.564Z-0f0ac08c` on a clean tree
(`971ae6e2`), after a measurement run with the same result. Evidence: [2026-09-28-p11.md](../evidence/2026-09-28-p11.md). One token
contract of nine checks passes on the fake issuer's verifier, on the OIDC
verifier against a served fake, and on the OIDC verifier against Keycloak
26.7.3 on Apple Container: `alg: none`, a foreign key, HS256 algorithm
confusion, a changed payload, a foreign issuer (a second realm), a foreign
audience (another client) and an expired token are all refused.

On the authenticated protocol (12 Node checks) and over HTTP with
Keycloak's tokens (4 checks), a member of `acme` is acked while the same
token asking for `other` gets `MembershipMissing` on `Append`, `Pull`,
`PutBlob` and `CompleteDeferred` (the claim's positive control). A
non-member's lease, an envelope naming someone else or `server`, and a
client-written membership or account datom are refused; revocation takes
effect on the next call with a still-valid token and keeps the refused row;
the server stamps `acceptedAt` and ignores a device's claim; blobs are per
organization; an account never granted verifies but has no person and is
refused everywhere.

On the iOS simulator, the Android emulator and web, the evidence app signs
in at Keycloak with PKCE, learns its person from the `Caller` statement,
is acked in `acme` and refused in `other`; keeps the session across a
restart on iOS and Android (secure storage) and forgets it on a web reload;
moves to sign-in needed on `invalid_grant` with the outbox kept and syncs it
after signing in again; opens one replica per provider account (bob sees
none of alice's data; alice finds hers intact); and deletes a removed
account's replica. Three lab-only defects in the evidence app each fail
exactly their check on web: ignoring `invalid_grant`, one shared replica,
and web tokens in `localStorage`.

[P01 Platform on SDK 58][P01]-[P11 Identity][P11] then passed in one sequential run on a clean tree (`59b74a9a`,
run `2026-09-28T22-40-46.395Z-cfafc842`, [closure note](../evidence/2026-09-28-p01-p11-closure.md)),
so [P11][P11]'s changes to the log, the protocol and the evidence app left every
earlier gate passing, [P02 SQLite drivers][P02], [P04 Log store conformance][P04] and [P05 Changesets and projections][P05] on web included.

Not measured: physical devices, TLS, `WorkflowEngineConfig.actor` from the
statement, and the limitations above (stored history, device identity,
lease authorization).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: 0006-one-datom-log.md
[ADR-0010]: 0010-entity-ids-and-defining-attributes.md
[ADR-0016]: 0016-commands-and-server-validation.md
[ADR-0036]: 0036-the-journal-is-the-fence.md
[ADR-0037]: 0037-access.md
[ADR-0038]: 0038-tamper-evidence-and-proof-of-authorship.md
[D15]: ../plan/bootstrap/02-decision-log.md#d15
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[D153]: ../plan/bootstrap/02-decision-log.md#d153
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D157]: ../plan/bootstrap/02-decision-log.md#d157
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[D31]: ../plan/bootstrap/02-decision-log.md#d31
[D47]: ../plan/bootstrap/02-decision-log.md#d47
[I15]: ../issues/0015-identity-keys-and-trust.md
[I16]: ../issues/0016-roles-and-self-service-membership.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I80]: ../issues/0080-build-the-journal-fence.md
[I84]: ../issues/0084-build-the-access-pattern.md
[I85]: ../issues/0085-build-the-hash-chain.md
[I86]: ../issues/0086-agent-accounts.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P02]: ../plan/bootstrap/06-qualification-gates.md#p02
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
