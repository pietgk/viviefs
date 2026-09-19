# Effect v4 `effect/unstable/eventlog` as a sync transport - research notes

Date: 2026-09-18. Source: shallow clone of `Effect-TS/effect` main at `4d4c4e8` (= `effect@4.0.0-rc.115` + 48 commits).
Paths below are relative to `packages/effect/src/unstable/eventlog/` unless stated. Line numbers are at `4d4c4e8`.
"UNVERIFIED" = inference or claim not confirmed against a primary source.

## 1. Model

- **Typed event log.** Events are Schema-typed and grouped (`Event.ts`, `EventGroup.ts`); each event has a `primaryKey` derived from the payload. `EventLog.ts:1-10` - "the matching handler runs first, and the journal entry is committed only after the handler succeeds". Local write path: `EventLog.ts:900-930` (`journal.withLock(storeId)(journal.write({ effect: handler... }))`), then Reactivity keys invalidated per `primaryKey`.
- **Handlers = reducers/projections**, registered per group (`EventLog.group`, `EventLog.ts:533`). Optional **compaction** handlers (`groupCompaction`, `EventLog.ts:560-600`) and **reactivity** keys (`groupReactivity`, `EventLog.ts:668`). No separate "reactor/saga" concept.
- **Local journal** (`EventJournal.ts:42-117`): `entries`, `write`, `writeFromRemote`, `withRemoteUncommited`, `nextRemoteSequence`, `changes`, `withLock(storeId)`. Entry = `{id: UUIDv7 bytes, event, primaryKey, payload: SchemaBinary bytes}` (`EventJournal.ts:281-285`, id creation `:255`).
- **Replication.** Each client pushes its uncommitted entries (`withRemoteUncommited`) and consumes a server change stream from `nextRemoteSequence` (`EventLog.ts:808-895`). The server assigns a per-store monotonically increasing `sequence` (SQL: `PRIMARY KEY (store_id, sequence), UNIQUE (store_id, entry_id)`, `SqlEventLogServerUnencrypted.ts:88-100`). So: append-only, server-sequenced delivery, idempotent by entry id (duplicates detected, `EventJournal.ts:423-429`).
- **Ordering / conflicts.** Logical order is the *client-generated UUIDv7 timestamp*, not the server sequence: the memory journal re-sorts by `createdAtMillis` after import (`EventJournal.ts:467`). When a remote entry arrives that is *older* than local entries with the same `event`+`primaryKey`, those newer entries are passed to the handler as `conflicts` (`EventJournal.ts:439-455`; server-side equivalent `toConflicts`, `EventLogServerUnencrypted.ts:396-420`). The handler decides what to do. So it is **not a CRDT and not built-in LWW**; it is "ordered event log by client wall clock + app-defined conflict handling". LWW is the natural thing to implement in a handler (skip applying if `conflicts.length > 0`). Clock skew between devices directly affects ordering (UNVERIFIED as a documented caveat; inferred from code).
- **Multi-tenancy / auth.**
  - `StoreId` partitions everything (`CurrentStoreId`, `EventLog.ts:416`; server tables keyed by `store_id`).
  - Identity = client-held keypair (`EventLog.Identity`, `EventLog.ts:184-187`). Session auth is an Ed25519 challenge-response (`EventLogSessionAuth.ts:1-10`, `:369-426`); RPCs are bound to authenticated identities (PR #6896, changeset `.changeset/pre/secure-eventlog-identities.md`).
  - Server hooks (unencrypted server): `EventLogServerAuthorization.authorizeWrite/authorizeRead/authorizeIdentity` (`EventLogServerUnencrypted.ts:276-289`) and `StoreMapping.resolve/hasStore` (publicKey+storeId -> server store, `:303-314`). Write handler flow `:160-215`.
  - Encrypted server: stores ciphertext only, keyed by public key + store id; server never sees plaintext (`EventLogServerEncrypted.ts:1-11`).
  - No built-in integration with an external auth (JWT/session); you would map your user to public keys yourself via `authorizeIdentity`/`StoreMapping` (UNVERIFIED that this is the intended pattern; there are no docs).
- **Server-side handlers.** The unencrypted server runs the same group handlers on ingest, inside `storage.withTransaction` (`EventLogServerUnencrypted.ts:122-143`). A handler failure turns into `InternalServerError "Persistence failure"` (`:203-213`) and the client retries the whole uncommitted batch (`EventLog.ts:876-881`). There is **no "reject this event" protocol** - a business-rule rejection becomes a poison batch that blocks the client's upload queue (inferred from code, UNVERIFIED in practice).

## 2. Transport and storage

- **Transport:** plain Effect RPC (`EventLogRemote.ts:134-142` `RpcClient.make(EventLogRemoteRpcs)`); layers need `RpcClient.Protocol` (`EventLogRemote.ts:367-388`). Any RPC protocol works: `RpcClient.layerProtocolSocket` over `Socket.layerWebSocket` + `layerWebSocketConstructorGlobal` (core `unstable/socket/Socket.ts:792,1124`) or HTTP (`RpcClient.ts:996`). Messages chunked (`EventLogMessage.ts`). Server: `RpcServer.layer(EventLogRemoteRpcs)` (`EventLogServerUnencrypted.ts` ~`:825`) + any RpcServer protocol (migration notes: `migration/annotations/effect__experimental__EventLogServer.yaml` - `RpcServer.layerProtocolSocketServer` or `makeProtocolWithHttpEffectWebsocket`). Cloudflare adapter not ported (`effect__experimental__EventLogServer__Cloudflare.yaml`).
- **Server storage:** memory or SQL (`SqlEventLogServerUnencrypted.ts`, `SqlEventLogServerEncrypted.ts`) with dialect branches for pg/mysql/mssql and a default (sqlite). Tests: `packages/sql/pg/test/SqlEventLogServerUnencrypted.integration.test.ts`, `packages/sql/mysql2/test/...`, `packages/sql/sqlite-node/test/SqlEventLogServer{Encrypted,Unencrypted}.test.ts`.
- **Client journal:** `EventJournal.layerMemory` (`:517`), `EventJournal.layerIndexedDb` (`:793`), `SqlEventJournal.layer` (`SqlEventJournal.ts:321`, generic `SqlClient`, sqlite branch `:80-90`). Tested with `packages/sql/sqlite-node/test/SqlEventJournal.test.ts`. Changelog: fix for drivers returning BLOB as `ArrayBuffer` (#7498) - relevant to RN drivers.
- **React Native:** `@effect/sql-sqlite-react-native` exists (peer dep `@op-engineering/op-sqlite >=17.1.2 <18`, `packages/sql/sqlite-react-native/package.json`) -> `SqlEventJournal` should work on it (UNVERIFIED - no RN test in repo). No Node-only imports in the eventlog modules (only core/rpc/sql/encoding/workers/reactivity). **Blocker to check:** remote auth always uses WebCrypto `crypto.subtle` Ed25519 sign/importKey (`EventLogSessionAuth.ts:161-180, 366-426`), even for `layerUnencrypted`; encryption uses AES-GCM + SHA-256 subtle (`EventLogEncryption.ts:102-167`). Hermes has no `crypto.subtle`; you need a polyfill such as `react-native-quick-crypto` with Ed25519 subtle support (UNVERIFIED). Also uses `TextDecoder("utf-8", {fatal: true})` (`EventLogSessionAuth.ts:14`) - Hermes support UNVERIFIED.

## 3. Maturity

- Namespace is `unstable`; carried over from v3 `@effect/experimental` (added PR #3978, 2024-11).
- Tests: 8 files in `packages/effect/test/unstable/eventlog` (~1,050 lines) + 5 SQL-driver test files; roughly 30 test cases in core (count of `it(` lines). Source ~7,900 lines.
- Very active hardening in Jul-Sep 2026, and many were correctness bugs: #7029 wrong conflict history array, #7033 memory journal skipped first conflict, #7034 wrong remote sequence, #7042 imported entries not relayed, #7044 SQL journal committed before callback success, #7124 AES-GCM IV reuse per batch (wire change), #7401 remote writes not retried (issue #7400), #7862 Forbidden retry (issue #7861), #6613 duplicate chunks crash (issue #6612), effect-smol #2008 "fix eventlog skipping entries". Few user-filed issues -> small user base.
- No docs found on effect.website for v4 eventlog (UNVERIFIED - not exhaustively searched).
- Known app: `tim-smart/receipts` (Tim Smart, core maintainer; 43 stars; pushed 2026-09-10), browser app using `EventJournal.layerIndexedDb` + `EventLogRemote.layerEncrypted` over `BrowserSocket.layerWebSocket` (`src/EventLog.ts`). No Effect examples/templates or RN users found via GitHub code search.

## 4. Fit for durable workflow journals + domain data

Pros: typed Schema events, append-only, idempotent by entry id, server-sequenced catch-up, pluggable SQL both sides, pure Effect, store-level partitioning with auth hooks. Workflow execution rows / activity results are naturally append-only events keyed by (executionId, step) - this matches the model well.

Cons:
- Ordering by device wall clock; conflicts surface only to handlers. For a single device owning its workflows this is fine; for server-authoritative domain data it is weak.
- No server rejection / rebase semantics; a failing server handler blocks the client's upload queue.
- No partial/filtered sync (a client pulls the whole store from a sequence), no query-shaped subscriptions, no snapshots besides compaction.
- Auth is keypair-based, not integrated with your auth; WebCrypto Ed25519 needed on RN.
- Unstable API, small user base, recent correctness fixes.

### Comparison (primary docs / repos)

| | Licence | RN / Expo | Server requirements | Write model |
|---|---|---|---|---|
| Effect eventlog | MIT (effect repo) | No official RN path; SQL journal + `sql-sqlite-react-native` (op-sqlite) plausible, needs WebCrypto polyfill (UNVERIFIED) | Your Effect RPC server + SQL (pg/mysql/mssql/sqlite) | Append-only events, handler-defined conflict resolution |
| PowerSync | SDK Apache-2.0 (powersync-js); service FSL-1.1-ALv2 (powersync-service LICENSE) | Yes, op-sqlite; Expo Go via `@powersync/adapter-sql-js`, dev build for native ([docs](https://docs.powersync.com/client-sdk-references/react-native-and-expo)) | PowerSync Service (cloud or self-host) + source DB | Local SQLite writes queued, uploaded by your `uploadData()` connector to your API; server authoritative |
| ElectricSQL | Apache-2.0 | Expo listed as integration ([docs](https://electric.ax/docs/guides/writes)) | Postgres with logical replication + Electric sync service | Read-path only; writes via your API (online/optimistic/through-DB patterns) |
| Zero | Apache-2.0 (rocicorp/mono) | Yes, expo-sqlite or op-sqlite ([docs](https://zero.rocicorp.dev/docs/react-native)) | Postgres + `zero-cache` + your push endpoint | Optimistic client mutators re-run authoritatively on server; client rebases ([docs](https://zero.rocicorp.dev/docs/mutators)) |
| LiveStore | Apache-2.0 | Yes, Expo adapter on expo-sqlite, New Arch required ([docs](https://docs.livestore.dev/reference/platform-adapters/expo-adapter/)) | Sync backend: Cloudflare Workers/DO, Electric, or S2 | Event sourcing with materialized SQLite state (push/pull with rebase - UNVERIFIED from fetched page) |
| Triplit | AGPL-3.0 (aspen-cloud/triplit) | RN docs page did not render (UNVERIFIED) | Triplit server | Client DB with server sync (details UNVERIFIED); repo last pushed 2026-01-19 - looks inactive |

## Verdict

Effect eventlog is architecturally the closest match (Effect-native, typed append-only events, SQL journals both ends) and is a reasonable transport for **device-owned append-only workflow journals**, but it is unstable, has a tiny user base, had multiple correctness bugs fixed in the last two months, and has no RN story out of the box (WebCrypto Ed25519 requirement). It lacks server-authoritative rejection and partial sync, so for domain data shared with a central server a product like PowerSync (mature RN/Expo, server-authoritative upload queue) or Zero is safer. A pragmatic option: use Effect RPC directly with your own idempotent append/ack protocol for workflow journals (borrowing eventlog's sequence + entry-id design), and use PowerSync/Zero for domain data; or adopt eventlog only after a spike proving it on Hermes with op-sqlite.
