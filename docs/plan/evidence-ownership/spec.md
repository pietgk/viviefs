# Evidence ownership: design review

Status: claimed (design review agreed 2026-09-30: D75-D80; built 2026-10-01, `pnpm verify all` green; the closing sequential P01-P11 run is pending)

The Evidence ownership step of Docs and teaching (D70, D71). This page is the design review D71 asks for before
any of it is built: the file treatments, how each one's evidence is produced and judged, the lockfile, where
the crash matrix runs, and the Schema-at-every-boundary rule. Decisions that come out of it go to the decision log
and ADR-0026 / ADR-0025: D75-D79, the ADR-0026 amendment of 2026-09-30, and the terms in `GLOSSARY.md`. The
review page is the research record [2026-09-30 Evidence ownership review](../../research/2026-09-30-evidence-ownership-review.html).

## 1. What was measured (2026-09-30, on `a970df75c`)

A throwaway run, not committed: `@vitest/coverage-istanbul` 5.0.1, one workspace-root Vitest run per `verify` step
over the projects that step runs today, coverage over every production file that loads in Node.

| Fact | Consequence |
| --- | --- |
| 208 production files (`.ts`, `.tsx`, `.js`, `.mjs` under `apps/`, `libs/`, `features/`, `tools/`, minus tests, stories and `vitest.config.ts`) | The registry has 208 entries |
| `unit` with coverage: 45 test files, 10.7 s. `integration`: 3 test files, 19.8 s | Same as today's timing (10 s, 17 s); coverage costs nothing measurable |
| A per-project Vitest run cannot instrument a file outside its own project: every such file failed with "Unknown Error" | Per-project runs would lose cross-project evidence (next row) |
| Much evidence crosses projects: `libs/sync/server/src/server.ts` is reached 233/249 statements, all by `tools/qualification`'s P09 and P11 host checks; `libs/identity` by `libs/testing`'s token and session tests | A producer must be one run per step, not per project |
| Two runs, per-file covered counts compared: `unit` identical; `integration` differed in one file, `libs/datom/src/hlc.ts`, one branch of `compareHlc` (the counter tiebreak, hit only when two live-clock times fall in the same millisecond) | Exactness holds when a file is judged only by its owning producer (`hlc.ts` is owned by `unit`). A baseline must still be taken more than once |
| **The crash matrix already runs in `verify`**: since `3bb3b2fa0` (2026-09-20) the sqlite-node and PGlite integration tests call `runCrashMatrix`. Only P06's memory-engine positive control runs in qualify alone | D71's drift entry and ADR-0025's Observed section overstate the gap. The real gap is ownership: the matrix runs under the store projects, not `libs/workflow-engine`, and nothing checks that it ran |
| Files no `verify` step executes: 46 device files (`apps/evidence-mobile`, `libs/platform-native`, `libs/store-sqlite-native`, `libs/store-sqlite-wasm`; none even load in Node), 26 qualify-only files (lab and device drivers, `pNN.ts` runners, `p10-checks.ts` and `p10-sinks.ts`) | About a third of the files have only `typecheck` and `lint` in `verify`. The file treatments must say so rather than hide it |
| Tested only in a child process, so coverage sees nothing: `tools/verify/src/verify.ts` and every `check-*.ts`, `tools/qualification/src/cli.ts`, and `tools/qualification/src/ledger.ts` (its test spawns it) | Process entries need their own file treatment; `ledger.ts` is logic and should be tested in-process |
| Schema at SQL rows: 38 `sql<T>` sites assert a row type; `SqlSchema` is used nowhere | "Schema at every boundary including SQLite rows" (D26) is not true today |

## 2. Principles (from web-interview ADR 005, 006, 010, adapted)

- Every production file has exactly one file treatment and a written rationale. The registry is the audit record;
  filesystem rules discover files, they never assign a file treatment. A new file fails `verify` until classified; a
  stale, duplicate or rationale-free entry fails.
- A file treatment names the verify step that produces its evidence and the verdict applied to it. A declared owner
  that did not run fails.
