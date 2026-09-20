# ADR-0027: Developer experience planes

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: none (process)

Related: D49. complyj ADR 0012 (adapted: mise is the chosen host toolchain,
not Nix).

## Problem

Agent skills, host CLIs, and guest runtimes are different contexts. Conflating
them into one "DX module" hides those boundaries and expands qualification
into a developer-platform product. Skills that live only in a Claude plugin
leave Cursor and Codex on a different process.

## Design

Developer experience is architecture. Three planes, one source of truth each.
A tool is admitted only for a measured gap.

| Plane | Owns | Source of truth | Does not own |
| --- | --- | --- | --- |
| Agent context | Instructions, skills | `AGENTS.md`, `.agents/skills/`, `skills-lock.json` | Host packages, guest images |
| Host toolchain | CLIs and language runtimes on the Mac | `mise.toml` (Node, pnpm, bun) | Skill files, container images |
| Lab runtime | What runs inside containers | Apple Container image digests | Agent skills, host package managers |

Nx stays with the application (module boundaries). Skills tell agents how to
work the Nx repo; they are not an Nx library.

Skills this repo uses are Git artifacts, installed project-local, content-hashed
in `skills-lock.json`. The first pack is a subset of `mattpocock/skills`
(grilling, tdd, domain-modeling, codebase-design, writing-for-agents,
scaffold-exercises) plus `motel-debug` from `kitlangton/motel`. Claude Code
loads `.claude/skills/` symlinks; Cursor and Codex read `.agents/skills/`
natively. A Claude marketplace plugin or global `npx skills add -g` of these
names is out of scope. The repo copy wins on a name collision.

Nix is not admitted. mise matches the app repos and is lighter. Apple
Container is the local runtime for Postgres, Keycloak, Jaeger, otel-lgtm when
those gates run; none of those images are admitted until the gap is measured.

## Trade-offs

Vendoring skills makes the process reviewable at the cost of manual updates.
Leaving them in a plugin is Claude-only. mise instead of Nix follows the app
repos (BirVana, web-interview) rather than complyj's Nix-first rule, which
complyj itself already escaped with `./pnpmw`.

## Failure-handling

If a duplicate skill name is observed, follow the repo file and disable the
non-repo copy. A change under `tools/qualification/` invalidates gate passes
(ledger fingerprint). Unperformed: inventory of MCP servers (nothing required
today); qualifying Apple Container images (later gates).

## Outcome

### Expected

Clone + `mise install` yields the host toolchain. Every agent loads the same
skill tree from Git.

### Observed

`mise.toml`, `.agents/skills/` and `skills-lock.json` exist as scaffolding.
No runtime images are admitted yet.
