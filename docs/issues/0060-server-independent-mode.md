# I60: Server-independent mode

Status: ready-for-human

Category: enhancement

Decide when: a consumer app needs a group to keep working without its original operator, or the human schedules it for learning in the lab (D101)

Found: 2026-10-07

## What

ViViEfs has one authority model, client-server, and wants a server-independent mode beside it without building it yet (D104). Server-independent means the original operator is unnecessary for the agreed operations: relays, discovery services and storage replicas may help if they are replaceable and hold no authority. Decide which form the mode takes, which gate qualifies it, and when.

From [I48](0048-where-the-server-independent-goal-is-recorded.md) (D103-D106, [ADR-0032](../adr/0032-what-viviefs-is-about.md) "Nodes and authority"). The words: a `node` is one installation of an app that keeps all or part of an organization's data and writes changes to it; authority is the set of duties to accept or reject each change, order the accepted ones, grant membership and fence leases. Today one `node`, the server, holds all of them.

### Where the goal comes from

[Enterprise and P2P communication architecture](../research/2026-09-30-communication-architecture.md) is the research record of 2026-09-30 that first wrote the goal down, as "both enterprise authority and a genuinely server-independent mode". It is discussion material, not a decision; it changed nothing in the scope freeze. Its main point is that three questions are separate and must not be decided as one:

- **Connecting**: how two `node`s reach each other (HTTP today; Iroh, WebRTC or libp2p as candidates).
- **Reconciling**: how one `node` learns what another has that it lacks (today a cursor into the server's sequence).
- **Authority**: who may accept a change, so that it counts.

It sketches three deployments: an **enterprise hub** (today), **enterprise with peer exchange** (devices pass accepted history to each other but cannot accept), and an **independent group** (invited devices with their own trust root, signed permission history and merge rules, no server). It names working with no infrastructure at all, especially browser to browser, as undecided, and the next evidence as a paired exemplar doing the same useful operation in both modes.

### The hypotheses

- **Authority moves**: another `node` of the group, such as a practitioner's desktop, takes over the duties. One acceptance contract; D36 is unchanged. Decisions keep this possible now.
- **Authority is shared**: no single holder. Either the research record's independent group, or validation by every `node` as Holochain does it: each author writes its own signed, hash-chained journal; each `node` holds and validates a shard of the shared data by the app's shared rules; invalid data gets signed warrants; a newcomer joins with a membrane proof that existing members check ([source chain](https://developer.holochain.org/concepts/3_source_chain/), [DHT](https://developer.holochain.org/concepts/4_dht/), [validation](https://developer.holochain.org/concepts/7_validation/), read 2026-10-07). Holochain is an input as a model, not as the runtime (a Rust conductor, wasm zomes, CAL-1.0).
- **No infrastructure whatsoever**: undecided.

### What must stay possible meanwhile

D105's seven items: authority as duties a `node` holds; acceptance rules any `node` could run (the server's `accept` in `libs/sync/server/src/server.ts` mixes them with SQL today); a `node` holding part of an organization; catch-up by each writer's progress; signed authorship; membership any member can check; connectivity apart from acceptance.

### Inputs when it is picked up

- A review page that works the hypotheses through the research record's field-team scenario: two devices lose connectivity, record evidence, receive conflicting permission changes and reconnect; then a lost device and an exclusive external action.
- Holochain from primary sources, as a model.
- Iroh against WebRTC and libp2p on physical devices and target browsers, as the research record's §6 lists.
- I15 (keys, signed changesets), I58 (several servers, which under D103 are several `node`s holding authority), I53 (sync and conflict).

### Inventory rows deferred here (I48)

`vivief:p2p-node-architecture` (the mode; the `node` reading itself is adopted in D103), `vivief:datom-log-as-crdt`, `vivief:moq-iroh-transport`, `vivief:payload-blind-relay` (keys with I15), `vivief:room-code-discovery`.

## Comments
