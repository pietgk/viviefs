# Effect v4 on React Native / Expo SDK 56 (RN 0.85, Hermes V1, Metro)

Researched 2026-09-18. Versions checked: `effect@4.0.0-rc.115` (npm `rc` tag, 2026-09-11; `beta` = 4.0.0-beta.107, `latest` = 3.22.2), `@effect/sql-sqlite-react-native@4.0.0-rc.115`, `expo@56.0.22`, `react-native@0.85.3`, `babel-preset-expo@56.0.20`, `metro@0.84.5`, Hermes built from tag `hermes-v250829098.0.10` (the `hermes-compiler` version pinned by RN 0.85.3).

## Verdict

**Works with polyfills, plus one build workaround if you touch SQL/Cluster.**

- Core `effect` (Effect, Schema, Stream, Layer, fibers, DateTime, Random, Encoding) runs on Hermes V1 once `TextDecoder` exists. Expo SDK 56 installs `TextDecoder` for you. Bare RN does not, so you need a polyfill there.
- You must supply `crypto.getRandomValues` for UUID generation (for example `Model.UuidV4*`, `internal/uuid`). Workflows also need `crypto.subtle.digest("SHA-256")`, because `Workflow.execute` and `Activity` hash idempotency keys with it. Hermes has neither, and Expo does not install either one globally.
- Metro build blocker (still open): `effect/unstable/sql/Migrator.js` has a non-literal `import()`. Metro rejects it with "Invalid call at line 206". Anything that imports Migrator fails the build: `effect/unstable/sql` (the barrel), `@effect/sql-sqlite-react-native/SqliteMigrator` and its index, `effect/unstable/cluster/SqlMessageStorage` (so also the cluster barrel and `SingleRunner`), and `effect/unstable/persistence/PersistedQueue`. A 15-line babel plugin that stubs that `import()` fixed it (verified).

## 1. Official stance and packages

- Platform packages in v4: `@effect/platform-browser`, `-bun`, `-deno`, `-node`, `-node-shared`. There is **no `@effect/platform-react-native`** (npm 404, and the repo `packages/platform/` has only browser, bun, deno, node-shared, node). The README runtime table lists only those. React Native appears only through `@effect/sql-sqlite-react-native` ("SQL client for SQLite in React Native"). Source: https://github.com/Effect-TS/effect README, and `gh api repos/Effect-TS/effect/contents/packages/platform`.
- Development of v4 now happens in `Effect-TS/effect`: the `packages/effect` `repository` field points there, although `effect-smol` is not archived.
- `@effect/sql-sqlite-react-native@4.0.0-rc.115` exists. It is built on `@op-engineering/op-sqlite` with peer `>=17.1.2 <18.0.0`, while op-sqlite `latest` is 18.2.4, so expect a peer conflict. It supports sync and async query modes. It does not support streaming or `updateValues`.
- There is **no expo-sqlite adapter**. Issue Effect-TS/effect#4544 (closed) asked for one; `@effect/sql-expo` returns npm 404.
- The maintainers' stance is that Effect depends on `TextEncoder`/`TextDecoder` and runtimes without them must polyfill (Effect-TS/effect#3927, mikearnaldi and fubhy; closed 2026-07-10). There is no RN documentation page.
- Since Effect provides no RN platform layer, `Crypto`, `FileSystem`, `KeyValueStore` and similar must be implemented by you (for example `Crypto.make({ randomBytes, digest })` backed by `expo-crypto`).

## 2. Hermes V1 runtime: globals Effect uses vs what exists

