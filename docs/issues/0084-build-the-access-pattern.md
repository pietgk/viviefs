# I84: Build the access pattern

Status: ready-for-agent

Category: enhancement

Blocked by: [I69 Accept checks every change][I69], [I71 An append can land after a revocation][I71]

Found: 2026-10-27

## What

Access is code spread over the sync server (membership on every handler, server-only attributes, soon declared writes) and the operator's grants write as `server`; build [D151 The access pattern][D151] and [D154 Whoever grants is the actor][D154] ([ADR-0037 Access][ADR-0037]) so accept and sync's filter call one access decision and every grant names who made it.

From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), sections 6 and 13; [I70 Research: access from membership to enterprise][I70]'s [record](../research/2026-10-09-access-from-membership-to-enterprise.md), section 5 for the conformance table).

### What to build

1. **The contract.** `decide(evaluations, at)` in the shape of the AuthZEN request: one evaluation per touched entity, AND, `at` the cursor, the state before the changeset with its writes in context, an error a deny, and the closed reason set (`MembershipMissing`, `ServerOnlyAttribute`, `UnknownCommand`, `WriteOutsideCommand`, `Forbidden`).
2. **The reference implementation.** Membership, server-only attributes and [I69 Accept checks every change][I69]'s declared writes behind it; accept asks it first ([D124 One checkpoint][D124]) and `Pull` asks it for `sync.pull` on the organization; the device runs it early.
3. **The suite** `access/decisions`: the conformance rows of step 1, including the same log before and after a revocation and an implementation that errors.
4. **Who grants.** The operator signs in and holds an operator role; `grant` and `revoke` write with the operator's identity as actor; `server` stays the actor only for what the server decides itself. Only a person may create an identity.
5. **Gate.** [P11 Identity][P11] qualified again through the contract, with a grant whose actor is the operator.

### To design first

- Where the operator's role lives before roles exist ([I16 Roles in use, invitations and self-service membership][I16]): one operator fact on the server-only root, or the first role.
- `Caller.roles` (the identity provider's realm roles) is dropped or kept unused.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0037]: ../adr/0037-access.md
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[I16]: 0016-roles-and-self-service-membership.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I69]: 0069-accept-checks-every-change.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
[I71]: 0071-an-append-can-land-after-a-revocation.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
