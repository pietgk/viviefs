# ADR-0037: Access

Summary: Who may write what and which replica receives what is one access decision, made on authority at accept and at sync's filter, through one AuthZEN-shaped contract whose reference implementation is today's membership code.

Status: Proposed, unverified

Date: 2026-10-27

Qualifying gate: [P11 Identity][P11] qualified again on the access contract ([I84 Build the access pattern][I84]).

Related: [D150 Access around sync and commands][D150], [D151 The access pattern][D151], [D154 Whoever grants is the actor][D154], [D124 One checkpoint][D124], [D127 Registered commands][D127], [D107 The Presenter pattern][D107], [D141 The actor is the accountable identity][D141], [D152 One meaning of identity][D152], [D153 Agent accounts][D153], [D105 What must stay possible][D105]. [ADR-0022 Identity and organization isolation][ADR-0022], [ADR-0035 Accepting a change][ADR-0035]. [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), sections 6 and 13), [I70 Research: access from membership to enterprise][I70] ([the record](../research/2026-10-09-access-from-membership-to-enterprise.md)), [I16 Roles in use, invitations and self-service membership][I16], [I12 Partial sync, history consolidation and client data access][I12], [I71 An append can land after a revocation][I71], [I84 Build the access pattern][I84].

## Problem

[ADR-0035 Accepting a change][ADR-0035] makes "may this writer do this" the first question of accepting a
change and leaves its answer to this record. Today the answer is code spread
over the sync server: membership on every handler, the actor check,
server-only attributes, and soon a command's declared writes. Consumer apps
will need more: roles, permission per entity, conditions an auditor reads.
Each step must not change accept or sync again.

vivief puts access inside each read (a Projection's capability token and
scope) and makes a decryption key the check. ViViEfs's authority must read a
value to accept a change, and a key does not recall what was already read
([D149 Encryption levels][D149]).

Found while deciding: the operator's commands write as `server`, so the log
does not say who granted a membership; and the roles in `Caller` are the
identity provider's realm roles, the same in every organization.

## Design

**Where** ([D150 Access around sync and commands][D150]). Access is decided on the sync node holding authority at
two points: accept, for what may be written, and sync's filter, for what a
replica receives. A device runs the same decision early as advice. A read
carries no access rule; a replica holds only what its reader may see.

**The contract** ([D151 The access pattern][D151]). One request, in the shape of the OpenID AuthZEN
Authorization API 1.0:

```ts
decide(
  evaluations: NonEmptyArray<{
    subject: { type: string; id: string }   // the actor: a person, the server, an agent account
    action: { name: string }                // the registered command, or sync.pull
    resource: { type: string; id: string }  // one entity, or the organization for sync
    context: Record<string, Json>           // organization, device, origin, the writes
  }>,
  at: Position,                             // the state the decision read
): Allow | Deny<{ index: number; reason: AccessReason }>
```

- A changeset is a batch: one evaluation per touched entity, combined with AND.
- `at` is the sync cursor today; a holder epoch with its sequence when authority
  moves; a frontier when authority is shared.
- A write check reads the state at `at`, before the changeset, with the
  changeset's own writes in each evaluation's context.
- An evaluation error is a deny, whatever the implementation.
- `AccessReason` is a closed set: `MembershipMissing`, `ServerOnlyAttribute`,
  `UnknownCommand`, `WriteOutsideCommand`, `Forbidden` (with the rule's name).
  An implementation maps its own reasons to one.

**The reference implementation** is today's code: a non-member is denied
everything; no device writer may write a server-only attribute; no command may
write outside its declared writes; a member may read the whole organization.
The last three are guardrails no grant overrides.

**The ladder.** Each step is triggered by an app, never by size, and
membership and the guardrails stay at every step:

| Step | Data | Trigger |
| --- | --- | --- |
| 1. Code (reference) | membership, `authority: 'server'`, declared writes | today |
| 2. Roles | role facts per identity per organization, beside membership | a command some members may run and others may not ([I16 Roles in use, invitations and self-service membership][I16]) |
| 3. Relations | relation facts in the organization's log; rewrites as code beside the catalog | permission per entity, or partial sync by permission ([I12 Partial sync, history consolidation and client data access][I12]) |
| 4. Policies | Cedar policies shipped with the release, analysed in verify | conditions and guardrails hard to read in code, an auditor, a proof |

Search ("what may this identity read") is an optional capability, first
needed by partial sync. A higher step may run on authority only; the device's
early check then answers "unknown". Cedar on Hermes needs a probe before Cedar
is an implementation.

**Conformance.** The suite `access/decisions` is a table of rows: datoms at a
position, one request, the expected decision and reason. Each implementation
runs the rows of the steps it claims and every step below. Rows pin the two
places systems differ by default: the same log before and after a revocation,
and an implementation that fails to evaluate.

**Who grants** ([D154 Whoever grants is the actor][D154]). Whoever creates an identity or grants or revokes
a membership is that changeset's actor; `server` is the actor only for what the
server decides itself. The operator signs in and holds an operator role. Only
a person may create an agent account ([D153 Agent accounts][D153]).

## Trade-offs

- **Access in each read** (vivief's Projection) puts the rule in every read
  path and leaves the data on the replica anyway.
- **A key as the check** (vivief's Trust Contract) lets authority check only
  the shape of a value and cannot recall a revoked reader's copy.
- **A changeset-level resource** would be one evaluation per changeset, but
  loses per-entity rules, which are what relations and Cedar are for.
- **No position in the contract** is simpler today, but each implementation's
  signature would change when authority moves.
- **The identity provider's roles** are not per organization and differ per
  provider.
- **Out-of-scope items:** server-independent mode ([I60 Server-independent mode][I60]) is made easier: `at`
  leaves room for a frontier, and a revocation concurrent with a write under
  shared authority is [I60][I60]'s to decide. Nothing in [D105 What must stay possible][D105] is made harder.

## Failure-handling

- An implementation that errors denies; the conformance rows include it.
- An append that races a revocation is closed by checking and appending in one
  step ([I71 An append can land after a revocation][I71]).
- A device's early check is advice; authority decides again on every accept.
- Not built: the contract, the suite, roles, the operator's identity on grants
  ([I84 Build the access pattern][I84]).

## Outcome

### Expected

Accept and sync's filter call one `decide`; the reference implementation
passes `access/decisions` on the server and on the device; a grant names the
person who made it; [P11 Identity][P11]'s checks pass unchanged through the contract.

### Observed

Not yet run.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0022]: 0022-identity-and-organization-isolation.md
[ADR-0035]: 0035-accepting-a-change.md
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D127]: ../plan/bootstrap/02-decision-log.md#d127
[D141]: ../plan/bootstrap/02-decision-log.md#d141
[D149]: ../plan/bootstrap/02-decision-log.md#d149
[D150]: ../plan/bootstrap/02-decision-log.md#d150
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[D153]: ../plan/bootstrap/02-decision-log.md#d153
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[I12]: ../issues/0012-partial-sync-and-history.md
[I16]: ../issues/0016-roles-and-self-service-membership.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I60]: ../issues/0060-server-independent-mode.md
[I70]: ../issues/0070-research-access-from-membership-to-enterprise.md
[I71]: ../issues/0071-an-append-can-land-after-a-revocation.md
[I84]: ../issues/0084-build-the-access-pattern.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
