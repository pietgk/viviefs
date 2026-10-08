# I58: Several servers in the lab

Status: ready-for-human

Category: enhancement

Decide when: a consumer app needs organizations on more than one server, or the human schedules it for learning

## What

Nothing in ViViEfs runs on more than one server: organization isolation is proven on one ([ADR-0022 Identity and organization isolation][ADR-0022], [P11 Identity][P11]), and production hosting is open ([I7 Production hosting, deployment and telemetry backend][I7]). Several servers, with organizations spread across them, can be learned and qualified in the lab on a laptop (local containers or a local Kubernetes) without being production ([D101 Lab and production][D101]). Decide when and how: what the lab setup is, which claim a gate would prove, and what must stay possible meanwhile ([D100 Out of scope means not yet][D100]).

From [I47](0047-what-viviefs-is-about.md). Read with [I48 The server-independent goal, and what an app is to a device and a node][I48], which asks what an app is to a device and a node: a server read as a node with a server signature changes what "several servers" means.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0022]: ../adr/0022-identity-and-organization-isolation.md
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I7]: 0007-production-hosting-and-telemetry-backend.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
