# ADR-0022: Identity and organization isolation

Status: Proposed, unverified

Date: 2026-09-20. Amended 2026-09-27 by the P11 grilling.

Qualifying gate: P11

Related: D18, D47. complyj ADR 0005 and 0009 as lesson sources.
[P11 design review](../evidence/p11-design-review.md) (grilling record, Q1-Q20).
[ADR-0016](0016-commands-and-server-validation.md) (server validation),
[ADR-0011](0011-log-store-pattern.md) (no server compaction),
[ADR-0023](0023-data-at-rest-and-crypto-shredding.md) (erasure and the future hash chain).

## Problem

GRC and ERP need organization-scoped roles. A client-supplied org id is an
attack. Early gates still need *an* identity so other probes can run.

P09 left three concrete gaps: every RPC carries a client-supplied `org` that
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

**Two services under one identity pattern** (amendment, naming only). D47 says
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
server. A server-side table maps `(iss, sub)` to it, so history survives a
change of identity provider. `envelope.actor` holds the person id, or `server`
for server-authored changesets. A person is not an entity in any
organization's log.

**Membership.** The entity `O{org}/M{person}`, written only by the server
through `grantMembership` / `revokeMembership` (operator commands outside the
device RPC group; they mint the person if missing). The server reads it on
every request, so revocation is immediate even while a token is valid. Roles
are carried in the caller and not enforced (roles in use, invitations and
self-service membership come with the first consumer app that needs them).

**Handler checks**, in addition to ADR-0016's validation:

- `org` in a payload is a selector; not a member gives `MembershipMissing`.
- The envelope's actor must be the caller's person; otherwise `ActorMismatch`.
- Attributes flagged server-only in the catalog cannot appear in a client
  changeset; otherwise `ServerOnlyAttribute`.
- The server stamps `acceptedAt` on the envelope of every accepted changeset.
- Blobs are keyed per organization.
- `CompleteDeferred` is an authenticated RPC.

**Device.** One local database per person; signing out closes it. Refresh
token in `expo-secure-store` with `offline_access` on iOS and Android; in
memory on web. A failed refresh enters sign-in-needed and keeps the outbox.
After `MembershipMissing` the org's local copy is read-only and its outbox rows
become `rejected`.

## Trade-offs

Fake-then-OIDC keeps P01-P10 unblocked. The risk is leaking fake-identity
assumptions into server checks; the fake therefore issues real signed tokens
and one contract suite runs against both.

Local JWKS verification over introspection: no provider round trip per
request, and the server survives short provider outages. The cost, a token
that cannot be revoked before `exp`, does not matter because membership is
read per request.

Membership in the log over provider group claims: immediate revocation and no
coupling to Keycloak. Over a server-only table: devices see membership through
normal sync (D31).

A person id across organizations over a per-organization person entity: one
id per human, no second sync scope, and one key to destroy for erasure.
Members of one organization cannot read another's log, so the shared id
reveals nothing.

Bearer tokens over server sessions with cookies (complyj): works the same on
iOS, Android and web.

## Failure-handling

P11 checks, each able to fail on its own, are listed in the
[design review](../evidence/p11-design-review.md#1-the-claim): the token
contract on fake and Keycloak; PKCE on iOS, Android and web; membership on
`Append`, `Pull`, `PutBlob` and `CompleteDeferred`; lease; actor; server-only
attributes; immediate revocation; `acceptedAt`; blobs per organization;
sign-in-needed; one database per person. Positive control: cross-organization
access denied while same-organization access allowed.

Stated limitation: stored history is trusted, not provable, against an
operator or database administrator. Tamper-evidence (hash chain with
device-held checkpoints; signed changesets only if a consumer needs proof
against the operator) is decided before the first consumer app that makes
audit claims, together with P13. Until then the server log is never compacted.

The lab runs plain HTTP. TLS is decided with production hosting.

## Outcome

### Expected

One identity contract; the fake issuer and Keycloak both pass it. The server
never trusts the client for organization membership or authorship. Every
accepted changeset names a verified person and a server acceptance time.

### Observed

Not yet run. complyj qualified Keycloak, not with Expo.
