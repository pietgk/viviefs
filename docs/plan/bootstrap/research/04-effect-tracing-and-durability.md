# Effect v4 tracing / OpenTelemetry vs durable execution

Researched 2026-09-19. Effect source: Effect-TS/effect main @ `4d4c4e8a` (2026-09-18), `effect@4.0.0-rc.115`.
Paths below are relative to `packages/` in that clone unless they are URLs.
`[unverified]` = inferred or from a secondary source, not confirmed against a primary source.

---

## 1. Effect v4 tracing model

### Core types (`effect/src/Tracer.ts`)
- `Tracer` is a tiny interface: one `span({ name, parent, annotations, links, startTime, kind, root, sampled })` factory plus an optional `context` hook (`Tracer.ts:29-44`). Any backend is just a `Tracer` impl.
- `Span` (`Tracer.ts:372-429`): `name, spanId, traceId, parent, annotations, status, attributes, links, sampled, kind`, and `end(endTime, exit)`, `attribute(k,v)`, `event(name, startTime, attrs)`, `addLinks(links)`.
- `SpanLink = { span: AnySpan, attributes }` (`Tracer.ts:431`). `SpanKind = internal|server|client|producer|consumer` (`Tracer.ts:310`).
- `ExternalSpan` = `{ _tag: "ExternalSpan", traceId, spanId, sampled, annotations }` (`Tracer.ts:199-205`), built with `Tracer.externalSpan(...)` (`Tracer.ts:496`). This is how a span context that came off the wire (or out of a database) becomes a parent.
- `ParentSpan` is a fiber-cached context service holding the current `AnySpan` (`Tracer.ts:147,171`).
- `DisablePropagation` (`Tracer.ts:540`), `CurrentTraceLevel`/`MinimumTraceLevel` (`Tracer.ts:563,592`) gate span creation by level.
- Default `Tracer` reference is `nativeTracer` (`Tracer.ts:632,650`) which creates in-memory `NativeSpan`s and exports nothing. IDs are lazily generated random hex (`traceId` inherited from parent, else `Encoding.randomHex(32)`; `spanId` = `randomHex(16)`, `Tracer.ts:711-717`).

### Effect APIs (`effect/src/Effect.ts`)
- `withSpan` (`:8371`), `useSpan` (`:8347`), `makeSpan` / `makeSpanScoped` (`:8288,:8318`), `withParentSpan` (`:8446`), `currentSpan` (`:8119`), `annotateCurrentSpan` (`:8089`), `annotateSpans` (`:8047`), `linkSpans` / `spanLinks` (`:8251,:8202`), `withTracer` / `withTracerEnabled` (`:7963,:7992`).
- `Effect.fn("name")` (`:13659`) wraps the body in a span (via `withSpan`) and improves stack traces; `Effect.fnUntraced` (`:13535`) does not. The repo's own agent guide says: prefer `Effect.fn("name")` when tracing is useful, `fnUntraced` in library code / hot paths (`../LLMS.md:14-16,51-57`).

### Propagation
- HTTP: `unstable/http/HttpTraceContext.ts` writes both `b3` and W3C `traceparent` (`:41-50`) and reads `traceparent` first, then `b3`, then `x-b3-*` (`:57-72`). No `tracestate`/baggage.
- `HttpClient` creates a client span and injects headers when `TracerPropagationEnabled` is true (`unstable/http/HttpClient.ts:714-716`, ref at `:1638`).
- Server middleware makes a `kind: "server"` span whose parent is `TraceContext.fromHeaders(request.headers)` (`unstable/http/HttpMiddleware.ts:194-200`); opt-outs via `TracerDisabledWhen` / `SpanNameGenerator` (`:107,:128`).
- RPC: the `Request` message carries optional `traceId/spanId/sampled` (`unstable/rpc/RpcMessage.ts:72-74,424-426`), set by `RpcClient` from the current span (`RpcClient.ts:380-382,488-490`). `RpcServer` creates the handler span with `parent: Tracer.externalSpan({traceId, spanId, sampled})` and adds a *link* to the server fiber's local `ParentSpan` (`RpcServer.ts:326-345`).

