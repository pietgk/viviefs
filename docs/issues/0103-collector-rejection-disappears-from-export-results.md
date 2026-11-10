# I103: Collector rejection disappears from export results

Status: ready-for-agent

Category: bug

Decide when: a telemetry backend other than the lab's sinks is chosen ([I7 Production hosting, deployment and telemetry backend][I7]), a device projects its own traces ([I20 The trace projector on iOS, Android and web][I20]), or a gate run finds spans missing in a lab sink

Found: 2026-10-29

## What

When an OTLP collector answers HTTP 200 with a partial success that rejects spans, the trace sink reports every span as acknowledged and shows neither the count nor the collector's message. Finding R05 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#r05-collector-rejection-disappears-from-export-results), which has the reproduction against a local receiver.

The sink in `libs/telemetry/src/trace-sink.ts` checks the status and ignores the body, and the trace projector advances its trace cursor. Advancing is right: OTLP forbids retrying a partial success, so keeping the cursor and sending again would be a wrong repair. What is wrong is the silence, and that `ExportResult.spans` is documented as spans the sink acknowledged.

Rechecked on main on 2026-11-10: the sink still ignores the body.

## Direction

Read the response; report accepted and rejected spans and the collector's message; tell a status that may be retried from one that may not. Say in [ADR-0018 Tracing derived from the log; telemetry sink pattern][ADR-0018] and the `TraceSink` contract that traces are derived from the log without loss, which is not the same as a collector having kept them.

## Comments

2026-11-10: Split from [I100 Address the repo-wide review findings][I100] in its triage and parked. Why it waits: the lab's sinks (Jaeger, otel-lgtm, motel) accepted every span in [P03 OTLP and motel][P03] and [P10 Trace projection][P10], so nothing is lost today; the repair matters when a backend that can refuse spans is in use.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0018]: ../adr/0018-tracing-and-telemetry-sinks.md
[I100]: 0100-address-the-repo-wide-review-findings.md
[I20]: 0020-trace-projector-on-devices.md
[I7]: 0007-production-hosting-and-telemetry-backend.md
[P03]: ../plan/bootstrap/06-qualification-gates.md#p03
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
