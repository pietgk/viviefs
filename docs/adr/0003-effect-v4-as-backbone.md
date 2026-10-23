# ADR-0003: Effect v4 as the backbone

Summary: Effect v4 is the backbone everywhere, one exactly pinned version for effect and every @effect package.

Status: Qualified

Date: 2026-09-20. Amended 2026-10-22 (Effect 4.0.5, the pin moved; the engine ignores a repeated deferred completion). Amended 2026-10-09 (Effect 4.0.2, the pin moved). Amended 2026-10-02 (Effect 4.0.0): pin the stable release, the
`unstable` segment left the import paths, and the language service's
`unstableApiUsage` rule is off.

Qualifying gate: [P01 Platform on SDK 58][P01]

Related: [D8 Effect everywhere][D8], [D9 Effect v4, pinned][D9]. [Architecture](../plan/bootstrap/03-architecture.md),
[research/01](../plan/bootstrap/research/01-effect-v4-durable-execution.md),
[research/02](../plan/bootstrap/research/02-effect-v4-react-native.md).

## Problem

A half-Effect codebase has two idioms. Types that stop at the HTTP or SQLite
boundary let agents slop past them. Effect v3 is the line being replaced; its
`unstable/*` modules are as unstable as v4's, without the v4 public surfaces
(`Workflow`, native OTLP, consolidated platform).

## Design

Effect is the backbone everywhere: services and Layers are the ports, Schema at
every boundary (including SQLite rows), typed errors, HttpApi and RPC contracts
shared with the client. Pin `effect` exactly (`4.0.5` since 2026-10-22; `4.0.0` was the first stable v4); every
`@effect/*` package is at the same version (they release together).

Greenfield started on the v4 RC, not v3. Public interfaces only. Workflows use
`effect/workflow`. SQL drivers stay in `@effect/sql-*`.

Workflow, sql, rpc, http, cli, reactivity and observability are still marked
`@stability unstable` in 4.0. The language service's `unstableApiUsage` rule
would warn on every use, and warnings fail `tsc` ([ADR-0029 Effect reference subtree and language service][ADR-0029]), so
`tsconfig.base.json` turns it off: depending on these modules is this decision,
and the exact pin below is its mitigation.

## Trade-offs

Modules marked `@stability unstable` may break in minor releases. The
mitigation is an exact pin, with upgrades as their own change that reruns verify
and makes the qualification ledger stale. Starting on v3 would buy stability at
the cost of a migration the grilling already refused.

## Failure-handling

[P01 Platform on SDK 58][P01] must show Effect v4 running on Expo SDK 58 / RN 0.88 / Hermes with
Workflow + Activity on the memory engine, on iOS and Android, with real
polyfills. A bundle without the crypto polyfill is the positive control (the
workflow check fails).

## Outcome

### Expected

One Effect idiom. Missing context is a compile error. All `@effect/*` at one
pinned RC.

### Observed

2026-09-20. Ledger pass `2026-09-20T13-34-27.833Z-a195ecaf` (dirty tree,
commit `aa5e3dd4`). Effect v4 RC ran on Expo `58.0.0-preview.3` / Hermes on
the iOS simulator and the Android emulator. With `expo-crypto` on
`globalThis.crypto`, 15 checks passed on both, including Workflow + Activity
on the memory engine. Without the polyfill, `workflow memory` failed on both.
Evidence: [2026-09-20-p01.md](../evidence/2026-09-20-p01.md). Qualified
2026-09-22 from that record. Not Accepted.

2026-10-02. Moved from `4.0.0-rc.116` to `4.0.0`, with `@effect/tsgo` 0.47.2.
The code changes were the import paths (`effect/unstable/*` became `effect/*`),
`effect/Encoding` becoming `effect/encoding/Base64` in the [P01 Platform on SDK 58][P01] checks, and the
Metro stub's path (`dist/sql/Migrator.js`; with the old path the iOS export
fails on the dynamic `import()`). `verify` was green on every project.
[P01][P01]-[P11 Identity][P11] passed again in one sequential run on `1a5175fa2`, run
`2026-10-02T14-20-51.580Z-2ce3b275`, clean tree, inputs unchanged during the
run, about 29 minutes. [P07 Device resume E2E][P07]'s notification-tap fallbacks were the same as in the
run of 2026-10-01.

2026-10-09: Effect 4.0.2, every `effect` and `@effect/*` pin moved in one
change, with `repos/effect` pulled from the `effect@4.0.2` tag
([ADR-0029 Effect reference subtree and language service][ADR-0029]). One behaviour change reached us: RPC spans follow the
OpenTelemetry RPC conventions (Effect-TS/effect#8867), so they are named after
the method alone (`Append`, no longer `RpcServer.Append`) and carry a span kind
and `rpc.system.name`. The [P11 Identity][P11] span review told the server's spans by the old
prefix and drew every call as staying on the device; it now tells them by kind
and `rpc.system.name`, and draws the recorded picture again. The app bundles
grew by about 7 KB of Effect code. `mise exec -- pnpm verify` was green.

2026-10-22: Effect 4.0.5, every `effect` and `@effect/*` pin moved in one
change, with `repos/effect` pulled from the `effect@4.0.5` tag. The trade-off
above held in a patch release: 4.0.3-4.0.5 changed the `effect/workflow`
internals the datom engine mirrors (deferred waits counted per run, a wake that
preempts a run), and on PGlite the engine then replayed for ever: on each replay
`scheduleClock` re-fired the clock that was already due, `completeDeferred` woke
the run although the deferred was already recorded, and the wake preempted the
replay that had just read the stored exit. The crash matrix and both tracing
suites timed out. A repeated completion now writes nothing and wakes nothing,
as in Effect's own engine; a run whose wake was lost to a crash is still
resumed by the launch sweep. 4.0.5 also takes `WorkflowInstance.initial`'s
scope as an options object. The engine's integration coverage then depended on
scheduling again ([I74 The engine's integration coverage depends on scheduling][I74]); a test now reaches `resume` of a finished run on purpose.
The bundles grew by about 33 KB of Effect code. [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed
in one sequential run on `2a56b18c0`, run `2026-10-22T15-07-32.252Z-5378fb60`, with Expo SDK 58 stable
([ADR-0004 Expo SDK 58 and Hermes platform baseline][ADR-0004]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0004]: 0004-expo-sdk-58-platform-baseline.md
[ADR-0029]: 0029-effect-reference-and-language-service.md
[D8]: ../plan/bootstrap/02-decision-log.md#d8
[D9]: ../plan/bootstrap/02-decision-log.md#d9
[I74]: ../issues/0074-engine-integration-coverage-depends-on-scheduling.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
