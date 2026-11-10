# I102: Distinct activity names can skip work

Status: ready-for-human

Category: bug

Found: 2026-10-29

## What

Two activities whose names differ only in `//` against `~` get the same journal id, so the second one is silently skipped and returns the first one's result. Finding R01 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#r01-distinct-activity-names-can-skip-work), which has the reproduction and the sources.

`encodeIdSegment` in `libs/datom/src/ids.ts` doubles every `~` and then writes `/` as `~`. So `folder//read` and `folder~read` both encode as `folder~~read`, and the decoder reads both back as the second name. A workflow that runs two activities with those names executes only the first body: the second finds the first one's stored exit under its own journal entity and reuses it. No restart and no fault is needed.

Rechecked on main on 2026-11-10: the codec is unchanged.

## What a human has to decide first

Journal ids are persisted and never renamed or migrated ([D44 Never rename, never migrate][D44]). Repairing the codec changes how some names encode, so it needs a call before any code:

- which names may already be in a journal in the old encoding (only names holding `~` or `//` differ), and whether a journal written before the repair must still replay;
- the injective encoding itself, chosen so that names without `~` and without `//` encode as they do today.

## Then

Test first, through the public workflow contract: the two-activity reproduction in the workflow engine suites, and roundtrip and injectivity checks for runs of `/` and `~` in `libs/datom/src/ids.test.ts`, which today tries the two characters only apart. The repair changes gate inputs, so [P06 Workflow engine crash matrix][P06] qualifies again.

## Comments

2026-11-10: Split from [I100 Address the repo-wide review findings][I100] in its triage. It is the first issue when building resumes, after the log-store guide is accepted ([D214 The build queue waits for the log-store guide][D214]), because work is skipped without a sign.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D214]: ../plan/bootstrap/02-decision-log.md#d214
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[I100]: 0100-address-the-repo-wide-review-findings.md
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
