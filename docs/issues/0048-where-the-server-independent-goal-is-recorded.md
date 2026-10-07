# I48: The server-independent goal, and what an app is to a device and a node

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Found: 2026-10-07

## What

Where is the server-independent goal recorded? [The 2026-09-30 communication research](../research/2026-09-30-communication-architecture.md) calls a server-independent mode "the confirmed goal", but it "changes none" of the freeze: the open items do not list it and no issue carries a `Decide when:`, so the five peer-to-peer rows of the inventory rest on research alone (I46). Decide whether the goal gets an open item, an issue with a `Decide when:`, or neither, so those rows cite a ViViEfs source; confirm or retrigger the deferrals that rest on [I7](0007-production-hosting-and-telemetry-backend.md).

[I47](0047-what-viviefs-is-about.md) widened this ticket (2026-10-07). Our words tie an app to a device, and that is challenged: the server is an app too (Glossary: App), a feature spans several apps (Glossary: Feature), the Expo app is one app on phone and web, a tool such as `verify` is an app that runs on a developer's laptop or in CI (D102), and a Device is "one installation of an app, on one phone or in one browser". The human's framing: client-server can be read as peer-to-peer where one or more nodes carry a server signature. Decide what an app is to a device and a node, so that D100 (out of scope means not yet) holds for a server-independent mode; the App, Device and Feature entries and the shape of the consumer apps in this repository (D55', a `<product>-mobile` + `<product>-server` pair or otherwise; I9) follow from it. `vivief:p2p-node-architecture` and `vivief:deployment-by-node-capability` below are this question in vivief. Start with a review page that works today's apps (the Expo app on phone and web, the Node server, a CLI tool) through client-server and server-as-signed-peer side by side.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (8): `vivief:datom-log-as-crdt`, `vivief:moq-iroh-transport`, `vivief:p2p-node-architecture`, `vivief:payload-blind-relay`, `vivief:room-code-discovery`, `vivief:deployment-by-node-capability`, `vivief:deployment-level-security`, `vivief:domain`.

## Answer

Decided with the human on 2026-10-07, on [the review page](../research/2026-10-07-app-device-node-review.html) that works today's apps through client-server and server-as-signed-peer side by side. An app is the program; a `node` is one installation of an app that keeps all or part of an organization's data and writes changes to it; a device is the `node` a person uses; authority (accept or reject, order, grant membership, fence leases) is a set of duties a `node` holds, and today one `node`, the server, holds all of them. Client-server is ViViEfs's one authority model, read as peer-to-peer in which one `node` carries the server's authority. The decisions are D103-D106; [ADR-0032](../adr/0032-what-viviefs-is-about.md) states them under "Nodes and authority". The glossary gains Server, and Device and ViViEfs are reworded; `node` clashes with Node.js, so its entry waits for map 3 (comment on I34).

| Row | Disposition |
| --- | --- |
| `vivief:p2p-node-architecture` | adopt, as `node`s with authority as a role (D103); vivief's typed nodes with capabilities not adopted; the mode itself deferred, `Decide when:` I60 |
| `vivief:datom-log-as-crdt` | defer, `Decide when:` I60; its question whether server authority is the fixed answer is answered no (D104) |
| `vivief:moq-iroh-transport` | defer, `Decide when:` I60; connectivity stays apart from acceptance, HTTP kept for enterprise (D105) |
| `vivief:payload-blind-relay` | defer, `Decide when:` I60, with I15 for the keys |
| `vivief:room-code-discovery` | defer, `Decide when:` I60 |
| `vivief:deployment-by-node-capability` | defer, `Decide when:` I7 confirmed; a self-hosted server is one more `node` holding authority |
| `vivief:deployment-level-security` | defer, `Decide when:` I7 confirmed |
| `vivief:domain` | keep ours: a consumer app, with its apps, features and attribute namespace, is ViViEfs's form of a vivief `domain` (D106) |

- **Where the goal is recorded** (D104): an out-of-scope line in [01-vision-and-scope](../plan/bootstrap/01-vision-and-scope.md), learnable in the lab, and [I60](0060-server-independent-mode.md) with its `Decide when:`. The five peer-to-peer rows cite I60.
- **Holochain** is kept possible as a model, not as the runtime; the wording was checked against its primary documentation (D104, D105).
- **What must stay possible** is D105's list; I57's Trade-offs line checks decisions against it.
- **Consumer apps** are `<product>-client` + `<product>-server` (D106); renaming `evidence-mobile` is [I61](0061-rename-evidence-mobile-to-evidence-client.md). ADR-0002 and the vision page's `-mobile` wording follow in I59.

## Comments