- An exact coverage tuple is judged only against its owning producer. Another step reaching the same file is
  informational and can neither fail nor rescue the verdict.
- The lockfile is exact, not a target: a regression fails, and an unrecorded improvement fails until
  `pnpm verify baseline` records it (D70). The lockfile records each producer's coverage provider name, package
  and version; a provider change needs a fresh, reviewed baseline.
- Changing a file treatment is an architectural change: it changes the registry digest, which the baseline
  records.

## 3. The file treatments (D76)

| File treatment | Verify step that produces the evidence | Verdict | Today (draft count) |
| --- | --- | --- | --- |
| `node-unit` | `unit` | exact per-file coverage tuple | 72 |
| `node-integration` | `integration` | exact per-file coverage tuple | 8: the engine, the two server stores' layers, `evidence-server`'s `server.ts` |
| `rendered-ui` | `storybook` | every story of the component ran and passed, with axe; coverage informational. The step is jsdom until P12 (D72) and keeps its name so the gap stays visible | 2: `IntentComposerView`, `IntentComposerScreen` |
| `process-entry` | `unit` | the entry names a test that runs it as a process; that test ran and passed. The file stays thin: logic lives in a `node-unit` module | 7: `verify.ts`, `check-*.ts`, qualify `cli.ts`, `evidence-server/main.ts` |
| `test-support` | `unit` or `integration`, named per entry | reached in that step; coverage informational. Suites prove themselves with positive controls, not coverage | 17: `libs/testing`, P08's shared `checks.ts` and `broken.ts` |
| `build-step` | the step that loads it (`docs`, `build`, `bundle-size`), named per entry | that step ran for the file's project | 7: Astro config and loader, Babel, Metro, the Expo plugin |
| `device` | none beyond `typecheck` and `lint`; a named gate qualifies it | the named gate exists in the gate table. `verify` does not read the ledger (D63) | 46 |
| `qualify-only` | none beyond `typecheck` and `lint`; run by qualify | the named gate exists in the gate table | 26 |
| `re-export` | `ownership` (static) | the file contains only re-exports, checked | 16 |
| `type-only` | `typecheck` | the file contains only type declarations, checked | 2 |
| `named-slot` | `ownership` (static) | the file is `export {}` with its slot comment, checked; the first real code forces a reclassification | 3: `crypto-shred`, `evidence-server-feature`, `generators` |

**Suites, a field on the entry (D75).** A suite checks one aspect of exactly one pattern's contract and is named
`<pattern>/<aspect>`, declared once in code (`{ id, pattern, aspect, gate }`) next to its function. A registry entry
names the suites run against the file; a test that runs a suite tags itself with the suite id. `verify` fails on an
unknown suite id, on an entry naming a suite with no passing tagged test in the owning producer, and on a declared
suite no test runs (a lab-only suite names its gate instead). Every suite in the repo today:

| Suite | Pattern | Function today | Gate | Verify step |
| --- | --- | --- | --- | --- |
| `log-store/conformance` | Log store | `runLogStoreChecks` | P04 | integration |
| `changesets/conformance` | Changesets and projections | `runChangesetChecks` | P05 | integration |
| `durable-workflow/crash-matrix` | Durable workflow | `runCrashMatrix`, `runMemoryDurabilityControl` | P06 | integration |
| `device-durability/launch-sweep` | Device durability | `runLaunchSweepChecks` | P07 | integration |
| `interaction-state/intent-composer` | Interaction state and live reads | `runComposerChecks` | P08 | unit |
| `sync/protocol` | Sync | `runP09` (renamed in this step) | P09 | unit |
| `tracing/engine-trace` | Tracing and telemetry sinks | `runTraceJournalChecks` | P10 | integration |
| `tracing/projection` | Tracing and telemetry sinks | `runTraceProjectionChecks` | P10 | integration |
| `tracing/sink` | Tracing and telemetry sinks | `runSinkChecks` | P10 | none (lab only) |
| `identity/token-verifier` | Identity | `runTokenVerifierChecks` | P11 | unit |
| `identity/membership` | Identity | `runP11Node` (renamed in this step) | P11 | unit |

