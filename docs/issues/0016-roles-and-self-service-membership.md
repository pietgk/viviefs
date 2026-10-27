# I16: Roles in use, invitations and self-service membership

Status: ready-for-human

Category: enhancement

Decide when: the first consumer app that needs a role

## What

[P11 Identity][P11] enforces membership only; an operator grants and revokes it, and no role restricts anything.

## Direction

Roles are already carried in the caller; the first enforced role comes with its consumer.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) makes trust overrides on an origin authority-only ([D116 Trust levels and who sets them][D116], `authority: 'server'`) until roles exist; who in an organization may set an origin's trust level is decided with the first enforced role.

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md): in the direction for access as a pattern ([ADR-0035 Accepting a change][ADR-0035], [I70 Research: access from membership to enterprise][I70]), roles are the second implementation after today's code; a command would name the roles that may run it, checked as the first question of accepting a change ([D124 One checkpoint][D124]).

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D151 The access pattern][D151], [D153 Agent accounts][D153], [D154 Whoever grants is the actor][D154]: roles are step 2 of the access pattern ([ADR-0037 Access][ADR-0037]): facts per identity per organization beside membership, not the identity provider's realm roles `Caller` carries today. An agent account holds roles like a person ([I86 Agent accounts][I86]). The operator role comes first, with [I84 Build the access pattern][I84], so a grant names who made it. Who may set an origin's trust level comes with the first role a member holds.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0035]: ../adr/0035-accepting-a-change.md
[ADR-0037]: ../adr/0037-access.md
[D116]: ../plan/bootstrap/02-decision-log.md#d116
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D153]: ../plan/bootstrap/02-decision-log.md#d153
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
[I84]: 0084-build-the-access-pattern.md
[I86]: 0086-agent-accounts.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
