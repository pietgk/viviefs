# ADR-0018: Tracing derived from the log; telemetry sink pattern

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P03, P10

Related: D32, D45'. [Architecture section 11](../plan/bootstrap/03-architecture.md),
[research/04](../plan/bootstrap/research/04-effect-tracing-and-durability.md).

## Problem

Live `withSpan` tracing does not survive a kill: export happens on span end,
OTLP is lossy and sampled, and a tracing backend is not a journal. Replay
would duplicate spans if ids were random. A Docker-only collector fights
local-first privacy.

## Design

Trace context (`traceId`, `spanId`, `sampled`) is stored in every changeset's
envelope (D58). A trace projector reads the log from its own cursor and emits
spans with deterministic ids derived from `executionId + activity + attempt`.
Replays emit nothing new for stored results; new attempts link to previous
ones. Extending that scheme to changeset ids for command spans is new, not
grilled; keep it only if P10 needs command spans.

Export through Effect's native OTLP exporter (`effect/unstable/observability`,
JSON serialization, `fetch`). No `@opentelemetry/*` dependencies. Live
`withSpan` / `Effect.fn` inside activities is parented to the durable spans.
The tracing backend is never the store the engine reads from.

Telemetry sink is a pattern with three implementations behind one OTLP/HTTP
endpoint config: **motel** (default: local, no container, SQLite, agent
skill), Jaeger (Apple Container, parity with complyj), otel-lgtm (Apple
Container, metrics and dashboards). One smoke test per implementation.

## Trade-offs

Deriving traces from the log is extra projector code and is the only way a
killed app loses nothing. motel is a single-maintainer project; the sink is
behind a contract so it can be swapped.

## Failure-handling

P03: a known span arrives in motel from the simulator; physical-device path
documented (LAN binding or cursor catch-up). Positive control: wrong endpoint
produces no motel entry and no crash.

P10: crash-and-resume produces one trace with deterministic span ids, no
duplicates on replay, attempts linked; the same smoke test against motel,
Jaeger and otel-lgtm. Positive control: disabling the trace cursor loses
nothing; re-enabling exports the backlog.

## Outcome

### Expected

Lossless, replay-stable traces. motel is the default viewer. No OTel SDK
dependency.

### Observed

Not yet run. Native OTLP on Hermes (BigInt, fetch, JSON) is unverified.
