# I58: Several servers in the lab

Status: ready-for-human

Category: enhancement

Decide when: a consumer app needs organizations on more than one server, or the human schedules it for learning

## What

Nothing in ViViEfs runs on more than one server: organization isolation is proven on one (ADR-0022, P11), and production hosting is open (I7). Several servers, with organizations spread across them, can be learned and qualified in the lab on a laptop (local containers or a local Kubernetes) without being production (D101). Decide when and how: what the lab setup is, which claim a gate would prove, and what must stay possible meanwhile (D100).

From [I47](0047-what-viviefs-is-about.md). Read with I48, which asks what an app is to a device and a node: a server read as a node with a server signature changes what "several servers" means.

## Comments
