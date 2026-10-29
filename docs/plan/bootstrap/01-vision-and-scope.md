# Vision and scope

## Why ViViEfs exists (D1)

A reference stack for building apps, today an Expo app for iOS, Android and the web and a Node.js server that holds authority
for every organization ([D103 Nodes and authority][D103]), in a development environment that is **AI-robust**: typesafe end to
end, built from composable patterns, and documented so that humans and LLMs learn the same way. The goal is architecture that avoids slop by making the right pattern the easy one and the wrong one
a compile or lint error. What ViViEfs is about, app creation, is [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s; this page says what it
builds ([D95 App creation][D95]).

It combines four ideas that are usually separate:

1. **Effect** as the backbone: typed errors, services and layers as ports, Schema at every boundary.
2. **Durable execution** in the Temporal sense: workflows, workflow runners, retryable activities, replay using stored
   activity results, on the device as well as on the server.
3. **One datom log** as the single substrate for the durable journal, domain data, sync and tracing.
4. **Component-based React UI** with an explicit split between UI, logic and data.

## Consumers

Apps built on this stack: BirVana (conversation-first Swedish learning, `~/ws/app/pietgk`), an ERP frontend, and a
GRC frontend (complyj domain). They live in this repository ([D55' Consumer apps live here][D55']), each an `apps/<product>-client` +
`apps/<product>-server` ([D106 Consumer app shape][D106]); the first arrives once the exemplar is more mature.

## The exemplar (D23)

An **evidence collection** workflow (GRC flavoured) that exercises every concept once:

1. Capture a photo (file stored by content hash).
2. Upload with retry (retryable activity).
3. Wait for reviewer approval (a `DurableDeferred` completed by a second person on the web).
4. Remind after 24h if still waiting (long `DurableClock` becomes a local notification).
5. Done.

Plus: crash and resume (force-quit mid-workflow), handoff to another device ([D14' The journal is the fence][D14']), sync.

## In scope

- Expo SDK 58 app (iOS, Android, web) and a Node Effect server.
- Durable execution on device (resume on next launch) and server, one workflow engine, one journal format ([D39' One engine, one journal, one fence][D39']).
- Offline-first data synced with the sync node that holds authority, today the server ([D103 Nodes and authority][D103], [D142 Sync from the start][D142]).
- Tracing derived from the log, local-first telemetry sinks.
- Docs site, exercises and lessons as part of delivery.
- Verify and qualification tooling.
- Each consumer app makes its own product-specific choices (BirVana's XState and voice ADRs, for example) in its own
  apps, features and attribute namespace ([D106 Consumer app shape][D106]); the stack's ADRs and guides take none of them ([D159 Product choices stay with the consumer app][D159]).
  Where a consumer app keeps its own ADRs is decided with the first one.

## Out of scope (for now)

Out for now, never ruled out ([D100 Out of scope means not yet][D100]). Each item says what must stay possible, and whether it is
production only, and so learnable in the lab, or not yet at all ([D101 Lab and production][D101], [D158 The out-of-scope list, item by item][D158]). Every ADR's
Trade-offs names the items it makes harder ([I57 Out-of-scope items in an ADR's trade-offs][I57]).

- Code running on a guaranteed schedule while the app is closed. The OS only guarantees local notifications;
  background tasks are opportunistic ([D3 Resume on next launch][D3], [D24 Durable clocks and notifications][D24]). Must stay possible: due work is a fact in the
  log, never a timer in memory (a `wake_at` datom, the run's journal), and resuming needs only the journal, so a
  later OS guarantee or a background task can pick it up by the same sweep ([D14' The journal is the fence][D14']). Not yet at all: the limit is
  the platform's.
- Two writers on one workflow execution at once, their histories merged afterwards. A run has one writer at a
  time and is always one history; a writer that is behind is refused ([D14' The journal is the fence][D14']), because an activity's side effects
  cannot be merged afterwards. Must stay possible: several people, on any device or the server, work on one run
  through its outside inputs, write-once on their own entity, which never move the head ([D11 Human steps as deferreds][D11], [D40 Server-side human steps][D40]); a
  refused history strands no user content ([D147 User content outside the journal][D147], [D148 Quarantine is rejected user content][D148]). Not yet at all: a design choice, not a
  production gap.
- Production hosting, deployment topology and production telemetry backends ([I7 Production hosting, deployment and telemetry backend][I7]). Must stay possible:
  the server is a composition of Layers configured from its environment, telemetry leaves through OTLP to any
  backend (the [P10 Trace projection][P10] sinks are the lab's), and identity is any OIDC provider behind the `Identity` service ([D47 Identity via OIDC][D47]).
  Production only, learnable in the lab.
- Several servers, with organizations spread across them ([I58 Several servers in the lab][I58]). Today one server holds authority for every
  organization ([D103 Nodes and authority][D103]). Must stay possible: authority is held per organization, so which sync node holds an
  organization's authority can differ between organizations; every request and changeset names its organization
  and the server never trusts a client's ([D18 Organization isolation on the server][D18]); `tx` is corrected against the sync node holding authority, not
  "the server" ([D118-D123 The datom and its store][D118-D123]). Production only, learnable in the lab.
- Horizontal scale-out of the server's workflow engine: more workflow runners writing on each run's journal head ([D39' One engine, one journal, one fence][D39'],
  [I8 Workflow engine scale-out and more workflow runners on the server][I8]). Must stay possible: the head check is made in one step with the append ([D14' The journal is the fence][D14']), a workflow runner claims a
  step before acting, and `WorkflowEngine` stays the one interface, so Effect Cluster stays possible behind it.
  Production only, learnable in the lab.
- A server-independent mode: a group keeps working without its original operator, with authority moved
  to another sync node or shared by all ([D104 The server-independent goal][D104], [I60 Server-independent mode][I60]). Must stay possible: authority as duties a sync node holds,
  acceptance rules any sync node could run, partial data per sync node, catch-up by each writer's progress, signed
  authorship, membership any member can check, and connectivity apart from acceptance ([D105 What must stay possible][D105]). Learnable in
  the lab ([D101 Lab and production][D101]).

Features deferred with a `Decide when:` stay in their issues, not in this list ([D158 The out-of-scope list, item by item][D158]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../../adr/0032-what-viviefs-is-about.md
[D100]: 02-decision-log.md#d100
[D101]: 02-decision-log.md#d101
[D103]: 02-decision-log.md#d103
[D104]: 02-decision-log.md#d104
[D105]: 02-decision-log.md#d105
[D106]: 02-decision-log.md#d106
[D11]: 02-decision-log.md#d11
[D118-D123]: 02-decision-log.md#d118-d123
[D14']: 02-decision-log.md#d14p
[D142]: 02-decision-log.md#d142
[D147]: 02-decision-log.md#d147
[D148]: 02-decision-log.md#d148
[D158]: 02-decision-log.md#d158
[D159]: 02-decision-log.md#d159
[D18]: 02-decision-log.md#d18
[D24]: 02-decision-log.md#d24
[D3]: 02-decision-log.md#d3
[D39']: 02-decision-log.md#d39p
[D40]: 02-decision-log.md#d40
[D47]: 02-decision-log.md#d47
[D55']: 02-decision-log.md#d55p
[D95]: 02-decision-log.md#d95
[I57]: ../../issues/0057-out-of-scope-items-in-adr-trade-offs.md
[I58]: ../../issues/0058-several-servers-in-the-lab.md
[I60]: ../../issues/0060-server-independent-mode.md
[I7]: ../../issues/0007-production-hosting-and-telemetry-backend.md
[I8]: ../../issues/0008-engine-scale-out.md
[P10]: 06-qualification-gates.md#p10
