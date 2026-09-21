# Effect CLI

Agent extract. Source of truth: [`repos/effect/LLMS.md`](../../repos/effect/LLMS.md)
(section "Building CLI applications"),
[`repos/effect/ai-docs/src/70_cli/10_basics.ts`](../../repos/effect/ai-docs/src/70_cli/10_basics.ts),
and https://www.effect.solutions/cli.

Viviefs entrypoints: [`tools/verify/src/verify.ts`](../../tools/verify/src/verify.ts)
and [`tools/qualification/src/cli.ts`](../../tools/qualification/src/cli.ts).
`@effect/platform-node` is pinned at the same RC as `effect`.

## Do

- `import { Argument, Command, Flag } from 'effect/unstable/cli'`.
- Define `Command.make(name, { flags, args }, handler)`.
- Wire subcommands with `Command.withSubcommands`.
- Run with `Command.run(cmd, { version })`.
- This repo's CLIs run on Node (mise pin). Provide `NodeServices.layer` and
  `NodeRuntime.runMain` from `@effect/platform-node` at the same RC as
  `effect`. Do not switch verify to Bun.

```ts
import { Argument, Command, Flag } from 'effect/unstable/cli'
import { Console, Effect } from 'effect'

const shout = Flag.Boolean('shout').pipe(Flag.withAlias('s'), Flag.withDefault(false))
const name = Argument.String('name').pipe(Argument.withDefault('World'))

const greet = Command.make('greet', { name, shout }, ({ name, shout }) => {
  const message = `Hello, ${name}!`
  return Console.log(shout ? message.toUpperCase() : message)
})
```

## Avoid

- Hand-rolled `process.argv` parsers in new tools.
- `@effect/platform-bun` for verify/qualify (those commands assert the mise
  Node version).
- A different `@effect/platform-node` version than `effect`.
