# I7: Production hosting, deployment and telemetry backend

Status: ready-for-human

Category: enhancement

Decide when: the first consumer app leaves the lab, or the human schedules it for learning in the lab ([D101 Lab and production][D101])

## What

Nothing decides yet where the server runs, which telemetry backend replaces the local lab sinks, how TLS is done, or how the web app keeps its sign-in session ([P11 Identity][P11] keeps it in memory).

## Direction

Decide then, together with sampling of durable spans.

## Comments

- 2026-10-27, [I59](0059-bring-adr-0002-and-the-vision-in-line-with-i47.md): production hosting is an out-of-scope item that is production only, and so learnable in the lab, on a laptop with the server, Postgres, Keycloak and an OTLP backend ([D158 The out-of-scope list, item by item][D158]); the `Decide when:` gains the lab trigger, as [I8 Workflow engine scale-out and more workflow runners on the server][I8] and [I60 Server-independent mode][I60] have. What must stay possible meanwhile: the server is a composition of Layers configured from its environment, telemetry leaves through OTLP to any backend, and identity is any OIDC provider behind the `Identity` service ([D47 Identity via OIDC][D47]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D47]: ../plan/bootstrap/02-decision-log.md#d47
[I60]: 0060-server-independent-mode.md
[I8]: 0008-engine-scale-out.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
