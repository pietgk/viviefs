# ADR-0030: Verify and qualify CLIs as Effect CLI

Status: Proposed, unverified

Date: 2026-09-21

Qualifying gate: verify

Related: D26, D48', D49, [ADR-0003](0003-effect-v4-as-backbone.md),
[ADR-0026](0026-verify-qualify-teach.md),
[ADR-0029](0029-effect-reference-and-language-service.md).

## Problem

`pnpm verify` and `pnpm qualify` parsed `process.argv` and used `async` /
`spawn`. That is allowed in `tools/` (D26 lint does not cover them) but it was
the opposite of Effect as the backbone. Agents copying those entrypoints would
learn the half-Effect idiom ADR-0003 refuses.

## Design

- Pin `@effect/platform-node` at the same RC as `effect` (`4.0.0-rc.116`).
- Parse and run the CLIs with `Command` / `Argument` / `Flag` from
  `effect/unstable/cli`, `NodeRuntime.runMain`, and `NodeServices.layer`.
  Node, not Bun: verify still asserts the mise Node pin.
- Keep the staged fail-fast table in `tools/verify/src/stages.ts`. A failing
  stage still stops the ones after it; every step inside a stage still runs.
- Keep `pnpm verify help`, unknown selector exit 2, `pnpm qualify --gate` /
  `--foundation`, unimplemented-gate refusal, and ledger printing. Effect CLI
  owns unknown-flag wording.
- Child process spawn for verify steps stays Node `spawn` wrapped in
  `Effect.promise`, so FORCE_COLOR, offline signs, and empty Nx patterns stay
  the same contract.

Revisit only if `effect/unstable/cli` ships a breaking parse change at an RC
bump, which is its own pin change.

## Trade-offs

Effect CLI help and parse errors replace the hand-rolled unknown-flag string.
That is the cost of one parser. Exit codes, help generated from the stage
table, and `--gate` / `--foundation` stay locked by characterization tests.

## Failure-handling

Characterization tests spawn the real entrypoints (`help`, unknown selector
exit 2, usage, `--gate` unimplemented, `--foundation` accepted as a flag,
ledger). `pnpm verify` is the qualifying gate. Unperformed: a full
`pnpm qualify --foundation` run (that is P01-P10, not this ADR).

## Outcome

### Expected

`mise exec -- pnpm verify` stays GREEN. `pnpm verify help` still prints the
stage table. `pnpm qualify --gate P99` still exits 1 with "not implemented".

### Observed

2026-09-21. `mise exec -- pnpm verify` was GREEN (12 checks). Characterization
tests lock `pnpm verify help`, unknown-selector exit 2, qualify usage,
`--gate` unimplemented, `--foundation` as a recognized flag, and ledger
printing. Effect CLI parse errors name the bad flag; they no longer use the
hand-rolled "Unknown or incomplete argument" string.
