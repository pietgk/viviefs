# ADR-0031: TypeScript strictness flags from Effect, evaluated

Status: Proposed, unverified

Date: 2026-09-21

Qualifying gate: verify

Related: D49, [ADR-0028](0028-typescript-7-cli-with-typescript-6-api.md),
[ADR-0029](0029-effect-reference-and-language-service.md). Effect's
`repos/effect/tsconfig.base.json` is the source of the candidate flags, not
a list to copy.

## Problem

Effect's tsconfig turns on several flags this repo did not have. Copying them
blindly would fight Nx source-condition imports (`allowImportingTsExtensions`
and `@viviefs/source`). Ignoring them would leave Schema optional-key types
and type-only imports weaker than the Effect code we read.

## Design

Enable in `tsconfig.base.json`, one flag per verify pass:

- `verbatimModuleSyntax`
- `exactOptionalPropertyTypes`
- `moduleDetection: "force"`

Leave off:

- `rewriteRelativeImportExtensions`. Nx still emits with
  `allowImportingTsExtensions` and `@viviefs/source`. Pairing those with
  rewrite is a later drop, not this change.
- `ignoreDeprecations`. Deprecation noise stays visible.

Domain types keep exact optionals (`key?: T`): omit the key when there is no
value. Option bags that forward another bag's fields use
`key?: T | undefined`, matching Effect `Schema.optional` / Config.

Revisit `rewriteRelativeImportExtensions` only if we drop
`allowImportingTsExtensions`.

## Trade-offs

`exactOptionalPropertyTypes` makes `{ note: string | undefined }` fail
against `note?: string`. That is the point: Schema `optionalKey` is not
`optional`. The cost is option-bag forwarding, which we type as
`T | undefined` instead of omitting keys at every spawn call site.

## Failure-handling

Each flag had its own `mise exec -- pnpm verify` pass. Unperformed: changing
the Nx `.ts` import pairing; editor Native Preview.

## Outcome

### Expected

`pnpm typecheck` and `pnpm verify` stay green with the three flags on. Type-only
imports stay explicit. Optional keys are either absent or valued, unless the
type names `| undefined`. Effect's rewrite and deprecation-ignore flags stay
off.

### Observed

2026-09-21. Each flag's `mise exec -- pnpm verify` was GREEN (12 checks).
`verbatimModuleSyntax` and `moduleDetection: "force"` needed no source
changes. `exactOptionalPropertyTypes` failed until verify row `note`,
notification `clockName`, and PGlite `dataDir` omitted absent keys, and
qualification spawn option bags accepted `| undefined`.
