# ViViEfs bootstrap context

This directory is the complete, self-contained context for scaffolding the rest of the ViViEfs repository in a
fresh session. It was produced on 2026-09-18/19 by a grilling session (57 numbered decisions) plus primary-source
research. Nothing outside this directory is needed to continue, although the sibling repos listed in
[09-sources-to-reuse.md](09-sources-to-reuse.md) are available locally for copying.

ViViEfs = **Vi**sion - **Vi**ew - **Ef**fect**s**. The name continues `~/ws/vivief`, a predecessor for several of the
concepts used here.

## Status

- Every decision here is **accepted as design intent** and **unverified** until its qualification gate passes
  (see [06-qualification-gates.md](06-qualification-gates.md)). Treat each as "proposed, unverified" in ADR terms.
- No production code exists yet. The first work is the gates, not features.

## Reading order

| # | File | What it gives you |
|---|---|---|
| 0 | [00-next-session.md](00-next-session.md) | The prompt and work order for the scaffolding session |
| 1 | [01-vision-and-scope.md](01-vision-and-scope.md) | Why this repo exists, what is in and out of scope |
| 2 | [02-decision-log.md](02-decision-log.md) | All decisions (D1-D58) with rationale, grouped by theme |
| 3 | [03-architecture.md](03-architecture.md) | The technical design: datom log, HLC, changesets, engine, sync, tracing, UI |
| 4 | [04-repo-structure.md](04-repo-structure.md) | apps / features / libs / tools, Nx tags and rules, generators |
| 5 | [05-verify-qualify-teach.md](05-verify-qualify-teach.md) | The validation, qualification and teaching pattern |
| 6 | [06-qualification-gates.md](06-qualification-gates.md) | The ordered gates (spikes) with pass conditions |
| 7 | [07-glossary-seed.md](07-glossary-seed.md) | Seed for `CONTEXT.md` |
| 8 | [08-adr-backlog.md](08-adr-backlog.md) | The ADRs to write, with their source decisions |
| 9 | [09-sources-to-reuse.md](09-sources-to-reuse.md) | What to copy or learn from complyj, web-interview, BirVana, vivief |
| 10 | [10-open-items-and-risks.md](10-open-items-and-risks.md) | Unverified claims, deferred decisions, known risks |
| - | [research/](research/) | Primary-source research notes with citations, and the Hermes probe |

## Conventions for this repo

- Plain dash `-`, never the em dash.
- Never hand-edit auto-generated files (CHANGELOG, ledgers, generated docs).
- Prefer quality, simplicity, robustness and long-term maintainability over development cost.
- Bug fixes start with an end-to-end reproduction.
- Keep accepted, proposed, implemented and verified distinct. Never mark a gate passed from prose.
