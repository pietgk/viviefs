# ADR-0022: Identity and organization isolation

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P11

Related: D18, D47. complyj ADR 0005 as a lesson source.

## Problem

GRC and ERP need organization-scoped roles. A client-supplied org id is an
attack. Early gates still need *an* identity so other probes can run.

## Design

Authenticated users. Per-organization isolation is enforced **server-side** on
every sync pull and push, lease and command. Never trust a client-supplied org
id. `O{org}/` is the id-tree root and the isolation unit.

Identity via OIDC: Keycloak on Apple Container locally, PKCE on device
(`expo-auth-session`), any OIDC provider in production, behind an `Identity`
service. A fake identity during early gates. Same "one pattern, several
implementations" shape as storage and telemetry.

P11 is follow-on, not foundation closure. Early gates may use the fake.

## Trade-offs

Fake-then-OIDC keeps P01-P10 unblocked. The risk is leaking fake-identity
assumptions into server checks; isolation is always server-authoritative.

## Failure-handling

P11: Keycloak on Apple Container with PKCE from the simulator; membership
enforced on sync, lease and commands. Positive control: cross-organization
access denied while same-organization access allowed.

## Outcome

### Expected

One `Identity` contract. Fake and OIDC both pass it. The server never trusts
the client for org membership.

### Observed

Not yet run. complyj qualified Keycloak, not with Expo.