These results come from actually running a Hermes VM binary built from `hermes-v250829098.0.10`. RN 0.84+ uses Hermes V1 by default (https://reactnative.dev/blog/2026/02/11/react-native-0.84), and Expo SDK 56 = RN 0.85 + Hermes V1 default (https://expo.dev/changelog/sdk-56).

| API | Used by effect (dist grep) | Bare Hermes V1 | RN 0.85 / Expo 56 runtime | Notes |
|---|---|---|---|---|
| `TextDecoder` | **Module top level** in `Encoding.js` (`new TextDecoder()`), reached from `Effect.js` via `Tracer.js` | **missing** | Expo winter installs it (`expo/src/winter/runtime.native.ts`) | Bare RN crashes at import: `ReferenceError: Property 'TextDecoder' doesn't exist` (reproduced) |
| `TextEncoder` | top level in `Random.js` and `Encoding.js` | present | present | |
| `crypto.getRandomValues` | `internal/uuid.js`, `Random.withSeed`-less ISAAC path | **missing** | **missing** | Needed for UUID generation. Default `Random` uses `Math.random` |
| `crypto.subtle.digest` | `unstable/workflow/internal/crypto.js` (execution ids, activity keys); eventlog | **missing** | **missing** | Workflows fail without it (reproduced: `Property 'crypto' doesn't exist`) |
| `AbortController` | `Effect.promise`/`tryPromise` signal, `Effect.abortSignal`, HttpClient | missing | RN installs it (`setUpXHR.js`, abort-controller pkg) | |
| `queueMicrotask`, `performance.now` | examples only / guarded `monotonicNowNanos` | missing | RN provides | Falls back to `Date.now` if absent |
| `setImmediate` | Scheduler, guarded with a `setTimeout` fallback | CLI stub | RN provides | |
| `Symbol.dispose` / `asyncDispose` | `acquireDisposable`, `ManagedRuntime[Symbol.asyncDispose]` | **missing** | missing | Harmless unless you use `Effect.acquireDisposable` or `await using` |
| `FinalizationRegistry` | `Atom.family`, HttpClient; both feature-guarded | **missing** | missing | Falls back to non-weak caching |
| `WeakRef` | Atom (guarded) | present | present | |
| `structuredClone` | httpApi Scalar/Swagger UI only | missing | Expo installs it | |
| `Intl.DateTimeFormat` with timeZone | `DateTime` zones | present (macOS build uses Apple Intl) | present | Android Intl behavior not verified |
| `Intl.Segmenter` | `unstable/cli` only | missing | ? | Irrelevant on RN |
| `BigInt` + literals | Duration, Clock | present | present | |
| `Error.captureStackTrace`, `stackTraceLimit` | tracer, guarded | present / guarded | | |
| `Object.hasOwn`, `.at`, `findLast` | Schema, etc. | present | | `toSorted` missing but used only in doc comments |
| private `#fields`, static blocks | `unstable/ai`, `reactivity/AtomRegistry` | supported | | |
| async generators | `Stream.js` | **SyntaxError** in Hermes V1 | babel-preset-expo `hermes-v1` profile transforms them | Bare RN `@react-native/babel-preset` also transforms them (not verified) |
| `import.meta` | `ConfigProvider.fromEnv` (`...import.meta?.env`) | **SyntaxError** | SDK 56 `babel-preset-expo` rewrites it by default (`transformImportMeta !== false`) | Bare RN needs a babel plugin (see #6252 comment) |
| `node:*` imports | only `effect/testing/TestSchema.js` | | | |

The `effect` package has **zero runtime dependencies** (no msgpackr and no node-only deps; `package.json` has no `dependencies`).

### Real Hermes run (`scratchpad/rn-check/app/probe.js`)

Pipeline: esbuild bundle, then babel with `babel-preset-expo/build/configs/hermes-v1`, then Hermes VM.

- Bare Hermes fails at import on `TextDecoder`.
- With RN + Expo globals (abort-controller, Expo `TextDecoder`, `queueMicrotask`, `performance`), 12/15 checks pass: gen/sleep, fork/join/interrupt, Schema decode/error, Stream, Clock (bigint), DateTime.now and a zoned `Europe/Amsterdam` value, Random, base64, `Effect.promise` with AbortSignal. The UUID, `subtle.digest` and workflow checks fail on the missing `crypto`.
- After adding a `crypto.getRandomValues` + `crypto.subtle.digest` stub, **15/15 pass, including `WorkflowEngine.layerMemory` running a Workflow with an Activity**.

Test-harness caveats (these are not Effect bugs):

- The Hermes CLI runs `setTimeout`/`setImmediate` in FIFO order and ignores delays, so `Effect.timeout` fires early. The probe disables timeouts on Hermes.
- Hermes V1 without the `block-scoping` transform mis-captures `for (let ...)` closures (esbuild's `__copyProps` returned the wrong export). Expo's hermes-v1 profile always applies `@babel/plugin-transform-block-scoping`, so Expo apps are not affected. Custom toolchains that skip it would be.

## 3. Metro bundling

- Metro 0.84 defaults to `unstable_enablePackageExports: true` (`metro-config/src/defaults/index.js:69`). Expo SDK 56 adds the `react-native` condition for ios/android. The `effect` exports map (`"./*": "./dist/*.js"`, `./unstable/*` barrels) resolved fine, for example `effect/unstable/cluster/SingleRunner`.
- ESM-only is fine for Metro (it transforms ESM). Jest is harder: `jest-expo` must transform `effect`. Issue #6578 was fixed by PR #6659 (merged 2026-07-27, "Preserve accessors with loose object spread"). Babel's loose object-spread broke Exit/Schema. SDK 56's hermes-v1 profile no longer applies object-rest-spread at all, but the Jest/node profile may.
- `npx expo export --platform ios` (SDK 56, Hermes bytecode):
  - Importing Migrator (via `effect/unstable/sql`, `SqliteMigrator`, or the cluster barrel/`SingleRunner`) fails with `SyntaxError ... Migrator.js: Invalid call at line 206: import(...)`. Tracked as Effect-TS/effect#6347 (open). Its suggested workaround ("use SqliteMigrator instead") **does not work in v4 rc.115**, because `SqliteMigrator` does `export * from "effect/unstable/sql/Migrator"`.
  - With a babel plugin that replaces non-literal `import()` in that file with `Promise.reject(...)` (`scratchpad/rn-check/app/babel.config.js`), the full probe (workflow, cluster, rpc, http, sql, sqlite-react-native) bundles and compiles to HBC.
- Bundle size (iOS HBC): baseline Expo app 1.6 MB.
  - `import * as Effect from "effect/Effect"`: 2.2 MB (+0.6).
  - `import { Effect } from "effect"` (barrel): 4.3 MB (+2.7). With `EXPO_UNSTABLE_TREE_SHAKING=1 EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1` it drops to 2.2 MB.
  - Full probe: 5.9 MB.
  - Use deep imports or Expo's experimental tree shaking. Metro does not tree-shake by default (Effect-TS/effect#4093: "known limitation of metro").

## 4. Community reports

- Effect-TS/effect-smol#1861 (Discord summary, closed 2026-03-24): v4 beta in Expo gave `TypeError: Function is not a constructor`, and the user downgraded to v3. There was no root cause, and it was plausibly the loose-spread bug fixed later (**unverified**).
- Effect-TS/effect-smol#1374 (Feb 2026): the default `ConfigProvider.fromEnv` failed in Expo because of `import.meta`/`process.env`. The import.meta part is now handled by SDK 56's default transform.
- Effect-TS/effect#6252 (4.0.0-beta.70, closed 2026-07-23): `Cannot read properties of undefined (reading 'reasons')` in Expo, fixed by a strict `@babel/plugin-transform-object-rest-spread` (`loose:false`), which is the same root cause as #6578 and PR #6659. A commenter reports "Effect v4 family works well" on react-native-macos 0.87 + Hermes 250829098.0.15, using a babel config with an `import.meta` replacement plugin plus the strict object-rest-spread override.
- Effect-TS/effect#6578: v4 Schema decode broken under babel-preset-expo in Jest. Fixed in PR #6659.
- Effect-TS/effect#5499 (v3, open): `@effect/sql-sqlite-react-native` silently returned `[]` with op-sqlite 14. v4 rewrote it against op-sqlite 17 (`executeSync`).
- Effect-TS/effect#3927 (v3): Expo crashed on missing `TextEncoder`. Polyfill is the official answer.
- No blog posts found with more detail than the above (**not exhaustively searched**).

## 5. Workflow / Cluster on RN

- No `node:` imports and no third-party deps in `unstable/workflow` or `unstable/cluster`.
- Workflow needs `crypto.subtle.digest('SHA-256')` (`Workflow.js:33`, `Activity.js:113`) and `TextEncoder`.
- `WorkflowEngine.layerMemory` ran correctly on Hermes V1 with polyfills. It is in-memory only, so it is not durable.
- A durable on-device engine means `ClusterWorkflowEngine` + `SingleRunner.layer` + `SqlMessageStorage`/`SqlRunnerStorage` on `@effect/sql-sqlite-react-native`. SqlMessageStorage has a `sqlite` dialect branch. That path **bundles only with the Migrator workaround**, and **it was not executed** here, so runtime behavior (sharding timers, `ShardingConfig.layerFromEnv`, op-sqlite on device) is **unverified**.
- `HttpRunner`/`SocketRunner` use WebSocket/HTTP servers and are not relevant on-device.

## Suggested polyfill set (Expo SDK 56)

- `TextDecoder`, `structuredClone`, `URL`, `import.meta`: already provided by Expo.
- `globalThis.crypto.getRandomValues`: use `expo-crypto`'s `getRandomValues` or `react-native-get-random-values`.
- `globalThis.crypto.subtle.digest`: use `expo-crypto`'s `digest(CryptoDigestAlgorithm.SHA256, data)`, or `react-native-quick-crypto`, which installs a WebCrypto global (**not verified here**).
- Optional: `Symbol.dispose ??= Symbol.for('Symbol.dispose')` (same for `asyncDispose`) if you use `acquireDisposable`.
- Babel: the Migrator `import()` stub plugin, if any SQL, cluster or persistence module is imported.
- For bare RN (not Expo), additionally: a `TextDecoder` polyfill (e.g. `@bacons/text-decoder`) and an `import.meta` babel transform.

## Artifacts

`scratchpad/rn-check/`:

- `package/`: unpacked effect rc.115
- `hermes-build/bin/hermes`: Hermes V1 VM
- `app/probe.js`, `app/out/*.js`: Hermes runs
- `app/babel.config.js`: Migrator workaround
- `app/dist-*`: Expo exports
