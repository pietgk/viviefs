# Repository structure (D52-D57)

## Layout

```
viviefs/
├─ apps/                          composition roots: pick features, provide the context as Layers
│  ├─ evidence-mobile/            Expo SDK 58 (iOS, Android, web): the exemplar app
│  ├─ evidence-server/            Node Effect server for the exemplar
│  └─ docs/                       docs site (concepts, guides, ADRs, API reference, llms.txt)
├─ features/                      vertical slices of business capability
│  └─ evidence/
│     ├─ model/                   attributes (Schema), ids, conflict policies, commands, workflow definitions
│     ├─ client/                  projections, query atoms, machines, screens, stories
│     └─ server/                  validators, HttpApi handlers, server-side activities
├─ libs/                          shared capability, no business meaning
│  ├─ datom/                      datom types, HLC, changesets, projector core
│  ├─ workflow-engine/            datom-backed WorkflowEngine
│  ├─ sync/                       outbox, cursor stream (client and server entry points as separate projects)
│  ├─ store-sqlite-native/        log store on op-sqlite            ┐
│  ├─ store-sqlite-wasm/          log store on sqlite-wasm (OPFS)   │ one pattern,
│  ├─ store-sqlite-node/          log store on node:sqlite          │ several implementations,
│  ├─ store-postgres/             log store on Postgres             ┘ one conformance suite
│  ├─ telemetry/                  OTLP config, trace projector
│  ├─ identity/                   Identity service: fake, Keycloak/OIDC
│  ├─ blobs/                      content-hash file store
│  ├─ crypto-shred/               per-subject keys for personal attributes
│  ├─ platform-native/            Expo polyfills (crypto), notifications, background task adapters
│  ├─ ui/                         design-system components
│  └─ testing/                    fakes, conformance suites, crash-matrix harness
├─ exercises/                     teaching tracks (one Nx project per track), run in verify
├─ tools/
│  ├─ verify/                     the staged verify gate
│  ├─ qualification/              gates, probes, ledger (adapted from complyj)
│  └─ generators/                 Nx generators: feature, lib, workflow, screen, exercise
└─ docs/
   ├─ adr/                        decisions (also rendered by apps/docs)
   ├─ plan/bootstrap/             this context
   └─ evidence/                   sanitized, dated qualification evidence records
```

Lib, generator and evidence-owner names in this file are indicative; the scaffolding session may refine them
without changing the rules below. complyj stores sanitized evidence under `docs/implementation/`; this repo uses
`docs/evidence/` as the clearer name for the same kind of record.

## Apps define the context

A feature's effects declare their requirements in the type: `Effect<A, E, LogStore | Identity | BlobStore>`. Only an
app provides implementations, by composing Layers at its root:

```ts
// apps/evidence-mobile/src/runtime.ts (illustrative)
const AppLive = Layer.mergeAll(
  EvidenceClient.layer,
  LogStore.sqliteNative,
  Identity.oidc,
  BlobStore.deviceFiles,
  Telemetry.otlp({ baseUrl: config.otlpUrl }),
)
```

A missing implementation is a compile error. Swapping an implementation (storage, identity, telemetry sink,
encryption) is one line in one app.

## Tags and rules (`@nx/enforce-module-boundaries`)

| Tag | Values | Allowed dependencies |
|---|---|---|
| `kind:` | `app`, `feature`, `lib`, `tool` | app -> feature, lib. feature -> lib (and another feature's `model` only). lib -> lib. tool -> anything it analyses. Nothing imports an app or a tool at runtime. |
| `layer:` | `model`, `client`, `server`, `core`, `adapter`, `ui`, `testing` | model -> core. client -> model, core, ui. server -> model, core. adapter -> core. ui -> ui. testing -> anything, only from tests. Apps compose adapters as Layers; a feature must not import an adapter (D52). |
| `platform:` | `universal`, `client`, `server` | universal -> universal. client -> client, universal. server -> server, universal. |

- Features interact through datoms, not through each other's client or server code. A feature may import another
  feature's `model` for ids and Schema, to hold a reference.
- Native vs web inside client adapters: Metro platform extensions (`.native.ts`, `.web.ts`), no extra tag.
- A lint-scope meta check fails if any tracked source file escapes lint (from web-interview).

## Ownership registry

Every `project.json` declares its tags and its evidence owner (D48'):

```json
{
  "tags": ["kind:lib", "layer:core", "platform:universal"],
  "metadata": { "evidenceOwner": "unit", "rationale": "pure datom and HLC logic" }
}
```

Evidence owners: `unit` (Vitest), `conformance` (pattern suites), `crash-matrix`, `storybook` (play + a11y),
`e2e-native` (Maestro via agent-device), `e2e-web` (Playwright), `qualification` (gate probes), `type-only`.
An unclassified project fails `verify`.

## Nx setup (D56)

- pnpm workspaces, Nx current TypeScript setup: TS project references, every project a workspace package named
  `@viviefs/<name>`, public API via `package.json` `exports` (deep imports impossible), Nx sync generators keep
  references correct.
- Inferred tasks from Nx plugins (Vite/Vitest, Expo, ESLint), minimal `project.json`.
- Free `@nx/enforce-module-boundaries`; no paid Powerpack.
- `verify` stages are Nx targets: affected projects locally, everything in CI.

## Generators make the right shape the easy path

| Generator | Creates |
|---|---|
| `nx g @viviefs/generators:feature <name>` | `model` / `client` / `server` projects with tags, an exemplar command, attribute Schema, tests, a story, a concept-page stub, an exercise stub |
| `nx g @viviefs/generators:lib <name> --layer=<layer> --platform=<platform>` | tagged lib with `exports`, test setup, registry entry |
| `nx g @viviefs/generators:workflow <feature> <name>` | versioned workflow + activities + crash-matrix test |
| `nx g @viviefs/generators:screen <feature> <name>` | screen-view selector, query atoms with Reactivity keys, component, story |
| `nx g @viviefs/generators:exercise <track> <name>` | exercise stub, failing test, reference solution |
