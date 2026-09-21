# Effect tests with @effect/vitest

Agent extract. Source of truth: [`repos/effect/LLMS.md`](../../repos/effect/LLMS.md)
(section "Testing Effect programs"),
[`repos/effect/ai-docs/src/09_testing/`](../../repos/effect/ai-docs/src/09_testing/),
and https://www.effect.solutions/testing.
Viviefs runner pin: `@effect/vitest@4.0.0-rc.116` (same RC as `effect`, ADR-0003).
Do not install `@effect/vitest@beta`.

Example of `it.effect`:
[`tools/verify/src/stages.test.ts`](../../tools/verify/src/stages.test.ts).
Example of pure `it()`:
[`libs/datom/src/hlc.test.ts`](../../libs/datom/src/hlc.test.ts).

## Do

- Import `describe`, `expect`, `it` from `@effect/vitest`.
- Use `it()` for pure functions (encode, decode, id format).
- Use `it.effect()` when the body returns an Effect, needs `TestClock` /
  `TestRandom`, or a Layer.
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
- Real `Date.now()` / `Math.random()` in unit tests. Use `TestClock` /
  `TestRandom` (D26).
- Mixing `@effect/vitest` versions with `effect`.