### Exporters
- **Native, dependency-free OTLP in core**: `effect/unstable/observability` exports `Otlp`, `OtlpTracer`, `OtlpLogger`, `OtlpMetrics`, `OtlpExporter`, `OtlpSerialization`, `OtlpResource`, `PrometheusMetrics` (`effect/src/unstable/observability/index.ts:10-45`). `Otlp.layer({ baseUrl, resource, headers, ... })` wires `/v1/logs`, `/v1/metrics`, `/v1/traces` (`Otlp.ts:30-80`) and requires only an `HttpClient` + an `OtlpSerialization`. Serialization is either `layerJson` (plain `HttpBody.jsonUnsafe`) or `layerProtobuf` (hand-written encoder in `internal/otlpProtobuf.ts`, `application/x-protobuf`) (`OtlpSerialization.ts:37-64`). No `@opentelemetry/*` imports. The repo's own example uses `OtlpTracer.layer` + `OtlpSerialization.layerJson` + `FetchHttpClient.layer` (`../ai-docs/src/08_observability/20_otlp-tracing.ts:8-38`), and the section intro recommends the lightweight Otlp modules, with `@effect/opentelemetry` NodeSdk only for integrating with an existing OTel setup (`../ai-docs/src/08_observability/index.md:4-6`).
- **`@effect/opentelemetry` v4** (`opentelemetry/src/index.ts`): `NodeSdk`, `WebSdk`, `OtelTracer`, `OtelLogger`, `OtelMetrics`, `Resource`. It is a bridge onto the official SDK: all `@opentelemetry/*` packages are (optional) peer deps (`opentelemetry/package.json`), and `NodeSdk.Configuration` takes your own `spanProcessor`, `metricReader`, `logRecordProcessor` (`NodeSdk.ts:31-45`). It does *not* ship OTLP exporters itself - you bring `@opentelemetry/exporter-trace-otlp-*`.

---

## 2. Workflow / Activity / ClusterWorkflowEngine tracing

### Spans that exist
- `Workflow.execute` -> span `"<WorkflowName>.execute"`, annotated with `executionId` (`effect/src/unstable/workflow/Workflow.ts:355,368-372`). Also `.poll`, `.interrupt`, `.resume` spans with `executionId` attribute (`Workflow.ts:377,382,387`).
- `Activity` execution -> span named `activity.name`, annotated `executionId` (`workflow/Activity.ts:316-336`).
- Engine spans `WorkflowEngine.deferredResult`, `.deferredDone`, `.scheduleClock` (`workflow/WorkflowEngine.ts:579-625`).
- In the cluster engine, workflows are entities, so each `run`/`activity`/`deferred`/`resume` RPC gets an RpcServer span named `"Workflow/<Name>(<executionId>).<tag>"` (spanPrefix at `cluster/internal/entityManager.ts:221`) plus a client span `"<entityType>.client..."` unless `ClusterSchema.ClientTracingEnabled` is false (`cluster/Sharding.ts:1352-1353`, default true at `ClusterSchema.ts:163`).

### Is trace context persisted? Yes - on the message envelope
- `Envelope.Request` has optional `traceId`, `spanId`, `sampled` (`cluster/Envelope.ts:114-116,137-139,167-169,374-390`).
- `Sharding`'s entity client copies the RPC message's trace fields into the envelope (`cluster/Sharding.ts:1366-1376`); `ClusterWorkflowEngine.sendDiscard` stamps the current span (`ClusterWorkflowEngine.ts:184-193`); `Entity` keep-alive too (`Entity.ts:731-745`).
- `SqlMessageStorage` writes them as columns `trace_id VARCHAR(32)`, `span_id VARCHAR(16)`, `sampled` (`cluster/SqlMessageStorage.ts:137-143`, DDL e.g. `:853-856`) and reads them back into the envelope (`:220-226`).
- On delivery the entity manager spreads the stored envelope (incl. trace fields) into the RpcServer request (`internal/entityManager.ts:259-263,352-356,556-559`), and RpcServer uses them as `parent: externalSpan(...)` (`rpc/RpcServer.ts:334-339`).
- `DurableQueue` explicitly persists `traceId/spanId/sampled` in the queued item and the worker span is parented to it (`workflow/DurableQueue.ts:162-172,227-235,308-326`).

### Consequence for crash / resume
- Resume re-delivers the *same persisted* `run` request (`ClusterWorkflowEngine.resume` -> `sharding.reset(requestId)`, `ClusterWorkflowEngine.ts:285-301`). So a replayed run after a crash or suspension is a **new server span in the same trace, child of the original caller's `.execute`/client span** (which has usually already ended). Not a link, and not a continuation of the same span. [inference from code; not covered by a test I checked]
- Activities are dispatched as their own persisted `activity` requests carrying the span context of the run attempt that issued them (`ClusterWorkflowEngine.ts:604-640`).
- There is **no replay-awareness in tracing**: `Activity.makeExecute` always wraps in `withSpan`, even when `engine.activityExecute` just returns a stored reply (`Activity.ts:316-336`). A replayed workflow therefore emits fresh spans (new random span IDs) for already-completed activities. No deterministic span IDs, no "skip on replay" (contrast Temporal/AWS below). [inference from code]
- The in-memory `WorkflowEngine.layerMemory` persists nothing, so nothing survives a crash there.

