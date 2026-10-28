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

## Writing a glossary entry

The glossary has its own entry shape; it overrides the vendored
`domain-modeling` skill's format where they differ.

- The first line is the hover line: one plain sentence, alone on its line, at
  most 120 characters, no code font, no reference. The precise part follows
  ([D94' The hover line](../plan/bootstrap/02-decision-log.md#d94p)). The docs build checks it.
- Then, each optional and in this order: `_Like_: X, except Y` for what a
  newcomer may know it as, `_Not_:` for another project's sense of the word,
  `_Avoid_:` for words not to use, a retired word naming the decision that
  retired it ([D174 Like, Not and Avoid lines](../plan/bootstrap/02-decision-log.md#d174), [D175 A retired word names its decision](../plan/bootstrap/02-decision-log.md#d175)).
- A single word is a term only where it matches Effect and the platforms and
  libraries the code uses; otherwise a compound, written whole every time
  ([D170 One word only where it matches](../plan/bootstrap/02-decision-log.md#d170), [D172 The compound, every time](../plan/bootstrap/02-decision-log.md#d172)). A word change rewrites the living documents
  in the same commit ([D173 What a word change rewrites, and where it is written](../plan/bootstrap/02-decision-log.md#d173)).
- A definition, and any general statement in a living document, names the
  general thing: a device, not a phone. A platform appears only as an example,
  "such as a phone or a browser", or where the fact is about that platform
  ([D179 A definition names the general thing](../plan/bootstrap/02-decision-log.md#d179)).
- A new term goes in the group of the foundation concept it serves ([D177 Groups follow the one turn](../plan/bootstrap/02-decision-log.md#d177)).

## Where decisions go

- A grilling records its answers in the decision log first, numbered on from the
  last `D`. An ADR follows when the decision is architectural.
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
