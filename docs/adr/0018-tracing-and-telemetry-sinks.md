# ADR-0018: Tracing derived from the log; telemetry sink pattern

Status: Qualified

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

P03, 2026-09-20. Ledger pass
`2026-09-20T18-30-20.436Z-58dbe271`. Effect's native OTLP tracer
(`OtlpTracer` + JSON + `fetch`) exported `p03.known-span` from Hermes on
the iOS simulator and the Android emulator into motel 0.2.8. A
wrong-endpoint export (`http://127.0.0.1:27687`) completed without a
crash and left no motel row for that token. The physical-device path is
documented as LAN binding (`MOTEL_OTEL_HOST=0.0.0.0`) or cursor catch-up
(P10). motel 0.2.8 does not start against Effect RC 116; the probe runs
it from `vendor/motel` with Effect `4.0.0-beta.90` overrides. Evidence:
[2026-09-20-p03.md](../evidence/2026-09-20-p03.md),
[p03-physical-device.md](../evidence/p03-physical-device.md).

P10, 2026-09-26. Ledger pass `2026-09-26T19-10-56.537Z-f5fe7b81` on a
clean tree (`4e880f3a`). One crash-and-resume execution on sqlite-node and
on PGlite: `step-one` killed after its body ran, a launch sweep resumed it,
`fetch` retried, a caller completed a deferred, a durable clock fired. The
trace projector derived 7 durable spans in one trace, with entity-keyed ids
that a fresh trace cursor derived again identically. `step-one` ran twice
and has one span; `fetch #2` links `fetch #1`. A refused send kept the trace
cursor; a disabled trace cursor sent nothing and, re-enabled, exported the
whole backlog (positive control). motel 0.2.8, Jaeger 2.20.0 and otel-lgtm
0.33.1 each held exactly those 7 span ids, parented to the workflow span,
and nothing for that trace before the export.

Picks agreed in the [P10 design review](../evidence/p10-design-review.md):
one trace per execution, linked to the caller's span rather than nested in
it; a pinned `viviefs/activity/started` start fact per attempt; the causing
span rule for envelopes; live spans only in activity bodies; the projector
posts OTLP/JSON itself instead of using the batching `OtlpTracer`;
zero-length deferred spans; `sampled` recorded and not yet honoured. P10
did not need command spans, so ids are not extended to changesets. Not
measured: the projector on a device, `sampled`, the trace cursor holding
back compaction. Evidence:
[2026-09-26-p10.md](../evidence/2026-09-26-p10.md).
