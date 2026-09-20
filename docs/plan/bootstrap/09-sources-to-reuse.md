# Sources to reuse

Local sibling repositories with material to copy or learn from. Copy deliberately, adapt to ViViEfs vocabulary, and
record the origin in the commit message.

## complyj (`~/ws/complyj`)

| Take | Path | Use |
|---|---|---|
| Qualification harness | `tools/qualification/` (`gates.ts`, `ledger.ts`, `cli.ts`, `README.md`) | Adapt as `tools/qualification` (D48') |
| ADR template | `docs/adr/template.md` | Expected vs observed outcome, failure handling, evidence links |
| Validation as architecture | `docs/adr/0006-validation-as-architecture.md` | Principles for ADR 0026 |
| DX planes | `docs/adr/0012-developer-experience-as-architecture.md` | ADR 0027 |
| Apple Container runtime | `docs/adr/0007-local-container-runtime.md`, `0010-runtime-placement-policy.md` | Postgres, Keycloak, Jaeger, otel-lgtm locally |
| Teaching from evidence | `docs/teaching/L01..L07` (esp. L06 qualification as a practice) | Lesson format |
| Glossary style | `CONTEXT.md` | Format for `CONTEXT.md` |
| Tenant isolation lessons | `docs/adr/0005-tenant-isolation-and-audit-evidence.md` | D18 |
| Skills mechanism | `.agents/skills/`, `skills-lock.json` | D49 |
| Sanitized evidence records | `docs/implementation/` | Same role as viviefs `docs/evidence/` (clearer name; not a path copy) |

## web-interview (`~/ws/web-interview`)

| Take | Path | Use |
|---|---|---|
| Verify gate | `scripts/verify.ts`, `docs/testing-and-validation.md`, `docs/adr/006-test-execution-model.md` | `tools/verify` |
| Evidence ownership registry | `scripts/source-evidence-registry.ts`, ADR 010 | Ownership registry |
| Coverage lockfile | `coverage-baseline.json` and its update command | Ratchet lockfile |
| Test layer ownership | `docs/adr/005-testing-and-storybook.md` | Evidence owners |
| UI state ownership | `docs/adr/007-ui-to-model-convention.md`, `todoListsScreenView.ts`, `useSettledText.ts` | D41 exemplar |
| Datom store and protocol | `shared/src/datom.ts`, `datomStore.ts`, `ulid.ts`, `backend/src/todos/datomJournal.ts`, `routes/datoms.ts` | Starting point for `libs/datom` and sync (extend with `cs`, HLC, changesets) |
| Trusted clock | `frontend/src/todos/trustedClock.ts` | Basis for the HLC's corrected clock |
| Rejection and rehydrate | ADR 008, `todoClient.ts` | D36 client behaviour |
| Fake server for stories | `frontend/src/testing/fakeDatomServer.ts` | `libs/testing` fakes |
| Boundary lint | `eslint.config.js` | Command-only datom writes, lint-scope |
| Reference architecture notes | `docs/research/reference-architecture.md` | Background |

## BirVana (`~/ws/app/pietgk`)

| Take | Path | Use |
|---|---|---|
| Durable execution field guide | `research/durable-execution.md`, `research/_notes/` | Vocabulary, engine comparison, limits |
| E2E tooling | ADR 0010, `package.json` agent-device and Maestro scripts, `.maestro/` | Gate P07 |
| Ports ADR | `docs/adr/0009-external-capabilities-behind-swappable-ports.md` | Superseded by Effect services, useful for teaching |
| XState orchestration | `docs/adr/0014-...`, `0017-...` | Input for gate P08 |

## vivief (`~/ws/vivief`)

| Take | Path | Use |
|---|---|---|
| Concepts v6 | `docs/contract/vivief-concepts-v6.md`, `docs/contract/foundation.md` | Datom, projection, effect handler, observability as projection |
| Datom sync ADR | `docs/contract/adr/0047-datom-store-sync.md` | Conflict ideas (`:contract/conflict`) |
| OTel matching | `docs/fact/devac/otel-integration.md` | Idea: match traces against extracted effects (later) |

## External

- Effect v4: https://github.com/Effect-TS/effect (main; `LLMS.md`, `ai-docs/src/`), docs https://effect.website/docs/v4
- Effect Atom React: `@effect/atom-react`
- effect-machine: https://github.com/typeonce-dev/effect-machine
- motel: https://github.com/kitlangton/motel
- effect.institute: https://www.effect.institute/
- Expo SDK 58 beta: https://expo.dev/changelog/sdk-58-beta
