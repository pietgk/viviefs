# ViViEfs agent map

This file is a map. Canonical content lives in the linked docs. Use the terms in
`GLOSSARY.md`; do not drift to the synonyms it rejects. Skills are thin procedures
that link to guides, not a second copy of those guides (D30).

## Read before working

1. [`GLOSSARY.md`](GLOSSARY.md) - vocabulary.
2. [`docs/adr/README.md`](docs/adr/README.md) - decisions. Status `Proposed, unverified`
   until the named gate qualifies them.
3. [`docs/plan/bootstrap/README.md`](docs/plan/bootstrap/README.md) - complete design
   context (D1-D80). Treat grilling decisions as accepted intent, unverified until
   the named gate. Ask before deviating; record a deviation as an ADR amendment.
4. [`docs/plan/bootstrap/10-open-items-and-risks.md`](docs/plan/bootstrap/10-open-items-and-risks.md) -
   freeze / named-slot / hypothesis, and the Schedule. P05 pinned `viviefs/changeset/*` and
   `evidence/*` names; P06 pinned `viviefs/workflow/*`, `viviefs/activity/exit`,
   `viviefs/deferred/exit`, `viviefs/clock/wake-at` and `viviefs/lease/holder`;
   P10 pinned `viviefs/activity/started`; P11 pinned `viviefs/membership/granted`,
   `viviefs/account/person`, `viviefs/account/issuer` and `viviefs/account/subject`.
   Do not rename them (D44).
5. [`docs/plan/bootstrap/06-qualification-gates.md`](docs/plan/bootstrap/06-qualification-gates.md) -
   ordered gates and how gates, steps and other work are named. No feature code
   before its gate passes. Probes and exemplars stay.
6. [`repos/effect/LLMS.md`](repos/effect/LLMS.md) - before writing Effect code. Then
   [`.agents/patterns/`](.agents/patterns/).

The current handover is [`docs/plan/next-session.md`](docs/plan/next-session.md).

## Delivery

A pattern is delivered only with qualification evidence, a green exemplar, and an
accepted guide (ADR-0026): a concept page, an exercise, a lesson, and a link from the
exemplar to that material. See [Verify - Qualify - Teach](docs/plan/bootstrap/05-verify-qualify-teach.md).

