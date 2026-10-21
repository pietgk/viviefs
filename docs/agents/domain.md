# Domain docs

How the engineering skills read this repo's domain documentation. Single
context: one glossary and one ADR directory at the root.

## Before exploring, read these

- [`GLOSSARY.md`](../../GLOSSARY.md): the vocabulary. Use its terms; do not drift
  to the synonyms it marks _Avoid_.
- [`docs/adr/`](../adr/README.md): the ADRs touching the area you work in.
- [`docs/plan/bootstrap/02-decision-log.md`](../plan/bootstrap/02-decision-log.md):
  the grilling decisions, accepted as intent and unverified until the
  named gate.

## Where decisions go

- A grilling records its answers in the decision log first, numbered on from the
  last `D`. An ADR follows when the decision is architectural.
- Questions still open when a session ends go into one issue for that session
  (`Category: question`, `Status: ready-for-human`). The next session answers
  them as decision-log rows and resolves the issue with links. An area keeps
  living docs and dated records, and links up to this log for decisions and to
  the glossary for vocabulary
  ([D135 Grill outcomes in the decision log](../plan/bootstrap/02-decision-log.md#d135),
  [D136 Issue and Area defined](../plan/bootstrap/02-decision-log.md#d136)).
- ADRs use this repo's template, not a one-paragraph ADR: `Status`, `Date`,
  `Qualifying gate`, `Related`, then Problem, Design, Trade-offs,
  Failure-handling, Outcome (expected vs observed). Every ADR starts as
  `Proposed, unverified` ([ADR-0001](../adr/0001-record-architectural-decisions.md)),
  and the index in [`docs/adr/README.md`](../adr/README.md) gets a row.
- Changing an agreed decision is a deviation: ask the human first, then record
  it as an amendment in the ADR that owns it.

## Flag ADR conflicts

If your output contradicts an ADR or a decision, say so explicitly rather than
silently overriding it:

> _Contradicts ADR-0007 (hybrid logical clock), but worth reopening because..._
