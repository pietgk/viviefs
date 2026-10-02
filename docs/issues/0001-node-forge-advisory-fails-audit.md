# I1: node-forge advisory fails audit, no fix released

Status: ready-for-human

Category: bug

Found: 2026-10-02

## What

`pnpm audit` reports GHSA-86w9-cpqp-85rv (high) in `node-forge` 1.4.0, the newest release, so verify's audit step fails. No patched version exists. It comes only through `@expo/cli` (development builds and code signing), not through anything the apps ship; it entered npm's audit data after the green run of 2026-10-01.

## Options

- Ignore this one advisory with a written reason in `pnpm-workspace.yaml`. That loosens a gate, so a human decides, and the reason names when to remove it (a patched `node-forge`, or `@expo/cli` dropping it).
- Keep verify red until a fix is released.

## Comments
