# Effect services and Layers

Agent extract. Source of truth: [`repos/effect/LLMS.md`](../../repos/effect/LLMS.md)
(section "Writing Effect services") and
[`repos/effect/ai-docs/src/01_effect/03_services/`](../../repos/effect/ai-docs/src/01_effect/03_services/).
Viviefs example: [`libs/datom/src/clock.ts`](../../libs/datom/src/clock.ts).

## Do

- Define a service as `Context.Service<Name, Interface>()('package/path/Name')`.
- Identifier includes the package path (`viviefs/datom/HlcClock`, not a bare class name).
- Attach `static readonly layer` / `Layer.sync` / `Layer.succeed` on the class.
- Construct the implementation with `Name.of({ ... })`.
- Compose with `Layer.provide` and `Layer.provideMerge`. Expose only what the
  caller should see.
- Methods that return Effects: `Effect.fn("Service.method")` when a span is
  useful, `Effect.fnUntraced` in hot library paths. Do not wrap a lone
  `Effect.gen` in a function.

```ts
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

export class HlcDevice extends Context.Service<
  HlcDevice,
  { readonly id: string }
>()('viviefs/datom/HlcDevice') {}

export const deviceLayer = (id: string) =>
  Layer.succeed(HlcDevice, HlcDevice.of({ id }))
```

## Avoid

- Passing capabilities as free functions that close over process globals.
- `Date.now()` / `Math.random()` in domain code. Capture time and entropy in
  a service (D26). See `HlcClock` and `HlcEntropy`.
- Chaining many `Effect.provide` calls (`multipleEffectProvide`). Compose Layers.
