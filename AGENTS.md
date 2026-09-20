# ViViEfs agent map

This file is a map. Canonical content lives in the linked docs. Use the terms in
`CONTEXT.md`; do not drift to the synonyms it rejects. Skills are thin procedures
that link to guides, not a second copy of those guides (D30).

## Read before working

1. [`CONTEXT.md`](CONTEXT.md) - vocabulary.
2. [`docs/adr/README.md`](docs/adr/README.md) - decisions. Status `Proposed, unverified`
   until the named gate qualifies them.
3. [`docs/plan/bootstrap/README.md`](docs/plan/bootstrap/README.md) - complete design
   context (D1-D58). Treat grilling decisions as accepted intent, unverified until
   the named gate. Ask before deviating; record a deviation as an ADR amendment.
4. [`docs/plan/bootstrap/10-open-items-and-risks.md`](docs/plan/bootstrap/10-open-items-and-risks.md) -
   freeze / named-slot / hypothesis. P05 pinned `viviefs/changeset/*` and
   `evidence/*` names; P06 pinned `viviefs/workflow/*`, `viviefs/activity/exit`,
   `viviefs/deferred/exit`, `viviefs/clock/wake-at` and `viviefs/lease/holder`.
   Do not rename them (D44).
5. [`docs/plan/bootstrap/06-qualification-gates.md`](docs/plan/bootstrap/06-qualification-gates.md) -
   ordered gates. No feature code before its gate passes. Probes and exemplars stay.

## Delivery

A pattern is delivered only with an accepted ADR linking evidence, a green exemplar,
a concept page, an exercise, a lesson, and a link from the exemplar to that teaching
material. See [Verify - Qualify - Teach](docs/plan/bootstrap/05-verify-qualify-teach.md).

- **Verify**: `pnpm verify` (staged `static -> unit -> integration -> ui -> quality`).
  Done = green. Never loosen a gate to make it pass.
- **Qualify**: `pnpm qualify`. Ledger is machine-written; never hand-edit it.
- **Teach**: docs pages are canonical. Lessons cite evidence; they never become the
  source of a claim.

## Toolchain (D49)

| Plane | Source of truth |
| --- | --- |
| Agent context | this file, `.agents/skills/`, `skills-lock.json` |
| Host toolchain | `mise.toml` (Node, pnpm, bun) |
| Device driving | `@expo/agent-cli` in `apps/evidence-mobile`; `agent-device` in `tools/qualification` (both MIT) |
| Lab runtime | Apple Container image digests (admitted per measured gap; none yet) |

The evidence app is a development build (`expo-dev-client`), not Expo Go. P02
needs native modules Expo Go cannot load. Ask `@expo/agent-cli status` first,
then `dev --ios|--android --dev-client`. Read Hermes with `runtime:eval` /
`runtime:tree` / `runtime:errors`. Drive the accessibility tree with
`agent-device` (CLI-first, `testID` + `accessibilityLabel`). Do not scrape Metro
logs or click simulator coordinates to decide what the app is doing.

Vendored skills (MIT): `grilling`, `tdd`, `domain-modeling`, `codebase-design`,
`writing-for-agents`, `scaffold-exercises` from `mattpocock/skills` (copied from
complyj; pin recorded in `skills-lock.json`); `motel-debug` from
`kitlangton/motel@31186212365f705ba539c4befbf34a9b9e4bbcfe`. The repo copy wins
on a name collision with a user-level skill or plugin.

Claude Code loads the same tree through `.claude/skills/` symlinks. Cursor and
Codex read `.agents/skills/` natively.

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
