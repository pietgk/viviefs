# I1: node-forge advisory fails audit, no fix released

Status: ready-for-agent

Category: bug

Found: 2026-10-02

Decide when: `node-forge` releases a fix for GHSA-86w9-cpqp-85rv, or `@expo/cli` drops `node-forge`

## What

`pnpm audit` reports GHSA-86w9-cpqp-85rv (high) in `node-forge` 1.4.0, the newest release, so verify's audit step fails. No patched version exists. It comes only through `@expo/cli` (development builds and code signing), not through anything the apps ship; it entered npm's audit data after the green run of 2026-10-01.

## Options

- Ignore this one advisory with a written reason in `pnpm-workspace.yaml`. That loosens a gate, so a human decides, and the reason names when to remove it (a patched `node-forge`, or `@expo/cli` dropping it).
- Keep verify red until a fix is released.

## Comments

2026-10-02: Took the first option to keep verify usable. `pnpm-workspace.yaml`
`auditConfig.ignoreGhsas` names this one advisory, with the reason and the
removal condition; `pnpm audit` still prints it as `1 ignored: 1 high`.
`--ignore-unfixable` was not used, because it would also hide every later
unfixable advisory. Checked: `pnpm why node-forge` has only `@expo/cli` and
`@expo/code-signing-certificates` as parents, and the iOS and Android exports
in `.artifacts/verify/evidence-mobile` contain no `node-forge`. Left to do:
when the trigger above fires, delete the ignore entry, update the lockfile and
resolve this issue.
