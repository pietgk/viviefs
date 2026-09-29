# Upstream issues (drafts, not filed)

Drafted 2026-09-29 for a human to post. Each names what we observed, where the
cause is in Effect's source, and our workaround. Update the status line when
one is posted or fixed, and drop the workaround in the same change as the fix.

| Draft | Where | Status |
| --- | --- | --- |
| [1](#1-sqlite-wasm-client-waits-forever-when-its-worker-fails-before-it-is-ready) | new issue on `Effect-TS/effect` | not posted |
| [2](#2-comment-on-effect-ts-effect-6347) | comment on [#6347](https://github.com/Effect-TS/effect/issues/6347) (open; transferred out and back on 2026-07-14) | not posted |

## 1. sqlite-wasm client waits forever when its worker fails before it is ready

**Title:** `@effect/sql-sqlite-wasm`: `SqliteClient` waits forever when the OPFS worker fails before posting `ready`

**Body:**

Version: `effect` and `@effect/sql-sqlite-wasm` 4.0.0-rc.116 (the same code is on `main`).

If the OPFS worker fails before it posts `["ready"]`, building the `SqliteClient` layer never completes and
never fails. We hit it in a browser with a database name longer than wa-sqlite's 64-character path limit
(`<name>-journal` must fit), where `OpfsWorker.run` fails while opening the database.

Reproduction: a worker module that calls
`Effect.runFork(OpfsWorker.run({ port: self, dbName: "x".repeat(60) }))`, and a page that builds
`SqliteClient.layer({ worker: Effect.acquireRelease(Effect.sync(() => new Worker(url, { type: "module" })), (w) => Effect.sync(() => w.terminate())) })`
and runs one query. The query never returns; nothing is logged by the client.

Two parts, both in `packages/sql/sqlite-wasm`:

1. `OpfsWorker.run` fails as an Effect inside the worker. Nothing posts an error to the port and the
   worker's `error` event does not fire, so the client cannot learn about it.
2. In `SqliteClient.make`, `makeConnection` does `yield* Deferred.await(readyDeferred)`. The worker's
   `error` listener (`onError`) fails the pending requests and forks a replacement connection with
   `ScopedRef.set(connectionRef, makeConnection)`, but never completes `readyDeferred`. So even when
   the `error` event does fire before `ready`, the first connection waits forever, and each replacement
   waits the same way.

Suggested fix: have `OpfsWorker.run` post a failure message (for example `["ready", error]`) when opening
fails, and have `makeConnection` fail `readyDeferred` from that message and from `onError` while it is
still pending, so the layer fails with a `SqlError` instead of hanging.

Our workaround ([`libs/store-sqlite-wasm`](../../libs/store-sqlite-wasm/src/)): check the name length
before opening; catch a failure of `OpfsWorker.run` in the worker and rethrow it from a `setTimeout` so
the worker's `error` event fires; and bound the client's open to 30 s.

## 2. Comment on Effect-TS/effect#6347

**Body:**

Still present in 4.0.0-rc.116 and on `main`: `effect/unstable/sql/Migrator` has
`import(url.href)` in `fromFileSystem`. On Expo SDK 58 / React Native 0.88, Metro fails the whole bundle
at that line (`SyntaxError ... Migrator.js: Invalid call ... import(...)`) as soon as anything imports the
module, even `fromRecord`. `SqliteMigrator` re-exports `effect/unstable/sql/Migrator`, and the cluster
barrel imports it too, so "use `SqliteMigrator`" does not avoid it.

Moving `fromFileSystem` (the only Node-only loader) into its own module, for example
`effect/unstable/sql/MigratorFileSystem`, would let React Native and other bundlers without dynamic
`import()` use `fromRecord` and `fromGlob`.

We stub the call with a Babel plugin in the app until then
([`apps/evidence-mobile/babel.config.js`](../../apps/evidence-mobile/babel.config.js)).
