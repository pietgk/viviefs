# I58: Several servers in the lab

Status: ready-for-human

Category: enhancement

Decide when: a consumer app needs organizations on more than one server, or the human schedules it for learning

## What

Nothing in ViViEfs runs on more than one server: organization isolation is proven on one ([ADR-0022 Identity and organization isolation][ADR-0022], [P11 Identity][P11]), and production hosting is open ([I7 Production hosting, deployment and telemetry backend][I7]). Several servers, with organizations spread across them, can be learned and qualified in the lab on a laptop (local containers or a local Kubernetes) without being production ([D101 Lab and production][D101]). Decide when and how: what the lab setup is, which claim a gate would prove, and what must stay possible meanwhile ([D100 Out of scope means not yet][D100]).

From [I47](0047-what-viviefs-is-about.md). Read with [I48 The server-independent goal, and what an app is to a device and a node][I48], which asks what an app is to a device and a node: a server read as a node with a server signature changes what "several servers" means.

## Comments

- 2026-10-27, [I59](0059-bring-adr-0002-and-the-vision-in-line-with-i47.md): now an item in 01-vision's out-of-scope list, production only and so learnable in the lab ([D158 The out-of-scope list, item by item][D158]); it had been named by [D101 Lab and production][D101] but missing from the list. What must stay possible: authority is held per organization, so which `node` holds it can differ between organizations ([D103 Nodes and authority][D103]); every request and changeset names its organization and the server never trusts a client's ([D18 Organization isolation on the server][D18]); `tx` is corrected against the `node` holding authority ([D118-D123 The datom and its store][D118-D123]). Not the server-independent mode ([I60 Server-independent mode][I60]): each organization still has one authority. The `Decide when:` is unchanged.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0022]: ../adr/0022-identity-and-organization-isolation.md
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D103]: ../plan/bootstrap/02-decision-log.md#d103
[D118-D123]: ../plan/bootstrap/02-decision-log.md#d118-d123
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D18]: ../plan/bootstrap/02-decision-log.md#d18
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I60]: 0060-server-independent-mode.md
[I7]: 0007-production-hosting-and-telemetry-backend.md
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
