# ViViEfs

**Vision - View - Effects.** A reference stack for building modern Expo apps together with their backend, in a
development environment designed to be robust for AI-assisted work: typesafe end to end, composed from explicit
patterns, and documented so that humans and LLMs learn it the same way.

## The ideas it combines

- **Effect** as the backbone: typed errors, services and Layers as ports, Schema at every boundary.
- **Durable execution** in the Temporal sense, on the device as well as on the server: workflows, retryable
  activities, replay using stored results. Built on Effect's `Workflow` API over one engine.
- **One datom log** as the single substrate for the durable journal, domain data, offline-first sync and tracing.
  Single-datom transactions, changesets for atomic changes and drafts, a hybrid logical clock.
- **Tracing as a projection of the log**, exported to local-first telemetry sinks.
- **Component-based React UI** with an explicit split between domain facts, interaction state and in-flight input.
- **Verify - Qualify - Teach**: a pattern is delivered only when it is verified, qualified by evidence, and taught
  through docs and exercises.

## Status

Design phase. The complete design context lives in [docs/plan/bootstrap](docs/plan/bootstrap/README.md). No
production code exists yet; the first work is a set of qualification gates that prove the platform and the core
patterns.

## Licence

[Apache License 2.0](LICENSE)
