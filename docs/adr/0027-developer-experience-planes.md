# ADR-0027: Developer experience planes

Summary: Developer experience in three planes, one source of truth each: agent context, host toolchain, lab runtime.

Status: Proposed, unverified

Date: 2026-09-20. Amended 2026-09-29 (Skills step of Docs and teaching, D69):
skills are pinned by commit, byte-identical, and adapted on the repo side.

Qualifying gate: none (process)

Related: D49, D69. complyj ADR 0012 (adapted: mise is the chosen host toolchain,
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
in `skills-lock.json`. The first pack was a subset of `mattpocock/skills`
(grilling, tdd, domain-modeling, codebase-design, writing-for-agents,
scaffold-exercises) plus `motel-debug` from `kitlangton/motel`. Claude Code
loads `.claude/skills/` symlinks; Cursor and Codex read `.agents/skills/`
natively. A Claude marketplace plugin or global `npx skills add -g` of these
names is out of scope. The repo copy wins on a name collision.

**Pinned, byte-identical, adapted on the repo side** (amendment 2026-09-29,
D69). Every engineering and productivity skill of `mattpocock/skills` is
vendored (27 at `d81f3a18`), with `motel-debug`. The `skills` CLI (MIT, run
pinned as `skills@1.7.0` with telemetry off) writes each lock entry with the
upstream commit as `ref` and a hash of the whole skill folder; the first lock
had neither (it hashed `SKILL.md` alone). Vendored skill files are never
edited: where a skill needs this repo's shape, the adaptation lives in the
files the skills read (`docs/agents/issue-tracker.md`, `domain.md`,
`triage-labels.md`) and in `AGENTS.md`, so an update is a copy, not a merge.
Where upstream and the repo disagree on a name, the repo changes when that is
cheap (the glossary became `GLOSSARY.md`, ADR-0001). A skill that contradicts a
decision is forked into a repo-owned skill and leaves the lock:
`scaffold-exercises` (D66). An update re-adds skills at a newer commit after
the human reviews the changed ones; the command is in `AGENTS.md`.

Nix is not admitted. mise matches the app repos and is lighter. Apple
Container is the local runtime for Postgres, Keycloak, Jaeger, otel-lgtm when
those gates run; none of those images are admitted until the gap is measured.

## Trade-offs

Vendoring skills makes the process reviewable at the cost of manual updates.
Keeping them byte-identical makes an update one command, at the cost of
adapting through repo files instead of editing the skill.
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

2026-09-29, Skills step. Checked with the 28 vendored skills and the fork:
Codex 0.154 lists the 13 model-invoked skills from `.agents/skills/` and hides
the 16 user-invoked ones (`policy.allow_implicit_invocation: false`); `$ask-matt`
loaded the repo copy. Cursor Agent 2026.09.08 lists the same 13, honours
`disable-model-invocation`, and resolved `/ask-matt` to `.agents/skills/` with
`.claude/skills/` moved away. A fresh Claude Code session lists the repo's
`code-review` and not the built-in `/code-review`, which the repo copy
therefore replaces here. `verify`'s `skills` step (`static`) checks that every
vendored folder still hashes to its lock entry and is pinned to a commit, that
every skill is locked or listed as repo-owned (`REPO_OWNED_SKILLS` in
`tools/verify/src/skills-tree.ts`, with a reason), that `.claude/skills/` links
each one, and that each skill is user-invoked in all three agents or in none;
`skills-tree.test.ts` shows each rule failing.
