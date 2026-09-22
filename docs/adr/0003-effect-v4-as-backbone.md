# ADR-0003: Effect v4 RC as the backbone

Status: Qualified

Date: 2026-09-20

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
shared with the client. Pin `effect@4.0.0-rc.<n>` exactly; every `@effect/*`
package is at the same version (they release together).

Greenfield starts on v4 RC, not v3. Public interfaces only. Workflows use
`effect/unstable/workflow`. SQL drivers stay in `@effect/sql-*`.

## Trade-offs

v4 is a release candidate. `unstable/*` may break in minor releases. The
mitigation is an exact pin, with upgrades as their own change that reruns verify
and makes the qualification ledger stale. Starting on v3 would buy stability at
the cost of a migration the grilling already refused.

## Failure-handling

P01 must show Effect v4 RC running on Expo SDK 58 / RN 0.88 / Hermes with
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
