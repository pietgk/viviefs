# Vision and scope

## Why ViViEfs exists (D1)

A reference stack for building a modern Expo app together with its backend, in a development environment that is
**AI-robust**: typesafe end to end, built from composable patterns, and documented so that humans and LLMs learn
the same way. The goal is architecture that avoids slop by making the right pattern the easy one and the wrong one
a compile or lint error.

It combines four ideas that are usually separate:

1. **Effect** as the backbone: typed errors, services and layers as ports, Schema at every boundary.
2. **Durable execution** in the Temporal sense: workflows, workers, retryable activities, replay using stored
   activity results, on the device as well as on the server.
3. **One datom log** as the single substrate for the durable journal, domain data, sync and tracing.
4. **Component-based React UI** with an explicit split between UI, logic and data.

## Consumers

Future apps built on this stack: BirVana (conversation-first Swedish learning, `~/ws/app/pietgk`), an ERP frontend,
and a GRC frontend (complyj domain). For now only an exemplar app lives here (D55); product apps get an
`apps/<product>-mobile` + `apps/<product>-server` slot later.

## The exemplar (D23)

An **evidence collection** workflow (GRC flavoured) that exercises every concept once:

1. Capture a photo (file stored by content hash).
2. Upload with retry (retryable activity).
3. Wait for reviewer approval (a `DurableDeferred` completed by a second person on the web).
4. Remind after 24h if still waiting (long `DurableClock` becomes a local notification).
5. Done.

Plus: crash and resume (force-quit mid-workflow), lease handoff to another device, server sync.

## In scope

- Expo SDK 58 app (iOS, Android, web) and a Node Effect server.
- Durable execution on device (resume on next launch) and server, one engine, one journal format.
- Offline-first data with a central sync server, server authoritative.
- Tracing derived from the log, local-first telemetry sinks.
- Docs site, exercises and lessons as part of delivery.
- Verify and qualification tooling.

## Out of scope (for now)

- Code running on a guaranteed schedule while the app is closed. The OS only guarantees local notifications;
  background tasks are opportunistic (D3, D24).
- Several people editing the same workflow execution at once (D13c).
- Multi-writer merge of workflow executions (D14): one lease holder at a time.
- Production hosting, deployment topology and production telemetry backends.
- Horizontal scale-out of the workflow engine (Effect Cluster is the later path, D39).
- Product-specific decisions of the consumer apps (for example BirVana's XState and voice ADRs).
