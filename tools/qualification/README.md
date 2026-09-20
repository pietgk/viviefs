# Qualification harness

Adapted from complyj `tools/qualification`. The gate table is code
(`src/gates.ts`). The ledger is append-only and machine-written. Do not edit
`gate-ledger.json` by hand.

P01-P10 are the foundation stage (D46's six themes split so each fact can fail
independently). P11-P14 are follow-on, not foundation closure. iOS, Android and
web are first-class: P01, P02 and P07 fail if the Android emulator fails.

Probes are registered. They are **not yet run**. A probe that has not been
implemented refuses to pass; there is no passing placeholder.

## Run

```sh
pnpm ledger                 # Cumulative state. Currently every gate is not run.
pnpm qualify --gate P01     # One probe
pnpm qualify --foundation   # P01-P10 in order, on a committed tree
pnpm qualify                # P01-P14 in order
```

`pnpm verify` does not run qualification. GitHub Actions runs `verify` only.
A sequential full run of P01-P10 on unchanged committed inputs is what closes
the foundation stage.

Unknown gate ids fail. Every negative claim in a later probe must ship a
positive control. Sanitized evidence records go to `docs/evidence/`; bulky
artifacts stay in `.artifacts/qualification` (gitignored).
