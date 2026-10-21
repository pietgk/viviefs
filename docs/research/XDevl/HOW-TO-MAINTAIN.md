# How to maintain XDevl

Rules for the three actors. This area keeps living pages and dated snapshots.
It keeps no glossary and no grill log of its own
([D136 Issue and Area defined](../../plan/bootstrap/02-decision-log.md#d136)). Answers from a grill session are rows
in the [decision log](../../plan/bootstrap/02-decision-log.md)
([D135 Grill outcomes in the decision log](../../plan/bootstrap/02-decision-log.md#d135)). An ADR follows only when
the decision is architectural.

A guide's claim comes from a gate
([ADR-0026 Verify - Qualify - Teach](../../adr/0026-verify-qualify-teach.md),
[D68 Research records](../../plan/bootstrap/02-decision-log.md#d68)). A sentence in this area stays a research record
until someone rewrites it into a guide that cites a gate.

## Research bot

The Research bot adds a snapshot and appends a finding.

- Add a snapshot as a new file, `snapshots/YYYY-MM-DD-<topic>.md` or `.html`.
  Leave that file unchanged after it is added.
- Append to [insights](insights.md). Each entry has a date, a source, an
  evidence label, one statement, a layer tag (L0-L6 or Human), the practice
  it would affect, and status `raw`.
- Leave the [area map](README.md), this file, and the
  [repository glossary](../../../GLOSSARY.md) as they are. A grill session
  is what changes them, through the pull request below.
- Leave every dated record outside this area unchanged.
- Leave prices and benchmark scores in the snapshot. The area map links to
  the newest snapshot and does not copy the numbers
  ([D134 Numbers stay in snapshots](../../plan/bootstrap/02-decision-log.md#d134)).

Copy an evidence label from the snapshot. `verified` means the snapshot's
author read the repo, the doc, or the paper. `release` means a lab or
several consistent official-looking sources. `X chatter` means posts, not
checked further. `our experiment` means a result this area produced.
`unlabelled` means the snapshot stated it and gave it no mark. Whether
`release` and `unlabelled` stay is open in
[I74 XDevl grill: open questions](../../issues/0074-xdevl-grill-open-questions.md). A later session may downgrade a
label. It records that as a decision-log row.

## Grill session

Run the repository's grill-with-docs skill. It delegates to
[grilling](../../../.agents/skills/grilling/SKILL.md) and
[domain-modeling](../../../.agents/skills/domain-modeling/SKILL.md).
Grilling asks a round of questions and waits. Domain modeling writes a term
when it is settled, in the shape the
[repository glossary](../../../GLOSSARY.md) already uses.

- A settled term goes in the repository glossary. This area has no vocabulary
  of its own.
- The product still has one context. Do not add a root glossary map for this
  area.
- An ADR follows only when the decision is architectural. A practice in this
  area is a research sentence, not an ADR.

The human answers. Answers go straight to the decision log as the next D
rows. Questions still open when the session ends go into one issue,
`Category: question`, `Status: ready-for-human`. The next session answers
them as D rows and resolves that issue with links.

## After the session

The assistant edits the repository from the human's decisions: one pull
request. The human reviews that pull request and merges it. The assistant
does not merge.

The edit may change the area map, the inbox status of a finding the session
decided, and the repository glossary when a term was settled. It links the
new D rows. It does not restate them.

## Human

The human approves every promotion before the stable core changes. The human
may park or reject. The human reviews a glossary entry an LLM drafted before
anyone uses that entry. The human reviews and merges the pull request.

## Length

Each section of the area map stays about one screen. A diagram can be that
screen. When a section grows past that, move the detail into a snapshot or
the decision log and leave the sentence plus a link.

The inbox may be long. The core stays short.

## What stays as written

- A snapshot, once added.
- Every dated record under `docs/research/` outside this area.
- An evidence label, until a later session downgrades it in the decision log.

The docs site renders this folder, Mermaid included, and serves
[the map](concept-map.html). GitHub renders the Mermaid in the Markdown.
The map is a reading of the terms. A grill session is what changes the terms,
by the pull request above.
