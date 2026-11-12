# ViViEfs

The docs site is [https://pietgk.github.io/viviefs/](https://pietgk.github.io/viviefs/), the same site as `pnpm docs:prod`.

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

The foundation is built and qualified; no pattern is delivered yet.

- **Built**: the libraries in `libs/`, the evidence app and its server in `apps/` and `features/`, and the checks
  in `tools/`. Gates P01-P11 passed in one sequential run on `8caa2e6c2` (2026-10-31); what each gate proves is on
  the docs site under Reference > Claims.
- **Not delivered yet**: a pattern is delivered only with qualification evidence, an exemplar that passes `verify`,
  and a guide a person accepted. The first guide, [the log store](apps/docs/src/content/docs/guides/log-store/index.mdx),
  is a draft.
- **What is being worked on**: [docs/plan/next-session.md](docs/plan/next-session.md), one screen.
- **Why it is built this way**: the design context in [docs/plan/bootstrap](docs/plan/bootstrap/README.md) and the
  decisions in [docs/adr](docs/adr/README.md).

## Try it

The toolchain is pinned in `mise.toml` (Node, pnpm, bun, and Java for the Android emulator).

```sh
mise install
mise exec -- pnpm install
mise exec -- pnpm docs:prod                  # the docs site, with the guides
mise exec -- pnpm exercise log-store 01.01   # the first exercise: it fails until you solve it
mise exec -- pnpm verify                     # every check a change must pass
```

## Licence

[Apache License 2.0](LICENSE)
