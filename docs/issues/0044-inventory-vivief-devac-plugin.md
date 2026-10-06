# I44: Inventory vivief's DevAC plugin

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: I35, I36

Found: 2026-10-05

Claimed: 2026-10-06

## What

Where do vivief's agent skills, commands and knowledge files stand in ViViEfs? Read `~/ws/vivief/plugins/devac/` (about 30 files, 4,600 lines): 10 skills, 13 commands, a hook, and the `knowledge/` files beside `effects-architecture` and `validate-architecture`, which are the "knowledge file a skill uses" step of the knowledge evolution path in practice. Compare with ViViEfs's `.agents/skills/`, `.agents/patterns/`, `docs/agents/` and `verify` steps. Cross-link I29 and I33 where they apply.

Write its rows file, `I44.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of I35 (vivief) and I36 (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[28 rows](../plan/vivief-inventory/rows/I44.md) and a coverage line for each of the 32 files in the slice (4,641 lines; the ticket says about 30 files and 4,600 lines): 3 `taken`, 18 `different`, 5 `missing`, 2 `rejected`. 25 rows are reference stack, 3 DevAC tooling; the reference-stack rows go to map 6 (13), map 5 (6), map 4 (5) and map 3 (1). 14 ids are new; 14 refine an earlier row (6 from I35, 4 from I40, 2 from I43, 1 from I36, 1 from I42), which I45 merges. There are four knowledge files, not three, and "a hook" is one `hooks.json` holding two hooks.

The two stacks meet on how an agent works: skills that fire on their own beside commands the user types, CLIs first with the model drafting, and a file of things learned in practice that the agent reads first (vivief's tacit insights; here the lab facts and the common mistakes on a guide's `review` page). They part on packaging: one Claude Code plugin with hooks and an MCP server, which ADR-0027 rules out (`rejected`). They part on how a rule is held: vivief keeps it as prose a model applies to itself (M1-M4, parity by construction) or as a reported score (G1-G4), where ViViEfs turns a mechanical rule into a check that fails. And plans are private and deleted in vivief, where here they are committed and kept. The gaps are the architecture quality loop, developer-maintained effects and the hooks that inject state into a session.

The plugin has drifted from the rest of vivief: a fourth wording of the handler formula, four gap metrics where `vivief ADR 0031` has five, and a hub path, tool and table names and links that no longer match; the rows file's Notes list them.

Not settled, for I45: `vivief:workflow-commands` and `viviefs:adr-lifecycle` carry a different level here than in I40; `vivief:tacit-insight-file` is `taken`, which a stricter reading makes `different`; both `rejected` rows rest on a Proposed ADR (ADR-0027) or on a rule for commits only; `vivief:conventional-commits` could be read as `different`.

## Comments
