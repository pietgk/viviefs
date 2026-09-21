# Effect tests with @effect/vitest

Agent extract. Source of truth: [`repos/effect/LLMS.md`](../../repos/effect/LLMS.md)
(section "Testing Effect programs"),
[`repos/effect/ai-docs/src/09_testing/`](../../repos/effect/ai-docs/src/09_testing/),
and https://www.effect.solutions/testing.
Viviefs runner pin: `@effect/vitest@4.0.0-rc.116` (same RC as `effect`, ADR-0003).
Do not install `@effect/vitest@beta`.

| Runner | When | Example |
| --- | --- | --- |
| `it()` | Pure encode/decode/id/pin, or git/node spawn | [`libs/datom/src/hlc.test.ts`](../../libs/datom/src/hlc.test.ts), [`tools/qualification/src/ledger.test.ts`](../../tools/qualification/src/ledger.test.ts) |
| `it.effect()` | Effect body that is fine under TestClock | [`libs/datom/src/manifest.test.ts`](../../libs/datom/src/manifest.test.ts), TestClock in [`tools/verify/src/stages.test.ts`](../../tools/verify/src/stages.test.ts) |
| `it.live()` | Effect body that uses `Effect.timeout` / `Effect.sleep` / real wall time | [`libs/store-sqlite-node/src/log-store.integration.test.ts`](../../libs/store-sqlite-node/src/log-store.integration.test.ts) |

`it.effect` installs TestClock. Conformance and crash-matrix checks wrap work in `Effect.timeout` (and some `Effect.sleep`). Those never elapse under TestClock unless the clock is advanced. Use `it.live` for sqlite-node store suites. PGlite suites stay on `it()` plus `Effect.runPromise`: `it.live`'s test `Scope` plus an Nx-launched vitest worker busy-loops inside PGlite WASM.

HLC wall time is `makeMutableClock` / `HlcClock`, not Effect TestClock. Do not rewire HLC onto TestClock. Scoped temp dirs: [`withTempDirectory`](../../libs/testing/src/temp-directory.ts). Workflow-engine harnesses under `it.live` must run through [`runUnscoped`](../../libs/testing/src/run-unscoped.ts) so they do not inherit the test `Scope`.

## Do

- Import `describe`, `expect`, `it` from `@effect/vitest`.
- Use `it()` for pure functions (encode, decode, id format).
- Use `it.effect()` when the body returns an Effect, needs `TestClock` /
  `TestRandom`, or a Layer, and does not depend on live `Clock`.
- Use `it.live()` when the test must see the real clock or logs.
- Provide test Layers with `Effect.provide` / `Layer.provideMerge`. Prefer a
  `static testLayer` on the service class.

```ts
import { Effect } from 'effect'
import { describe, expect, it } from '@effect/vitest'

it('encodes a tx id', () => {
  expect(encodeHlc(0, 0, 0, 0)).toHaveLength(26)
})

it.effect('runs an Effect', () =>
  Effect.gen(function* () {
    const value = yield* Effect.succeed(2)
    expect(value).toBe(2)
  }),
)
```

## Avoid

- Rewriting pure tests into `Effect.gen` for style.
- Wrapping git/node spawn or `fetch` tests in `Effect.gen` for style.
- Running timeout/sleep harnesses under `it.effect`.
- Real `Date.now()` / `Math.random()` in unit tests. Use `TestClock` /
  `TestRandom` (D26). Keep `makeMutableClock` for `HlcClock`.
- Mixing `@effect/vitest` versions with `effect`.