- **Verify**: `pnpm verify` (staged `static -> unit -> integration -> ui -> quality`).
  Done = green. Never loosen a gate to make it pass. A change that touches only
  prose runs the docs steps (the docs-only rule in `tools/verify/src/docs-only.ts`);
  `pnpm verify all` runs everything. Every production file has one file treatment in
  `tools/verify/src/evidence-registry.ts`; classify a new file there. `pnpm verify
  baseline` is the one command that writes `evidence-baseline.json`; run it only to
  record a reviewed coverage change, never to make `verify` pass. Where each kind of
  test lives: [04-repo-structure](docs/plan/bootstrap/04-repo-structure.md#where-tests-live-d80).
- **Qualify**: `pnpm qualify`. Ledger is machine-written; never hand-edit it.
- **Teach**: docs pages are canonical. Lessons cite evidence; they never become the
  source of a claim.
- **Guides**: [`apps/docs/src/content/docs/guides/`](apps/docs/src/content/docs/guides/index.mdx).
  Read the MDX sources; browse with `pnpm exec nx run docs:serve` (D64).
- **Research**: dated records in [`docs/research/`](docs/research/README.md), where the
  `research` skill writes. Never the source of a guide's claim (D68).

## Toolchain (D49)

| Plane | Source of truth |
| --- | --- |
| Agent context | this file, `.agents/skills/`, `.agents/patterns/`, `skills-lock.json`, `docs/agents/` |
| Host toolchain | `mise.toml` (Node, pnpm, bun) |
| TypeScript | dual pin in root `package.json` ([ADR-0028](docs/adr/0028-typescript-7-cli-with-typescript-6-api.md)): `tsc` is TypeScript 7 (`@typescript/native`); the `typescript` package name is TypeScript 6 (`@typescript/typescript6`) for Nx, ESLint and Vite. Do not install `typescript@7` under the `typescript` name. `tsc` is patched by `@effect/tsgo` ([ADR-0029](docs/adr/0029-effect-reference-and-language-service.md)). Editor tsserver stays on TypeScript 6 until Cursor Native Preview is usable. `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, and `moduleDetection: "force"` are on ([ADR-0031](docs/adr/0031-typescript-strictness-flags.md)). Do not enable `rewriteRelativeImportExtensions` or `ignoreDeprecations`. |
| Effect reference | `repos/effect` git subtree. Read-only. Prefer it over web search and over `node_modules`. |
| Device driving | `@expo/agent-cli` in `apps/evidence-mobile`; `agent-device` in `tools/qualification` (both MIT) |
| Lab runtime | Apple Container image digests, admitted per measured gap: [`tools/qualification/lab-images.json`](tools/qualification/lab-images.json) (Jaeger and otel-lgtm for P10, Keycloak for P11). A probe refuses an image that is not pinned by digest. |

The evidence app is a development build (`expo-dev-client`), not Expo Go. P02
needs native modules Expo Go cannot load. Ask `@expo/agent-cli status` first,
then `dev --ios|--android --dev-client`. Read Hermes with `runtime:eval` /
`runtime:tree` / `runtime:errors`. Drive the accessibility tree with
`agent-device` (CLI-first, `testID` + `accessibilityLabel`). Do not scrape Metro
logs or click simulator coordinates to decide what the app is doing.

Vendored skills (MIT): every engineering and productivity skill from
`mattpocock/skills` (27, D69) and `motel-debug` from `kitlangton/motel`.
`skills-lock.json` pins each to an upstream commit (`ref`) with a whole-folder
hash. They are byte-identical to upstream: never edit them; adapt on the repo
side (`docs/agents/`, this file). `scaffold-exercises` is repo-owned, a fork
adapted to D66, and not in the lock.

To move to a newer upstream commit, read the upstream changelog since the
pinned `ref`, review changed or new skills against D30 and `GLOSSARY.md` with
the human, then re-add them at the new commit (the CLI replaces each folder,
the `.claude/skills/` symlink and the lock entry):

```sh
DISABLE_TELEMETRY=1 mise exec -- npx -y skills@1.7.0 add "mattpocock/skills#<commit>" \
  --skill <name> <name> ... -a claude-code codex cursor -y
```

`skills experimental_install` restores the tree from the lock. `pnpm verify
skills` fails when a vendored skill differs from its lock entry, a symlink is
missing, or a skill is neither locked nor listed in `REPO_OWNED_SKILLS`
(`tools/verify/src/skills-tree.ts`).

Codex and Cursor read `.agents/skills/`; Claude Code reads the `.claude/skills/`
symlinks. Model-invoked skills fire on their own. User-invoked ones fire only
when typed: `/name` in Claude Code and Cursor, `$name` in Codex. The repo copy
wins on a name collision, so `code-review` here replaces Claude Code's built-in
`/code-review`.

## Agent skills

### Issue tracker

Specs and tickets are committed Markdown under `docs/plan/<effort>/`. See
[`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

The five default roles. See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single context: `GLOSSARY.md`, `docs/adr/`, the decision log. See
[`docs/agents/domain.md`](docs/agents/domain.md).

### Coding standards

For `code-review` and `retro`: the working agreements below, the ADRs and
`.agents/patterns/`; each guide's `review` page once guides exist (D62). A
mechanical rule becomes a `verify` check, not prose.

### Teach

`teach` runs in its own workspace outside this repo. Guides, lessons and
exercises here live in the docs site (D30, D62).

## Vendored repositories

External source lives under `repos/` as git subtrees ([ADR-0029](docs/adr/0029-effect-reference-and-language-service.md)).

- Use `repos/` as read-only reference when working with the related library.
- Prefer examples and patterns in the vendored source over web search and over
  `node_modules`.
- Do not edit files under `repos/` unless explicitly asked.
- Do not import from `repos/`. Application code imports `effect` and `@effect/*`
  from pnpm.
- `vendor/motel` is a separate isolation pin for motel's Effect version. It is
  not a reference subtree.

When writing Effect code, read [`repos/effect/LLMS.md`](repos/effect/LLMS.md),
then the matching file under [`.agents/patterns/`](.agents/patterns/). Those
pattern files are agent extracts. They cite `repos/effect` and must not become
a second copy of the docs concept pages (D30).

Field-manual topics without a pattern file: `pnpm exec effect-solutions show <topic>`.

## Working agreements

- Plain dash `-`, never the em dash.
- Never hand-edit auto-generated files (CHANGELOG, ledgers, generated docs).
- Prefer quality, simplicity, robustness and long-term maintainability over
  development cost.
- Bug fixes start with an end-to-end reproduction.
- Keep accepted, proposed, implemented and verified distinct. Never mark a gate
  passed from prose.
- Pin exact versions. `effect` and every `@effect/*` share one version. Expo SDK
  58 is pinned (beta until stable).
- Licence is Apache-2.0. Check licences of everything added. PowerSync service
  (FSL), Inngest server (SSPL) and Restate (BUSL) are not in the plan.
- Never add an agent as a commit co-author.
