# I70: Research: access from membership to enterprise

Status: ready-for-agent

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: research

Found: 2026-10-09

## What

Can access in ViViEfs be one pattern whose reference implementation is today's code (membership, `authority: 'server'`, declared writes) and whose later implementations grow to enterprise level (roles, relations as datoms, Cedar policies) under one contract, and what is the smallest contract Cedar still fits? A dated research record, with the `research` skill, read before [I54 Trust, encryption and who may sign in][I54] is grilled.

From [I50 Contracts checked as data or by commands][I50] ([ADR-0035 Accepting a change][ADR-0035], the direction under Design). The human's thought: IAM is overkill while ViViEfs is not an enterprise, but a pattern that starts minimal and grows inside one contract would keep vivief's elegance. [I50][I50]'s [review page](../research/2026-10-08-contracts-review.html) has a first sketch and explainers of Zanzibar and Cedar; this record replaces the sketch with primary sources.

Questions:

1. **The request.** The OpenID AuthZEN Authorization API 1.0 (Final, 2026-01-12): subject, action, resource, context, and a decision. Does it fit accept (a changeset touches several entities) and sync's filter (what a replica receives), and what does a batch of checks look like?
2. **What each system separates.** AWS IAM (identity and resource policies, Service Control Policies, permission boundaries, evaluation logic), AWS Config (detective rules and findings), Cedar (permit and forbid, default deny, schema, analysis), Zanzibar, OpenFGA and SpiceDB (relation tuples, userset rewrites, the new enemy problem and its consistency token), OPA. Which layers exist only for AWS's scale?
3. **Policy as data for analysis.** What can Cedar's analysis prove that code cannot, and does a ViViEfs organization ever need that proof?
4. **Offline and any `node`.** Which implementations run on a device (Cedar's WebAssembly build, an OpenFGA model evaluated locally), and what replaces Zanzibar's consistency token when a check runs away from authority ([I60 Server-independent mode][I60])?
5. **The ladder.** For each step (code, roles, relations, policies): what the conformance decision table looks like, and what triggers moving up.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0035]: ../adr/0035-accepting-a-change.md
[I50]: 0050-contracts-checked-as-data-or-by-commands.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I60]: 0060-server-independent-mode.md
