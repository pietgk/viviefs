# How to maintain XDevl

Rules for the three actors. The stable core is proposed and waiting on the
first grill session. These rules are how the folder is kept so that session
has somewhere to land. The session may change the rules. It records the
change in the [grill log](grill-log.md).

A guide's claim comes from a gate ([ADR-0026](../../adr/0026-verify-qualify-teach.md),
[D68](../../plan/bootstrap/02-decision-log.md#d68)). A sentence in this area
stays a research record until someone rewrites it into a guide that cites
a gate.

## Research bot

The Research bot adds a snapshot and appends an insight.

- Add a snapshot as a new file, `snapshots/YYYY-MM-DD-<topic>.md` or `.html`.
  Leave that file unchanged after it is added.
- Append to [insights](insights.md). Each entry has a date, a source, an
  evidence label, one statement, the practice it would affect, and status
  `raw`.
- Leave the [stable core](README.md), the [glossary](GLOSSARY.md), and this
  file as they are. A grill session is what changes them.
- Leave every dated record outside this area unchanged.

Copy an evidence label from the snapshot. `verified` means the snapshot's
author read the repo, the doc, or the paper. `release` means a lab or
several consistent official-looking sources. `X chatter` means posts, not
checked further. `our experiment` means a result this area produced.
`unlabelled` means the snapshot stated it and gave it no mark. A grill
session may downgrade a label. It writes that in the log.

## Grill session

A grill session is the only way into the stable core.

Run the repository's grill-with-docs skill. It delegates to
[grilling](../../../.agents/skills/grilling/SKILL.md) and
[domain-modeling](../../../.agents/skills/domain-modeling/SKILL.md).
Grilling asks a round of questions and waits. Domain modeling writes a term
when it is settled, in the shape the [glossary](GLOSSARY.md) already uses.

- A term that belongs to this area goes in [GLOSSARY.md](GLOSSARY.md).
- A term that belongs to the stack goes in the
  [repository glossary](../../../GLOSSARY.md).
- This area does not add a root glossary map. The product still has one
  context. This glossary is the vocabulary of a research area.
- An ADR is offered only when the domain-modeling skill's three tests all
  hold: hard to reverse, surprising without the context, and a real
  trade-off. A practice in this area is a research sentence, not an ADR.

Write one section in the [grill log](grill-log.md) for the session: each
insight discussed, the questions, the grill outcome, the reason, and the
commit that changed the core when one did.

The human answers. XDevl may edit the inbox, the glossary, and the core in
that same session, after the human has given the outcome.

## Human

The human approves every promotion before the stable core changes. The human
may park or reject. The human reviews a glossary entry an LLM drafted before
anyone uses that entry.

## Length

Each section of the stable core stays about one screen. A diagram can be
that screen. When a section grows past that, move the detail into the grill
log or a snapshot and leave the sentence plus a link.

The inbox may be long. The core stays short.

## What stays as written

- A snapshot, once added.
- Every dated record under `docs/research/` outside this area.
- An evidence label, until a grill session downgrades it in the log.

The docs site renders this folder, Mermaid included, and serves
[the map](concept-map.html). GitHub renders the Mermaid in the Markdown.
The map is a reading of the terms. The grill session is what changes the
terms.
