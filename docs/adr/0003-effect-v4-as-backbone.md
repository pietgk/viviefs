# ADR-0003: Effect v4 as the backbone

Summary: Effect v4 is the backbone everywhere, one exactly pinned version for effect and every @effect package.

Status: Qualified

Date: 2026-09-20. Amended 2026-10-02 (Effect 4.0.0): pin the stable release, the
`unstable` segment left the import paths, and the language service's
`unstableApiUsage` rule is off.

Qualifying gate: P01

Related: D8, D9. [Architecture](../plan/bootstrap/03-architecture.md),
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
shared with the client. Pin `effect` exactly (`4.0.0`, the first stable v4); every
`@effect/*` package is at the same version (they release together).

Greenfield started on the v4 RC, not v3. Public interfaces only. Workflows use
`effect/workflow`. SQL drivers stay in `@effect/sql-*`.

Workflow, sql, rpc, http, cli, reactivity and observability are still marked
`@stability unstable` in 4.0. The language service's `unstableApiUsage` rule
would warn on every use, and warnings fail `tsc` (ADR-0029), so
`tsconfig.base.json` turns it off: depending on these modules is this decision,
and the exact pin below is its mitigation.

## Trade-offs

Modules marked `@stability unstable` may break in minor releases. The
mitigation is an exact pin, with upgrades as their own change that reruns verify
and makes the qualification ledger stale. Starting on v3 would buy stability at
the cost of a migration the grilling already refused.

## Failure-handling

P01 must show Effect v4 running on Expo SDK 58 / RN 0.88 / Hermes with
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
`effect/Encoding` becoming `effect/encoding/Base64` in the P01 checks, and the
Metro stub's path (`dist/sql/Migrator.js`; with the old path the iOS export
fails on the dynamic `import()`). `verify` was green on every project. The
P01-P11 passes are stale until a sequential rerun on 4.0.0.
