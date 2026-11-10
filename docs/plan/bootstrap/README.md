# ViViEfs bootstrap context

This directory is the design context ViViEfs was scaffolded from. It was produced on 2026-09-18/19 by a grilling
session (58 decisions, [D1 A reference stack][D1]-[D58 Envelope per changeset][D58]) plus primary-source research, as the complete, self-contained
context for a fresh scaffolding session; the sibling repos listed in [09-sources-to-reuse.md](09-sources-to-reuse.md)
were available locally for copying.

The repository has been built since. Read this directory for why the stack is designed the way it is. For where
the work stands today, read [the current handover](../next-session.md).

ViViEfs = **Vi**sion - **Vi**ew - **Ef**fect**s**. The name continues `~/ws/vivief`, a predecessor for several of the
concepts used here.

## Status

- Grilling decisions [D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94] ([D59-D74 Docs and teaching][D59-D74] from the Docs and teaching grilling, 2026-09-29; [D75-D80 Evidence ownership design review][D75-D80] from the Evidence ownership design review, 2026-09-30; [D81 What a lesson is][D81]-[D86 Named, linked references][D86] from the Log-store guide design review and [D87-D91 References, names and the exercise loop][D87-D91] from its second review round, 2026-10-01; [D92 Issues as records][D92]-[D94][D94] from the third, 2026-10-02) are **accepted as design
  intent** and **unverified** until the named qualification gate passes (see
  [06-qualification-gates.md](06-qualification-gates.md)). Treat each as "proposed, unverified" in ADR terms.
- Elaborations added while writing these files (gate splits, verify stage names, indicative schema and attribute
  names, lib names) are not grilling decisions. [10-open-items-and-risks.md](10-open-items-and-risks.md) splits freeze
  / named-slot / hypothesis so a scaffolding session does not treat them as law.
- Decisions after [D94 A glossary a newcomer can read][D94] (the vivief review and what followed) are in the same
  [decision log](02-decision-log.md), grouped by session and date.
- **Built since.** When this context was written no production code existed, and the first work was the gates.
  That work is done through [P11 Identity][P11]: the libraries, the evidence app, its server and the first guide exist. Which
  gates have passed is recorded by the machine-written ledger (`tools/qualification/gate-ledger.json`) and shown
  on the docs site under Reference > Claims, never by this page. What is being worked on now is in
  [the current handover](../next-session.md).

## Reading order

| # | File | What it gives you |
|---|---|---|
| 0 | [00-next-session.md](00-next-session.md) | History: the prompt and work order of the scaffolding session (2026-09-19). Skip it unless you want to know how the repository started |
| 1 | [01-vision-and-scope.md](01-vision-and-scope.md) | Why this repo exists, what is in and out of scope |
| 2 | [02-decision-log.md](02-decision-log.md) | All decisions ([D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94]) with rationale, grouped by theme |
| 3 | [03-architecture.md](03-architecture.md) | The technical design: datom log, HLC, changesets, workflow engine, sync, tracing, UI |
| 4 | [04-repo-structure.md](04-repo-structure.md) | apps / features / libs / tools, Nx tags and rules, generators |
| 5 | [05-verify-qualify-teach.md](05-verify-qualify-teach.md) | The validation, qualification and teaching pattern |
| 6 | [06-qualification-gates.md](06-qualification-gates.md) | The ordered gates (spikes) with pass conditions |
| 7 | [07-glossary-seed.md](07-glossary-seed.md) | Seed for `GLOSSARY.md` |
| 8 | [08-adr-backlog.md](08-adr-backlog.md) | The ADRs to write, with their source decisions |
| 9 | [09-sources-to-reuse.md](09-sources-to-reuse.md) | What to copy or learn from complyj, web-interview, BirVana, vivief |
| 10 | [10-open-items-and-risks.md](10-open-items-and-risks.md) | Unverified claims, deferred decisions, freeze vs hypothesis, known risks |
| - | [research/](research/) | Primary-source research notes with citations, and the Hermes probe |

## Conventions for this repo

These are inherited working agreements, not grilling decisions. A reader should not look for a D-number behind them.

- Plain dash `-`, never the em dash.
- Never hand-edit auto-generated files (CHANGELOG, ledgers, generated docs).
- Prefer quality, simplicity, robustness and long-term maintainability over development cost.
- Bug fixes start with an end-to-end reproduction.
- Keep accepted, proposed, implemented and verified distinct. Never mark a gate passed from prose.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D1]: 02-decision-log.md#d1
[D58]: 02-decision-log.md#d58
[D59-D74]: 02-decision-log.md#d59-d74
[D75-D80]: 02-decision-log.md#d75-d80
[D81]: 02-decision-log.md#d81
[D86]: 02-decision-log.md#d86
[D87-D91]: 02-decision-log.md#d87-d91
[D92]: 02-decision-log.md#d92
[D94]: 02-decision-log.md#d94
[P11]: 06-qualification-gates.md#p11
