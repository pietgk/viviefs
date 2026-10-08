# I16: Roles in use, invitations and self-service membership

Status: ready-for-human

Category: enhancement

Decide when: the first consumer app that needs a role

## What

P11 enforces membership only; an operator grants and revokes it, and no role restricts anything.

## Direction

Roles are already carried in the caller; the first enforced role comes with its consumer.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) makes trust overrides on an origin authority-only (D116, `authority: 'server'`) until roles exist; who in an organization may set an origin's trust level is decided with the first enforced role.
