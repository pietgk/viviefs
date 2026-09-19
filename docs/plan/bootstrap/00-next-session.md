# Next session: scaffold ViViEfs

## Prompt to start the session

> Read `docs/plan/bootstrap/README.md` and every file it links, in order, including `research/`. This is the
> complete design context for ViViEfs. Then scaffold the repository following the work order in
> `docs/plan/bootstrap/00-next-session.md`. Treat every decision as accepted design intent that is unverified until
> its gate passes. Ask before deviating from a decision; record any deviation as an ADR amendment.

## Work order

Each step ends with a commit. Stop and report after step 5 before starting gate work.

1. **Toolchain plane** (D49)
   - `mise.toml` pinning Node (>= 22.13, required by Expo SDK 58), pnpm, Bun (for motel).
   - `.agents/skills/` vendored skills with `skills-lock.json` (grilling, tdd, domain-modeling, codebase-design,
     writing-for-agents, scaffold-exercises, plus `motel-debug`). Copy the mechanism from complyj.
   - `AGENTS.md` as a short map pointing into docs (D30); `CLAUDE.md` pointing at `AGENTS.md`.
2. **Glossary and ADRs** (D27)
   - `CONTEXT.md` from [07-glossary-seed.md](07-glossary-seed.md).
   - `docs/adr/` with the template from complyj (expected vs observed outcome, failure handling, evidence links)
     and the ADRs in [08-adr-backlog.md](08-adr-backlog.md). Every ADR starts as "Proposed, unverified" and names
     the gate that will qualify it.
3. **Nx workspace skeleton** (D52-D57)
   - pnpm workspaces + Nx current TypeScript setup (TS project references, `package.json` `exports`, no path
     aliases), Nx sync generators, inferred tasks.
   - Empty tagged projects matching [04-repo-structure.md](04-repo-structure.md), with `@nx/enforce-module-boundaries`
     rules for `kind:`, `layer:`, `platform:`. A lint-scope meta check that fails when a file escapes lint.
   - Ownership registry: every `project.json` declares tags and its evidence owner (D48').
4. **Verify gate** (D48')
   - `tools/verify`: staged `static -> unit -> integration -> ui -> quality`, fail fast between stages, help text
     generated from the executed table. Adapt from web-interview `scripts/verify.ts`.
   - Vitest + `@effect/vitest` as the only unit runner. GitHub Actions running `verify`. No retries.
5. **Qualification harness** (D46, D48')
   - Copy and adapt `tools/qualification` from complyj: gate table as code, append-only fingerprinted ledger,
     positive controls, sequential full run. Register gates P01-P14 from
     [06-qualification-gates.md](06-qualification-gates.md) as "not run".
6. **Gates in order** (D46): P01-P03 platform, then P04-P05 log store, then P06-P07 engine, then P08 UI prototype, then
   P09 sync, then P10 trace projection (then P11-P14). Each gate's probe becomes the first exemplar of its pattern.
7. **Docs and teaching skeleton** (D28, D29, D57): `apps/docs` (Starlight, type-checked samples, generated llms.txt),
   `exercises/` with the scaffold-exercises layout. A pattern is delivered only when it has an accepted ADR with
   evidence, a green exemplar, a concept page, an exercise and a lesson.

## Rules for the scaffolding session

- Do not write feature code before its gate passes. Probes and exemplars are allowed; they are retained, not
  thrown away.
- Pin exact versions: `effect@4.0.0-rc.<n>` and all `@effect/*` at the same version (they release together), Expo
  SDK 58 beta, then stable when it lands.
- Keep the repo licence Apache-2.0. Check licences of everything added (PowerSync service is FSL, Inngest server is
  SSPL, Restate is BUSL: none of these are in the plan).
