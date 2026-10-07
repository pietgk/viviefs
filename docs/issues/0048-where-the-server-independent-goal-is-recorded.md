# I48: The server-independent goal, and what an app is to a device and a node

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Found: 2026-10-07

## What

Where is the server-independent goal recorded? [The 2026-09-30 communication research](../research/2026-09-30-communication-architecture.md) calls a server-independent mode "the confirmed goal", but it "changes none" of the freeze: the open items do not list it and no issue carries a `Decide when:`, so the five peer-to-peer rows of the inventory rest on research alone (I46). Decide whether the goal gets an open item, an issue with a `Decide when:`, or neither, so those rows cite a ViViEfs source; confirm or retrigger the deferrals that rest on [I7](0007-production-hosting-and-telemetry-backend.md).

[I47](0047-what-viviefs-is-about.md) widened this ticket (2026-10-07). Our words tie an app to a device, and that is challenged: the server is an app too (Glossary: App), a feature spans several apps (Glossary: Feature), the Expo app is one app on phone and web, a tool such as `verify` is an app that runs on a developer's laptop or in CI (D102), and a Device is "one installation of an app, on one phone or in one browser". The human's framing: client-server can be read as peer-to-peer where one or more nodes carry a server signature. Decide what an app is to a device and a node, so that D100 (out of scope means not yet) holds for a server-independent mode; the App, Device and Feature entries and the shape of the consumer apps in this repository (D55', a `<product>-mobile` + `<product>-server` pair or otherwise; I9) follow from it. `vivief:p2p-node-architecture` and `vivief:deployment-by-node-capability` below are this question in vivief. Start with a review page that works today's apps (the Expo app on phone and web, the Node server, a CLI tool) through client-server and server-as-signed-peer side by side.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (8): `vivief:datom-log-as-crdt`, `vivief:moq-iroh-transport`, `vivief:p2p-node-architecture`, `vivief:payload-blind-relay`, `vivief:room-code-discovery`, `vivief:deployment-by-node-capability`, `vivief:deployment-level-security`, `vivief:domain`.

## Comments
