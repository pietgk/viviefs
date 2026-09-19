# Effect v4 - durable execution research (as of 2026-09-18)

Sources: npm registry (`npm view`), `https://github.com/Effect-TS/effect` cloned at tag
`effect@4.0.0-rc.115` (commit `4a05d49`, 2026-09-11), effect.website/docs/v4.
File paths below are relative to that checkout; `EFF=packages/effect/src`.
"[inference]" = my reading, not stated by the source. "[unverified]" = not checked against a primary source.

## 0. Correction to the premise: effect-smol is archived

- `Effect-TS/effect-smol` README (main): "Effect V4 Has Moved ... This repository is archived and read-only";
  full V4 history merged into `Effect-TS/effect` `main`; v3 lives on the `v3` branch.
  (https://github.com/Effect-TS/effect-smol/blob/main/README.md). effect-smol main stops at `4.0.0-beta.98`.
- npm `effect@4.0.0-beta.98` repository = effect-smol; `effect@4.0.0-rc.115` repository = `Effect-TS/effect`.

## 1. Release status, packages, consolidation

- npm dist-tags for `effect` (queried 2026-09-18): `latest: 3.22.2`, `rc: 4.0.0-rc.115`, `beta: 4.0.0-beta.107`
  (beta tag is stale). rc.115 published 2026-09-11. **v4 is a release candidate, not stable.**
- README.md:9 "Effect V4 is currently a release candidate"; install `npm install effect@rc` (README.md:11-15).
  Docs: https://effect.website/docs/v4/getting-started/installation line 10: RC "published under the `rc` tag";
  untagged install gives v3.
- MIGRATION.md:14-20: all ecosystem packages share one version number, released together.
- MIGRATION.md:22-37 "Package Consolidation": `@effect/platform`, `@effect/rpc`, `@effect/cluster` "and others now
  lives directly in `effect`". Remaining separate: `@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`,
  `@effect/opentelemetry`, `@effect/atom-*`, `@effect/vitest`.
- MIGRATION.md:40-50: unstable modules under `effect/unstable/*` (may break in minors): ai, cli, cluster, devtools,
  eventlog, http, httpapi, jsonschema, observability, persistence, process, reactivity, rpc, schema, socket, sql,
  workflow, workers.
- `migration/annotations/effect__workflow.yaml`: `@effect/workflow` -> `effect/unstable/workflow`.
  `@effect/experimental` PersistedQueue -> `effect/unstable/persistence/PersistedQueue`
  (`migration/annotations/effect__experimental__PersistedQueue.yaml`).
- So: `effect/unstable/{workflow,cluster,sql,persistence,rpc,reactivity,eventlog}`; SQL *drivers* stay separate
  (`@effect/sql-sqlite-react-native@4.0.0-rc.115` etc., README.md package table).
- No prose Workflow/Cluster guide found on effect.website/docs/v4 (`/docs/v4/workflow` -> 404; guides page lists no
  workflow page). Only API reference (`/docs/v4/api/...`) and in-repo `ai-docs/src/80_cluster/`.

## 2. Durable execution: Workflow module (`EFF/unstable/workflow/`)

Modules: Activity, DurableClock, DurableDeferred, DurableQueue, Workflow, WorkflowEngine, WorkflowProxy,
WorkflowProxyServer.

### Durability model = deterministic replay + journaled activity results (no fiber snapshots)
- The workflow body is re-executed from the top on resume; completed activities return their stored result.
  - Activity.ts:1-8 "`make` wraps an effect so the `WorkflowEngine` can execute it, store its result, or replay that
    result during a workflow run".
  - Activity.ts:121-124 (gotcha): "Only completed activity results are memoized. If the activity suspends ... its body
    runs again when the parent workflow replays. Side effects before the suspension can repeat".
  - WorkflowEngine.ts:376-378 "the engine re-runs the interrupted run and the replay observes the completion".
- What is persisted: JSON-encoded `Exit` of each activity (Activity.ts:144-145, 163-164, 179-182: success/error encoded
  via `Schema.toCodecJson`); workflow payload + final `Result`; DurableDeferred exits; clock wake-ups.
- Keys:
  - executionId = hash(`${workflowTag}-${idempotencyKey(payload)}`) (Workflow.ts:316-317); SHA-256 truncated to 16
    bytes hex via global `crypto.subtle` (workflow/internal/crypto.ts).
  - In-memory engine activity key: `${executionId}/${activity.name}/${attempt}` (WorkflowEngine.ts:817);
    deferred key `${executionId}/${deferred.name}` (WorkflowEngine.ts:857).
  - Cluster engine: each execution is an entity `Workflow/<tag>` with entityId = executionId
    (ClusterWorkflowEngine.ts:762-785); activity is a persisted RPC with primaryKey `${name}/${attempt}`
    (ClusterWorkflowEngine.ts:708-729, 793); storage key = `${entityType}/${entityId}/${tag}/${id}`
    (cluster/Envelope.ts:456-463) i.e. `Workflow/<tag>/<executionId>/activity/<name>/<attempt>`; SQL stores it in
    `message_id` (hashed if >255 chars, SqlMessageStorage.ts:11-14,105-108) with `UNIQUE(message_id)` and replies in a
    replies table (SqlMessageStorage.ts:~918-940, ~1049-1060).
  - [inference] Activities are keyed by *name + attempt*, not by call position, so activity names must be unique and
    stable within a workflow.

### Engines
- `WorkflowEngine.layerMemory` (WorkflowEngine.ts:655-885): "not suitable for production workflows that require
  durability" (663-666). State in JS Maps.
- `ClusterWorkflowEngine.layer` (cluster/ClusterWorkflowEngine.ts:838-856): requires `Sharding | MessageStorage`.
- No SQL-only engine without Cluster exists in the repo (only two `WorkflowEngine.makeUnsafe` callers:
  WorkflowEngine.ts:760 and ClusterWorkflowEngine.ts:376). The single-process durable path is
  `ClusterWorkflowEngine.layer` + `SingleRunner.layer` (see section 3).
- Custom engine: implement `WorkflowEngine.Encoded` (WorkflowEngine.ts:391-454) and wrap with `makeUnsafe`
  (472-648; "The implementation must correctly persist, resume, and encode workflow state", 467). Methods:
  `register, execute({executionId,payload,discard,parent}), poll, interrupt, interruptUnsafe, resume,
  activityExecute(activity, attempt), deferredResult(deferred), deferredDone({workflowName,executionId,deferredName,exit}),
  scheduleClock(workflow,{executionId,clock})`. Shared helper `makeDeferredState` (WorkflowEngine.ts:335-382).
  `WorkflowInstance` (228-300) holds executionId, scope, suspended/interrupted/abandoned flags, activity latch.

### Suspension / resume
- `Workflow.suspend` sets `instance.suspended = true` and self-interrupts the fiber (Workflow.ts:936-941);
  `intoResult` maps interrupt-while-suspended to `Suspended` result (Workflow.ts:659-725, esp. 699-700).
- Awaiting a missing `DurableDeferred` suspends; completing it (`deferredDone`) stores the exit and calls `resume`
  (WorkflowEngine.ts:860-869). External completion via tokens (DurableDeferred.ts:1-8, `token`/`tokenFromExecutionId`/
  `done`/`succeed`/`fail`, lines 418-637).
- Caller-side: `execute` loops on `Suspended` using `suspendedRetrySchedule`, default
  `min(exponential(200ms,1.5), spaced(30s))` (WorkflowEngine.ts:543-560, 650-653).
- `DurableClock.sleep`: durations <= `inMemoryThreshold` (default 60s) run as an in-memory `Effect.sleep` activity;
  longer ones use `engine.scheduleClock` + await deferred (DurableClock.ts:96-117). Cluster clock = persisted message
  with `DeliverAt` (ClusterWorkflowEngine.ts:797-834).
- `SuspendOnFailure` annotation (default false): any error suspends instead of failing; resume via
  `MyWorkflow.resume(executionId)` (Workflow.ts:960-975). `CaptureDefects` default true (Workflow.ts:943-958).
- Cluster: idle workflow entities released after 10s and "rebuilt from storage when the next message arrives"
  (ClusterWorkflowEngine.ts:756-760).

### Compensation
- `Workflow.withCompensation(effect, (value, cause) => ...)` registers a finalizer on the workflow-lifetime scope
  that runs only if the workflow ends in failure (Workflow.ts:889-927). Gotcha (903): "only registered for
  top-level effects in the workflow and do not work for nested activities". `Workflow.addFinalizer` (857-887);
  finalizers are skipped when a run is "abandoned" for replay elsewhere (865-867).
- [inference] Registration is in-memory; after a restart the replay re-executes the top-level step (activity result
  from journal) and re-registers the compensation.

### Idempotency / executionId
- `Workflow.make(tag, { payload, idempotencyKey, success?, error?, suspendedRetrySchedule?, annotations? })`
  (Workflow.ts:432-466); same payload key -> same executionId -> dedupe (cluster "run" RPC primaryKey `""`, i.e.
  one run per entity, ClusterWorkflowEngine.ts:764-772).
- `Activity.idempotencyKey(name, {includeAttempt})` = hash(executionId[-attempt]-name) for downstream APIs
  (Activity.ts:250-273).

### Retries
- `Activity.retry(options)` wraps `Effect.retry` and bumps `CurrentAttempt` (Activity.ts:214-248); since attempt is
  part of the journal key, each attempt is a separate journaled entry.
- Activities are auto-retried on *interruption* (e.g. runner shutdown): default `min(exponential(400,1.5), spaced(10s))`
  up to 10 attempts, overridable via `interruptRetryPolicy` (Activity.ts:139, 188-212).
- `DurableQueue` (DurableQueue.ts:1-19): offload to `PersistedQueue` worker; at-least-once; dead-lettered items leave
  the workflow parked.

### Versioning
- **No workflow versioning / patching API found** (grep for version/patch in workflow/ and ClusterWorkflowEngine.ts
  returns nothing relevant). [inference] Safe evolution = keep activity names stable, add new names for new steps,
  or new workflow tags for breaking changes.

## 3. Cluster / sharding storage and drivers

- `MessageStorage` service (cluster/MessageStorage.ts:52-~205): saveRequest/saveEnvelope/saveReply/repliesFor/
  requestIdForPrimaryKey/unprocessedMessages/resetShards/clearAddress/withTransaction. Impls: `SqlMessageStorage.layer`,
  `MessageStorage.layerMemory` (1165-1176), `layerNoop` (1162).
- `RunnerStorage`: `SqlRunnerStorage.layer` (tables `cluster_runners`, `cluster_locks`; pg/mysql advisory locks, other
  dialects use lock rows, SqlRunnerStorage.ts:50-58) or `RunnerStorage.layerMemory` (RunnerStorage.ts:239).
- **Single-node: `SingleRunner.layer({ shardingConfig?, runnerStorage?: "memory" | "sql" })`**
  (cluster/SingleRunner.ts:1-80): "meant for local, embedded, or small single-node setups"; no-op runner transport and
  health; message storage always SQL; requires `SqlClient | Crypto.Crypto` (Crypto hashes long dedup keys).
- `TestRunner` = all-memory (TestRunner.ts:33-34).
- SqlMessageStorage has explicit dialect branches for pg, mysql, mssql and an `orElse` sqlite branch
  (SqlMessageStorage.ts:110-116, 197-199, 917-940).
- SQL driver packages (README.md table; packages/sql/*): clickhouse, d1, libsql, mssql, mysql2, pg, pglite,
  sqlite-bun (`bun:sqlite`), sqlite-do (Durable Objects), sqlite-node (`node:sqlite`, needs Node >= 22.16, README.md),
  **sqlite-react-native** (peer `@op-engineering/op-sqlite >=17.1.2 <18`, sql/sqlite-react-native/package.json:67-70;
  sync query API by default, no streaming/`updateValues`, SqliteClient.ts:1-12), sqlite-wasm (peer `@effect/wa-sqlite`,
  has `OpfsWorker.ts`).
- **No expo-sqlite driver** exists (no package, no references in packages/sql).
- React Native caveats [inference, verify on device]: there is no `@effect/platform-react-native`; workflow executionId
  hashing uses global `crypto.subtle.digest` (workflow/internal/crypto.ts) and `Crypto` must be provided for
  SqlMessageStorage; Hermes does not ship WebCrypto `subtle` by default [unverified], so a polyfill
  (e.g. react-native-quick-crypto) or a custom `Crypto` layer would be needed. Cluster/Sharding in an app that is
  backgrounded/killed by the OS is untested territory [inference].

## 4. Other primitives relevant to local-first/offline

- Persistence (`EFF/unstable/persistence/`):
  - `KeyValueStore`: `layerMemory` (317), `layerFileSystem` (354), `layerSql` (495), `layerStorage(() => Storage)`
    for Web Storage (825); browser `BrowserKeyValueStore` in @effect/platform-browser.
  - `Persistence`: `layerMemory`, `layerKvs`, `layerSql`, `layerSqlMultiTable`, `layerRedis` (Persistence.ts:1132-1172).
  - `PersistedCache` (PersistedCache.ts:1-9): in-memory Cache then Persistence store; stores lookup `Exit` across restarts.
  - `PersistedQueue` (PersistedQueue.ts:1-12): schema-encoded durable queue, id de-dup, retries, at-least-once;
    `layerStoreMemory` (501), `layerStoreSql` (2021), `layerStoreRedis` (1260), `layerCleanup` (309).
  - `RateLimiter` (keyed persistence service).
- `Reactivity` (`EFF/unstable/reactivity/Reactivity.ts:1-11`): process-local key invalidation; SQL clients (incl.
  sqlite-react-native, which imports it) invalidate on mutations -> reactive queries.
- `EventLog` / `EventJournal` (`EFF/unstable/eventlog/`): typed event journal with replay, remote replicas, encryption,
  "sync offline clients" (EventJournal.ts:1-12); in-memory or IndexedDB journal + `SqlEventJournal`.
  Most directly local-first-oriented module.
- Core (stable, `EFF/`): `Schedule.ts`, `Queue.ts` (suspend/dropping/sliding strategies, Queue.ts:6, 168-238),
  `PubSub`, `Semaphore.ts`, `PartitionedSemaphore.ts`, `Latch.ts`, `FiberHandle`/`FiberMap`, `Tx*` STM structures.
  v3 `Mailbox` "was renamed and folded into Queue" (migration/annotations/effect__Mailbox.yaml:1-3).
- `Schema` provides JSON codecs used for all journal encoding (`Schema.toCodecJson`, Activity.ts:144-145).
- RPC: `EFF/unstable/rpc/` (Workflow uses `RpcMessage.ExitEncoded`, Workflow.ts:32); `WorkflowProxy`/
  `WorkflowProxyServer` expose workflows over RPC/HttpApi.

## 5. Persisting fibers / continuations

- Confirmed by design: nothing in Workflow/Cluster serializes a Fiber or continuation. Engines hold fibers only in memory
  (`fiber: Fiber.Fiber<...> | undefined` in ExecutionState, WorkflowEngine.ts:684-696) and durability comes from
  journaled activity/deferred results + re-running the workflow body (sources in section 2). No
  serialization facility in `EFF/Fiber.ts` (grep "serializ" -> none).
- Implications [inference]:
  1. Workflow code between activities must be deterministic (same inputs -> same activity names in the same
     conditions); non-deterministic values (time, random, UUIDs, reads of mutable local state) must be captured inside
     activities.
  2. In-memory state (closures, Refs, in-flight non-activity work) is lost on process death and recomputed on replay.
  3. Side effects outside activities repeat on every replay; activity bodies that suspend also repeat
     (Activity.ts:121-124) -> make them idempotent, use `Activity.idempotencyKey` for external APIs.
  4. Replay cost grows with number of activities per execution (each replay re-reads journal entries).
  5. Code changes to a workflow with in-flight executions are only safe if activity names/order-dependent logic stay
     compatible (no versioning API).
