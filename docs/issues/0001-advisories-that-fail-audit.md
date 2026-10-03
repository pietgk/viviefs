# I1: Advisories that fail audit with no fix released

Status: ready-for-agent

Category: bug

Found: 2026-10-02

Decide when: a row's removal trigger below fires, or a new advisory fails verify's audit step

## What

This is the one issue for security advisories that fail verify's audit step (`pnpm audit --audit-level=high`) and have no fixed release, so each accepted one is reviewed here on purpose instead of in an issue of its own. An advisory that has a fixed release is fixed (an upgrade or an override in `pnpm-workspace.yaml`), not tracked here. One that has none is either accepted, as a row below and an entry in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` with the reason and the trigger, or keeps verify red. A human decides each one, because accepting it loosens a gate. `--ignore-unfixable` is not used: it would also hide every later advisory without a fix.

## Accepted advisories

| Advisory | Risk | Reaches us through (not shipped) | Remove when |
| --- | --- | --- | --- |
| `node-forge` 1.4.0, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), high, found 2026-10-02 | RSA signature verification | `@expo/cli` and `@expo/code-signing-certificates` (development builds, code signing); not in the iOS or Android exports | `node-forge` ships a fix, or `@expo/cli` drops it |
| `http-cache-semantics` 4.2.0, [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), high, found 2026-10-03 | A shared cache can give one user another user's cached response | `astro` 7.3.5, which builds the static docs site; not in `apps/docs/dist` | a fixed release, or `astro` drops it |
| `braces` 3.0.3, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), high, found 2026-10-03 | Deeply nested braces exhaust the stack and stop the process | `micromatch` 4.0.8 in `metro-file-map`, `@expo/metro-file-map` and `starlight-llms-txt`, build tools that match our own globs; not in the iOS or Android exports | a fixed release, or all three drop it |

## How an advisory is checked before it is accepted

1. Read the advisory: affected versions, and that no patched version exists.
2. `pnpm why -r <package>`: every parent, and whether any of them is something the apps ship or a server runs.
3. Search the shipped output for the package: the mobile exports in `.artifacts/verify/evidence-mobile` and the built docs site in `apps/docs/dist`.
4. Ask the human. If accepted: a row here and an `ignoreGhsas` entry whose comment names I1, the reason and the trigger. `pnpm audit` then prints it as ignored.

When a trigger fires: delete the `ignoreGhsas` entry, update the lockfile, run verify, and move the row to the comments with the commit that removed it. Close this issue only when the table is empty.

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

2026-10-03: I1 now holds every accepted advisory, so audit problems get one
focused place instead of one issue each (the human's choice). Two new high
advisories, published 2026-09-18 with no patched version, failed audit:
GHSA-ch52-4w7c-c8xp (`http-cache-semantics`) and GHSA-vfj7-8cjw-p6xm
(`braces`). Checked as above: `http-cache-semantics` has `astro` as its only
parent and does not appear in `apps/docs/dist`; `braces` has `micromatch` as
its only parent, used by `metro-file-map`, `@expo/metro-file-map` and
`starlight-llms-txt`, and the only "braces" in the mobile exports of
2026-10-02 is a variable of that name in an inspect helper, not the package.
The human accepted both; they are rows above and entries in `ignoreGhsas`.