---

## 3. Journal vs trace: overlap and prior art

### Conceptual overlap
Both are ordered, per-execution records of steps with timing and outcome. The difference is the contract: a journal is the source of truth that must be complete and transactionally consistent with side effects, so it can be replayed. A trace is best-effort telemetry.

### Prior art (primary docs)
- **Temporal**: Event History is "an append-only log of Events", "durably persisted by the Temporal Service", used for crash recovery and as an audit log; hard limit at 51,200 events (https://docs.temporal.io/workflow-execution/event). Tracing is separate: the TS SDK's `interceptors-opentelemetry` traces client -> workflow -> activity and propagates context "via protobuf message headers" (https://docs.temporal.io/develop/typescript/observability). The Python `OpenTelemetryPlugin` generates span IDs **deterministically from Workflow state** and does not export spans during replay, so worker restarts never duplicate spans; the older `TracingInterceptor` creates zero-duration spans "because an open span cannot survive replay" (https://docs.temporal.io/develop/python/platform/observability).
- **Restate**: traces are emitted live ("what is physically happening during an invocation, while it is happening"), not reconstructed from the journal. Spans: `invocation-start`, one `invocation-attempt` per retry, `invocation-end`. `ctx.run`, calls and sleeps are events inside the attempt span. W3C TraceContext is propagated to the service on every attempt (https://docs.restate.dev/server/monitoring/tracing). The journal itself is queryable via SQL, e.g. `select * from sys_journal where id = ...` (https://docs.restate.dev/operate/introspection).
- **DBOS**: `tracingEnabled: true` makes a span per workflow and per step (step span is child of workflow span), joins an incoming trace if present, emits to the global OTel tracer, optional direct OTLP via `enableOTLP` (https://docs.dbos.dev/typescript/tutorials/logging). The durable state lives in Postgres system tables, not in traces.
- **Inngest**: built-in run traces show each `step.*` as a bar with queue delay; "Extended Traces" use OTel (`@inngest/otel`) to nest your own spans and can export to collectors (https://www.inngest.com/docs/platform/monitor/traces).
- **AWS Durable Execution SDK**: the Workflow span keeps a deterministic span ID across re-invocations; replay/continuation segments get new span IDs and *link* to the initial logical operation span (https://docs.aws.amazon.com/durable-execution/sdk-reference/observability/opentelemetry/).
- **Dapr Workflows**: embeds `traceparent`/`tracestate` inside activity messages because long-lived gRPC streams do not carry headers; says the choice between parent-child and span links is still open (https://opentelemetry.io/blog/2026/dapr-workflow-observability/).
- **Record-replay debugging**: Temporal's replayer runs workflow code against a stored Event History (the journal), not against traces. [from general knowledge of Temporal SDK replay tests; not fetched this session - unverified]
- I found **no mainstream engine that uses the trace store as the journal**. Several derive traces *from* the journal's IDs (Temporal Python, AWS, Ballerina's "one trace per workflow instance derived from instance ID", https://github.com/ballerina-platform/module-ballerina-workflow/pull/120 - secondary).

### Why not use a tracing backend as the durability store
1. **Sampling**: an unsampled span "is not processed or exported"; head sampling decides before the trace is complete (https://opentelemetry.io/docs/concepts/sampling/). Effect's `OtlpTracer` returns early for `!span.sampled` (`effect/src/unstable/observability/OtlpTracer.ts:92-95`).
2. **Lossy export by design**: OTel spec's batch processor, "After the size is reached, spans are dropped"; processors SHOULD NOT retry (https://opentelemetry.io/docs/specs/otel/trace/sdk/). Effect's native exporter retries 3 times, then **clears the buffer and disables itself for 60 s** (`effect/src/unstable/observability/OtlpExporter.ts:185-188,218-224`), and `push` is a no-op while disabled (`:259`).
3. **Export only on span end**: spans open at crash time are never exported (`OtlpTracer.ts:92-99`, export called from `SpanImpl.end`). A journal must record intent *before* the effect.
4. **No transactional guarantees**: export is async and batched (`OtlpExporter.ts:250-266`); there is no way to commit a journal entry atomically with a DB write, which Effect cluster does get for activities with `ClusterSchema.WithTransaction` (`ClusterWorkflowEngine.ts:624,771-777`).
5. **No read-your-writes / query API for replay**: OTLP is write-only; backends are eventually consistent and vendor-specific. [general knowledge]
6. **Retention and limits**: tracing backends retain on the order of days to weeks and cap attribute sizes; journals must outlive the workflow (Temporal keeps history for a configured retention after close). [vendor-specific; unverified]
7. A community issue states the rule plainly: OTel "may be sampled, filtered, buffered, dropped, retained differently" and must not be the source of truth (https://github.com/getwinharris/agents/issues/133 - secondary source).

Useful synthesis: persist trace context *in* the journal (Effect already does, on envelopes) and consider deterministic span IDs derived from `executionId` + step to make replayed attempts reconcile, instead of the reverse.

---

## 4. OTel on React Native / Hermes

- OTel JS officially: "Client instrumentation for the browser is experimental and mostly unspecified" (https://opentelemetry.io/docs/languages/js/). React Native is not an officially supported target; community guides say the Node/web packages can work in RN but may break [SigNoz guide, https://signoz.io/docs/instrumentation/javascript/opentelemetry-react-native/ - secondary]. A known Hermes pitfall: the Hermes bytecode compiler rejects dynamic `import()`, which broke supabase-js when it lazily imported `@opentelemetry/api` (https://github.com/supabase/supabase-js/issues/2380).
- **Honeycomb** `@honeycombio/opentelemetry-react-native`: "primarily designed for, and tested on Hermes", needs native iOS/Android OTel SDKs, has an Expo plugin, status "experimental" (https://github.com/honeycombio/honeycomb-opentelemetry-react-native).
- **Embrace**: RN SDK "fully built on OpenTelemetry"; `@embrace-io/react-native-otlp` exports traces/logs to any OTLP/HTTP endpoint, requires `@embrace-io/react-native` (https://embrace.io/docs/react-native/features/otlp/, https://www.npmjs.com/package/@embrace-io/react-native-otlp).
- **Grafana Faro**: `grafana/faro-react-native-sdk`, described as "an experimental port of the faro web sdk to react native", with a `@grafana/faro-react-native-tracing` package (https://github.com/grafana/faro-react-native-sdk).
- **Effect-native OTLP on Hermes - likely works** [not run on a device]:
  - No `@opentelemetry/*` deps; transport is `FetchHttpClient` over `globalThis.fetch` (`effect/src/unstable/http/FetchHttpClient.ts:4-25`), which RN provides.
  - Use `OtlpSerialization.layerJson` (plain JSON body). `layerProtobuf` needs `TextEncoder` (`internal/protobuf.ts:84`) - available in recent Hermes [unverified which RN version].
  - Needs `BigInt` (span times are `bigint`, serialized with `String(...)`, `OtlpTracer.ts:281,361-362`). Clock falls back from `process.hrtime.bigint` to `performance.now()` to `Date.now()` (`effect/src/internal/effect.ts:6263-6279`). Hermes has BigInt since RN 0.70 [unverified].
  - IDs use `Math.random`-based hex, no `crypto` needed (`Tracer.ts:711-717`, `Encoding.ts:426`).
  - Mobile-specific caveats: the exporter buffers in memory and flushes on an interval/scope close (`OtlpExporter.ts:226-266`), so an app kill or background suspension loses the buffer; Otlp "trace" data from a phone should be treated as best effort (reinforces section 3).

---

## 5. effect.institute and effect.website

- **effect.institute**: title "effect.institute", meta description "Strange, semi-interactive lessons for learning Effect." (fetched HTML meta). Run by Kit Langton (@kitlangton; page links his X profile, a Discord and a `/changelog`). Format: narrated, autoplaying, semi-interactive lessons; homepage is mostly learner testimonials. No pricing, lesson list, or Effect version visible on the public homepage (https://www.effect.institute/). Whether it has in-browser exercises is [unverified].
- **effect.website docs**: versioned `/docs/v3` and `/docs/v4`, each with an API reference (`/docs/v4/api`, `/docs/v3/api`). v4 sidebar sections seen: Start Here (Welcome, Why Effect?, Installation), Getting Started (Devtools, Importing Effect, The Effect Type, Creating Effects, Running Effects, Using Generators, Building Pipelines), Error Management, Concurrency, plus `/docs/v4/guides` and `/docs/v4/onboarding`. Concept pages such as `/docs/observability/tracing` ("Tracing in Effect") exist. Pages have Markdown twins (e.g. `/docs/v4/onboarding.md`, `/docs/v4/getting-started/why-effect.md` return 200). **`/llms.txt`, `/llms-full.txt`, `/docs/llms.txt`, `/docs/v4/llms.txt` all 404** as of 2026-09-19 (curl). The LLM-oriented doc lives in the repo: `LLMS.md`, generated from `ai-docs/src/**` by `pnpm ai-docgen` (`../ai-docs/README.md`), with sections incl. `08_observability` and `80_cluster`.
