# I65: Named references in markdown

Status: ready-for-agent

Category: enhancement

Found: 2026-10-08

## What

Living markdown documents carry about 2,000 bare gate, ADR, decision and issue ids that only the docs site turns into named links, so a person reading an ADR in an editor, and every agent, has to look each one up; build D86' so the markdown itself names and links them, for Claude Code, Codex and Cursor alike.

Decided with the human on 2026-10-08, after reading [ADR-0033 The Presenter pattern](../adr/0033-the-presenter-pattern.md) as markdown (D86', which widens D86). Counted that day, outside code spans and existing links: ADRs 541, issues 770, the decision log 273, the glossary 27, AGENTS.md 21, guides 63, other plan pages a few hundred (the inventory rows, about 4,000 more, are dated records and out of scope).

### What to build

1. **One reference index for the site and the tool.** `buildReferenceIndex`, `findReferences` and their helpers live in `apps/docs/src/lib/references.ts`; `verify` cannot import an app (D52, D54), so move them to a project both may import and settle its Nx tags.
2. **`pnpm refs fix [files]`**: rewrites bare ids in scope into reference-style named links (`[D107 The Presenter pattern][D107]`), names only the first mention per paragraph or table cell and links the rest as bare ids, names a range that is exactly one decision log section by that section, updates labels when a title changes, and regenerates the definitions block at the end of the file (`<!-- References: written by pnpm refs fix; do not edit by hand. -->`). Skips code, headings and existing non-reference links, as the site does. Running it twice changes nothing.
3. **Anchors**: `<a id="d107"></a>` in each decision log row and `<a id="p05"></a>` in each gate table row, with the ids the site already uses (`decisionAnchor`: D58' is `#d58p`); a gate links to its row in `06-qualification-gates.md`.
4. **A `references` step in `verify`'s docs stage**, also on docs-only changes: fails on a bare id, a stale label or a broken target in scope, naming `pnpm refs fix`. Fold D86's guide-prose check into it.
5. **The site**: a source link to a known reference keeps its preview card and is checked like a bare id; reference-style links (`linkReference`) render as links.
6. **Agents as equal participants**: Claude Code (`.claude/settings.json`, a hook after a file is written or edited), Codex and Cursor each get a thin write-time hook calling `pnpm refs fix <file>`, where the agent has one. Check each agent's hook mechanism in its primary documentation when building; do not assume. `verify` checks that every supported agent's config calls the same command, so adding an agent is one config and one entry in that check. An agent without a hook relies on AGENTS.md and `verify`. Consider whether a git pre-commit hook adds anything beyond these; decide with the human.
7. **Writing guidance**: one line in AGENTS.md and the ADR template ("Related:" as named links).
8. **Migration**: one codemod commit per area (ADRs, issues, decision log, plan pages, glossary and AGENTS.md, guides), each with `verify` green; the human samples the diffs.

### Scope (D86')

In: ADRs, the decision log, issues, plan pages (not `docs/plan/vivief-inventory/rows/`), GLOSSARY.md, AGENTS.md, repo-owned skills, guides. Out, kept as written: evidence notes, research records, inventory rows. Never touched: machine-written files (the gate ledger, `evidence-baseline.json`), CHANGELOGs, vendored skills (`skills-lock.json`).

## Comments