"Engine suites" is a grouping: the three suites `libs/workflow-engine` runs, from three patterns.

**Not proposed:** web-interview's `storybook-controller` (a hook judged by browser coverage). `libs/ui`'s
`useSettledText` is tested in the `unit` step today, so it is `node-unit` until P12 moves stories to Chromium.

## 4. Coverage producers and the evidence lockfile (D77)

Agreed in the review (2026-09-30): option A now, option C once the two steps pass one minute on a full run. Options
compared in the review page (section 3): A, one root run per step; B, per project with own files only (rejected: 14
files, about 2,500 lines, lose their evidence and it pushes toward duplicate tests); C, per-project runs with the
Vitest root at the workspace, coverage as a declared Nx output, merged per step (tested: it sees cross-project
coverage).

- `unit` and `integration` each become **one Vitest run from the workspace root** with coverage, over the projects
  whose `project.json` declares `test` or `test-integration` (read from the Nx graph, so there is no second list).
  The per-project Nx targets stay for running one project by hand. The cost: `verify` stops using `nx affected` for
  these two steps; measured time is unchanged for a full run.
- Coverage provider: **Istanbul** (`@vitest/coverage-istanbul`, MIT, pinned to Vitest's version). It is what
  web-interview proved exact in Node and Chromium, and its counts do not depend on how Vite emits code; the P12
  Chromium producer can use the same provider.
- Judging: a new `evidence` step in `quality` reads the registry, each producer's coverage and Vitest JSON report,
  and fails on any issue. The `ownership` step in `static` checks the registry against the files (and keeps the
  project tag checks); `metadata.evidenceOwner` leaves `project.json`.
- The lockfile, `evidence-baseline.json` at the root, is machine-written by `pnpm verify baseline` only: per
  producer, the provider identity and per-file tuples (statements, branches, functions, lines); the registry digest;
  and the bundle-size references now recorded by hand in `bundle-budget.json`. The 10 MB budget stays a decision in
  `bundle-budget.json`.
- `pnpm verify baseline` runs each producer **three times** and refuses to write when the owned tuples differ. A
  file whose owned tuple varies is a flaky test, fixed as a defect (no retries).

## 5. Where suites and tests live (D78, amended by D80)

Moving the engine suites into `libs/workflow-engine` as D78 wrote it is a dependency cycle: `libs/testing` held every
suite and so depended on datom, the engine, telemetry and identity. D80 removes the hub: each suite ships with its
contract, and `libs/testing` keeps only helpers with no `@viviefs` dependency.

| Suite | Defined in (`src/suites/`) | Run in |
| --- | --- | --- |
| `log-store/conformance`, `changesets/conformance` | `libs/datom` | `libs/store-sqlite-node`, `libs/store-postgres` (integration); devices in P04, P05 |
| `durable-workflow/crash-matrix` (with the memory-engine positive control), `device-durability/launch-sweep`, `tracing/engine-trace` | `libs/workflow-engine` | `libs/workflow-engine` (integration, on sqlite-node and PGlite); devices in P07 |
| `tracing/projection` | `libs/telemetry` | `libs/telemetry` (integration, on sqlite-node and PGlite) |
| `identity/token-verifier` (and the fake issuer) | `libs/identity` | `libs/identity` (unit) |
| `interaction-state/intent-composer` | `features/evidence/client` | `features/evidence/client` (unit) |
| `sync/protocol`, `identity/membership`, `tracing/sink` | `tools/qualification` until their guides | `tools/qualification` (unit; `tracing/sink` in qualify only) |

A lint rule lets only tests, other `src/suites/` files, `tools/` and the evidence apps import a `suites` entry or
`@viviefs/testing`. P06 stays the qualification and calls the same functions. The per-workflow harness (D26) waits for
the durable workflow guide. The convention for every kind of test is D80 and ADR-0024's amendment.

## 6. Schema at every boundary (D79)

A lint rule in `static` (ESLint, not prose), for non-test code in `apps/`, `libs/` and `features/` (agreed in the
review, 2026-09-30, including `as unknown as`):

| Refused | Use instead |
| --- | --- |
| a type argument on the `sql` tag (`sql<{ seq: unknown }>`...) | `SqlSchema.findAll` / `findOne` / `findOneOption` / `void` with a row Schema, or `Schema.decodeUnknown` on the rows |
| `JSON.parse` | `Schema.fromJsonString` / `Schema.UnknownFromJsonString` |
| `.json()` on a fetch `Response` | `HttpClientResponse.schemaBodyJson` |
| `as unknown as` | a Schema decode, or a typed binding for a platform global; an exception names its reason in an `eslint-disable` comment |

A positive control in `guardrails.test.ts`, as for D26's determinism rules: each refused form fails, the Schema form
passes. The 38 `sql<T>` sites (in `libs/datom`, `libs/sync`, `libs/workflow-engine`, `libs/telemetry`) move to
`SqlSchema`. RPC payloads already decode through Schema. The four `as unknown as` casts today (platform globals and
library typings) are rewritten or carry a reasoned exception.

## 7. Also in this step

- `tools/qualification/src/ledger.ts` gets in-process tests (it is logic, not an entry); `check-lint-scope.ts` and
  `check-ownership.ts` split into a tested module and a thin entry, as `diagrams.ts` / `check-diagrams.ts` do.
- `04-repo-structure.md` and `05-verify-qualify-teach.md` describe the registry instead of `evidenceOwner`.
- Closed by one sequential P01-P11 run (D74).

## 7a. Build record (2026-10-01)

Choices made while building, inside the agreed decisions:

- **Suite declarations** live in one catalogue, `libs/testing/src/suites.ts` (id, pattern, aspect, gate, source file,
  lab-only), because Vitest needs every tag defined in config and `verify` needs the list without importing every
  lib. Each entry names the file its checks live in; a test checks that file exists. Tests tag themselves with
  `runsSuite(id)`; `strictTags` makes an unknown id fail.
- **One Vitest config shape** (`@viviefs/testing/vitest`): the file name decides the producer
  (`*.integration.test.ts`, `*.stories.test.tsx`, other `*.test.ts(x)`). The stories test no longer runs in `unit`
  as well as `storybook`.
- **Process entries** name either a test that spawns them or the verify step that runs them (`check-*.ts`,
  `bundle-size.ts`); `ownership` checks the step's invocation or the Nx target's command names the file.
- **A file Istanbul counts nothing in** (an Effect service tag) is missing from the coverage map; `evidence` treats
  it as an empty tuple, so the lockfile notices when it gains code. Vitest lists an included file no test loads with
  zero counts, so a missing file is not an unreached one.
- **A regression** is less covered or more left uncovered in any metric; any other change asks for a reviewed
  baseline.
- **Bundle references** moved from `bundle-budget.json` into the lockfile, without a commit field (the lockfile's
  own history says which commit); the 10 MB budget stays in `bundle-budget.json`.
- **Exceptions to D79**: three `as unknown as` casts with a reason in their `eslint-disable` comment (the crypto
  polyfill's global, op-sqlite's unresolvable typings, the worker's `self`); the four worker casts became one
  `workerPort()` in `@viviefs/store-sqlite-wasm`.
- **Found on the way**: the launch sweep now also runs on PGlite (it ran only on sqlite-node); `ledger.ts` is tested
  in-process against a scratch repository; the docs-only test no longer crashes on a tracked file deleted in the
  working tree; five high `axios` advisories through Nx 23.2.1 are overridden to `axios` 1.20.0 (MIT).
- **Final counts**: 226 production files (node-unit 74, device 48, qualify-only 27, re-export 25, test-support 20,
  node-integration 9, process-entry 8, build-step 7, named-slot 3, type-only 3, rendered-ui 2); 83 exact tuples.

## 8. Questions for the review

1. Definitions: agreed in round 2, with "gate step" for `Pnn.k` and "coverage producer" (D75).
2. The engine's suites move to `libs/workflow-engine` (section 5): agreed.
3. One root Vitest run per step (section 4): agreed, option A, C past one minute.
4. The Schema rule's scope (section 6): agreed, including `as unknown as`.

## Comments
