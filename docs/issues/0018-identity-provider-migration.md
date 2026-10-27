# I18: Identity provider migration

Status: ready-for-human

Category: enhancement

Decide when: a consumer changes provider

## What

Moving people to a new identity provider has no tooling.

## Direction

Relinking is one datom on the server's account entity ([ADR-0022 Identity and organization isolation][ADR-0022]); tooling then.

## Comments

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D152 One meaning of identity][D152]: confirmed. A provider account is where a credential comes from, not an identity; relinking is one datom on the account entity, for an agent account's service account too ([I86 Agent accounts][I86]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0022]: ../adr/0022-identity-and-organization-isolation.md
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I86]: 0086-agent-accounts.md
