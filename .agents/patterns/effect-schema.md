# Effect Schema

Agent extract. Source of truth: [`repos/effect/LLMS.md`](../../repos/effect/LLMS.md)
(section "Defining schemas and domain models") and
[`repos/effect/packages/effect/SCHEMA.md`](../../repos/effect/packages/effect/SCHEMA.md).
Viviefs example: [`libs/datom/src/schema.ts`](../../libs/datom/src/schema.ts).

## Do

- Parse untrusted input with `Schema`. Do not hand-roll predicates for that job.
- Prefer `Schema.Struct`, `Schema.Class`, `Schema.TaggedError` / `Schema.TaggedErrorClass`.
- Export `type X = typeof X.Type` next to the schema when callers need the type.
- Decode/encode at boundaries (SQL rows, RPC, CLI args). Domain code consumes typed values.

```ts
import * as Schema from 'effect/Schema'

export const Op = Schema.Literals(['assert', 'retract'])
export type Op = typeof Op.Type

export class ParseError extends Schema.TaggedError<ParseError>()('ParseError', {
  input: Schema.String,
  message: Schema.String,
}) {}
```

## Avoid

- `JSON.parse` then manual field checks.
- `Schema.Schema.Type<typeof X>` when `typeof X.Type` exists
  (`preferSchemaTypeProperty` in the Effect language service).
- Inventing `isString` / `isRecord` helpers. Use `effect/Predicate`.
