# I2: Accept the log-store guide

Status: ready-for-human

Category: enhancement

Effort: [log-store-guide](../plan/log-store-guide/spec.md)

## What

The log-store guide is a draft until a person accepts it. Acceptance ([D63 Acceptance on the guide][D63]) is one commit: run [P04 Log store conformance][P04] and [P05 Changesets and projections][P05] on it (devices and the lab), mark the guide `accepted` with the date and [ADR-0006 One datom log as the substrate][ADR-0006], [ADR-0007 Hybrid logical clock for tx][ADR-0007] and [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] `Accepted` with a link to the guide, and name the ledger run in the commit message. The `guides` step checks that the statuses agree.

## Why it is not acceptable yet

The human judged the guide not good enough to accept on 2026-10-05; the reason was recorded on 2026-11-10, in the human's words:

1. No visuals.
2. Words before the idea.
3. No real use.
4. Not made together.
5. Under all of it, the glossary's term format is unsettled: the hover sentence, the paragraph with links, the `_Like_`, `_Not_` and `_Avoid_` lines, and the wish to see a term as an effect formula ([I30 Ideas batch: glossary entries written as effects][I30]). That open question blocks trust in any lesson built on it.

## How it gets accepted

Lesson by lesson, not the guide at once ([D213-D215 A clean slate, then one lesson made great][D213-D215]). Lesson 1, "A datom is one fact", comes first and is the test of the term format on the terms it teaches:

1. A throwaway prototype of lesson 1 answers each part of the gap: a widget the learner operates before reading a term, the lesson's terms in two or three candidate formats side by side, the effect form as a hypothesis, and the evidence app action that causes these datoms. The human annotates it; the annotations become a short list of changes, which is what "great" means for this lesson.
2. Lesson 1 is built for real: the widget with a model that a test compares with the real `LogStore`, the guide template's lesson shape with the figure and the idea first, and lesson 1's glossary entries in the chosen format. The human reads it on the site and says what still trips them; that reply is the acceptance test of the lesson.
3. Lessons 2-4, one session each, in the same loop.
4. Acceptance as written under What ([D63 Acceptance on the guide][D63]).

Then "How a lesson is made" is written from what happened, as the way a pattern is made together from now on, and the build queue opens again ([D214 The build queue waits for the log-store guide][D214]).

## Comments

2026-11-10: The gap is recorded above, so acceptance has a target. This issue is the one item in Now ([the handover](../plan/next-session.md)). [I100 Address the repo-wide review findings][I100]'s findings R02, R03, R08, R09 and A01 are repaired with lesson 1.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: ../adr/0006-one-datom-log.md
[ADR-0007]: ../adr/0007-hybrid-logical-clock.md
[ADR-0011]: ../adr/0011-log-store-pattern.md
[D213-D215]: ../plan/bootstrap/02-decision-log.md#d213-d215
[D214]: ../plan/bootstrap/02-decision-log.md#d214
[D63]: ../plan/bootstrap/02-decision-log.md#d63
[I100]: 0100-address-the-repo-wide-review-findings.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
