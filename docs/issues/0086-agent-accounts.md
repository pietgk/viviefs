# I86: Agent accounts

Status: ready-for-human

Category: enhancement

Decide when: an app runs an agent that writes on its own, outside a person's session and outside a server workflow

Found: 2026-10-27

## What

An agent that acts on its own has no identity of its own: it writes as a person or as `server`, so no rule can refuse it what only a person may do; [D153 Agent accounts][D153] decides it gets an agent account, built when an app needs one.

From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), example d and section 13). An agent account signs in as a service account at the identity provider, the server maps it to an agent (not a person), it holds a membership and roles of its own, and it is the actor of what it writes ([D152 One meaning of identity][D152]). Only a person may create one, as that changeset's actor ([D154 Whoever grants is the actor][D154]). Guardrails in [ADR-0037 Access][ADR-0037] refuse an agent a membership grant, creating an identity and the gated commit path ([D117 Trust strategies as commit paths][D117]). When this fires, decide: the service-account flow per identity provider (client credentials), where the agent's kind is kept, how its credential is rotated, and its gate ([P11 Identity][P11] extended).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0037]: ../adr/0037-access.md
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[D153]: ../plan/bootstrap/02-decision-log.md#d153
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
