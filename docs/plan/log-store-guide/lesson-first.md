# Lesson first: how the log-store guide gets accepted

Status: open (agreed with the human 2026-11-10, [D213-D215 A clean slate, then one lesson made great][D213-D215]; the work of [I2 Accept the log-store guide][I2])

The log-store guide has been a draft since 2026-10-01. Why the human does not accept it is recorded on [I2 Accept the log-store guide][I2]. This page is the plan that closes that gap, one lesson at a time. It replaces map 4 of the vivief review, which was never charted ([D213 The vivief review closes without maps 4-6][D213]).

**The core move: the dependency is inverted.** Until now the glossary had to be right before a lesson could be good. Now lesson 1 is the test of the glossary's term format, on the handful of terms it teaches. No other entry is touched until a lesson reaches it ([D215 The term format is settled on lesson 1's terms][D215]).

The lesson is `apps/docs/src/content/docs/guides/log-store/lessons/01-a-datom-is-one-fact.mdx`.

## Where it stands (2026-11-11)

- **Step 1 ran twice.** Round 1 showed the parts outside a lesson. The human found that the widget assumed what a datom is and that logs sync, that the real use assumed Effect, and, under it, that nothing said what a learner is assumed to know. Round 2 showed the whole lesson after a "before you start" list in three tiers (TypeScript assumed, just enough Effect, the words the guide teaches), with one log and no server, the six parts of a fact named, format B word cards and an appendix trying the effect form on 15 terms. The human's reading of the appendix is on [I30 Ideas batch: glossary entries written as effects][I30] and [I106 Entries that do not say what a thing is][I106]. Instead of a third prototype, the human asked for the lesson in the docs, to judge it there.
- **Step 2 has a first cut, for the human to read.** Built: the guide's Before you start page (a new page of the guide template); the widget (`DatomLog.astro`) over a pure model (`apps/docs/src/lib/datom-log.ts`) that an integration test checks against the real `renameList` and a real log store on sqlite-node; word cards that read the glossary entry whole (`Term.astro`); glossary entries for `tx`, `op` and Log position, and Entity's Effect Cluster contrast moved to its `_Not_` line; a `docs-e2e` test that operates the widget. Lesson 1 keeps the template's `##` headings; its new parts are `###` sections under The idea, so lessons 2-4 are unchanged. Not done yet: the review findings below, and the lesson template's own text.
- **Round 3, from reading it in the docs (2026-11-11).** The human found that the lessons did not say who holds the log, that they were walls of text and code with one widget, and that Before you start belonged to every guide. Decided as [D216 Every lesson shows its idea][D216], [D217 Who holds the log comes first][D217] and [D218 Before you start is one page for all guides][D218]. Built: lesson 1's widget now has device A, device B and the server, and its integration test plays every scenario on the sync server (composed as the evidence server composes it) and two real `SyncClient` devices, comparing all three logs after every step; two sequence diagrams and a flowchart; five more word cards (Sync node, Device, Server, Authority, and a new glossary entry, Consumer); the concepts page's "Who holds the log"; Before you start at `/guides/before-you-start/`, with each guide's overview listing what it teaches; lesson 3 retitled "What a device may remove", since lesson 1 now says who holds the log; the `guides` step enforces [D216][D216] and lists lessons 2-4 as owing a diagram and a widget.
- **Round 4, the second reading the same day (2026-11-11).** Decided as [D219 Create a list, then rename it][D219]-[D222 Your turn is a review][D222], and [D216 Every lesson shows its idea][D216] lost its `owes:` escape. Built: `createList` split from `renameList` (lesson 1's widget showed three `evidence/list` facts after three renames); lessons 2-4 each with diagrams and a widget whose model an integration test checks against the real code (two clocks with a real reboot, compaction on a real store, the conformance suite on four databases); the sync server as one Layer in `libs/sync/server`, so the docs test no longer copies the app; concept sections in partials embedded by the concepts page and the lessons, and an `overlap` step that fails prose written twice; "Your turn" as a review (problem, both runs with what the test saw, the diff), kept current by `pnpm exercise:record` and the `exercises` step. [P09 Sync][P09] and [P11 Identity][P11] use the list commands, so they run again before acceptance.
- **Round 5, the third reading (2026-11-11).** The human liked how trying a widget makes them want to try, helps them understand and found an issue. Lesson 3 did not make sense (a `device-a` consumer of the device's own log, `trace/motel` from nowhere, arrows the wrong way), and a throwaway test showed why: compaction removed facts the projector had not read, and a rebuild after it emptied the read models ([I100 Address the repo-wide review findings][I100]'s A01). Decided from [the review page](../../research/2026-11-11-what-a-device-may-remove-review.html) as [D223 Each reader keeps its own place][D223]: `compact()` left the `LogStore` contract, [P04 Log store conformance][P04]'s check became "acknowledged cursor", device compaction went to [I107 Device compaction][I107], and lesson 3 became "Each reader keeps its own place" with a widget played on a real store and the real projector and exercise 03.01 "deliver, then acknowledge". Lesson 4's widget got a dropdown and checkboxes, and every widget one rule: a choice is a form control, a button an action.
- **The gates after round 5 (2026-11-12).** [P04 Log store conformance][P04], [P05 Changesets and projections][P05], [P09 Sync][P09], [P10 Trace projection][P10] and [P11 Identity][P11] passed on `752513846`, each on a clean tree, on Node, PGlite, iOS, Android and web where the gate runs there.
- **Next:** the human reads the lessons again on the site and says what still trips them.

## Step 1: prototype lesson 1, before deciding anything

One session. Throwaway: one HTML page built with the `prototype` skill, reviewed in Lavish, where the human annotates and does not discuss. Nothing in this step is production code or a decision.

The page shows four things, each answering one part of the gap:

| Gap | What the prototype shows |
| --- | --- |
| No visuals; words before the idea | A widget first: three facts, a log, a second replica. Buttons: send, retry with the same `tx`, retry that mints again, change the title. The learner sees "stored once" before reading a term. One pure model module, plain SVG, no dependency. |
| The glossary's term format | The lesson's own terms (Datom, Entity, Attribute, Log store, `tx`, the log position) as cards, in two or three candidate formats side by side: today's entry; the same plus an effect form; the same with the term pointed at in the widget. |
| The effect formula | A hypothesis to test, not a decision: a formula fits an operation, not a noun. `append: (log, datom) => (log', inserted or duplicate)` is the widget's step, the model's function and the signature of `LogStore.append` at once. A noun such as Datom is what appears inside formulas ([I30 Ideas batch: glossary entries written as effects][I30]). |
| No real use | One strip under the widget: the evidence app action that causes these datoms (rename a list; an offline changeset sent twice), with the code region shown the way the site's `Sample` component shows one. |

"Not made together" is answered by the step itself: show, say back, fix.

**Output:** the human's annotations, turned into a short list of changes, seven or fewer. That list is what "great" means for this lesson. Anything the lesson does not need gets a `Decide when:`.

## Step 2: build lesson 1 for real

One or two sessions.

- **The widget** is a component in `apps/docs/src/components/` (an Astro client script, TypeScript and SVG), with its model as a pure module beside it.
- **The model cannot drift from the exemplar.** A test runs the lesson's scenario through the real `LogStore` (`libs/datom/src/log-store.ts`, on the SQLite store for Node.js) and through the model, and compares the traces. A lesson never becomes the source of a claim.
- **A browser check**: the `docs-e2e` step operates the widget.
- **The guide template** (`apps/docs/src/guide-template/lessons/`): the lesson shape gains the figure and the idea-first order. The `guides` step derives its rules from the template ([D62 The shape of a guide][D62]), so the new sections are optional until lessons 2-4 are converted.
- **The glossary**: only lesson 1's terms move to the format chosen in step 1. The `glossary` step accepts both shapes meanwhile.
- **Review findings that belong here** ([I100 Address the repo-wide review findings][I100]): R08 (the Concepts page's portability claim), R03 (the Claims page's proof criteria), R02 (skipped tests that satisfy the evidence gate), R09 and A01.
- **Acceptance of the lesson**: the human reads lesson 1 on the site and says what still trips them. That reply is the test.

Checks: `pnpm docs:prod`, then the lesson page driven in a browser at 390 px and 1200 px, light and dark, with every widget control operated; `pnpm exercise log-store 01.01` still fails on `problem/` and passes on `solution/`; `pnpm verify all` green, with `docs-e2e`, `guides` and `glossary`.

## Step 3: lessons 2-4, then the guide

One session per lesson, in the same loop. Then [I2 Accept the log-store guide][I2] as [D63 Acceptance on the guide][D63] describes it: [P04 Log store conformance][P04] and [P05 Changesets and projections][P05] run once on the committed tree, the guide is marked `accepted`, and [ADR-0006 One datom log as the substrate][ADR-0006], [ADR-0007 Hybrid logical clock for tx][ADR-0007] and [ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011] become `Accepted`. That is the first delivered pattern.

## Afterwards, and only then

- Write "How a lesson is made" from what happened in steps 1-3: the loop of show, say back, fix, as the way a pattern is made together from now on.
- Open the build queue again, [I102 Distinct activity names can skip work][I102] first ([D214 The build queue waits for the log-store guide][D214]). The next pattern, changesets, is made lesson first.
- Video: look at it again outside this repository, once a widget model exists to render from.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0006]: ../../adr/0006-one-datom-log.md
[ADR-0007]: ../../adr/0007-hybrid-logical-clock.md
[ADR-0011]: ../../adr/0011-log-store-pattern.md
[D213]: ../bootstrap/02-decision-log.md#d213
[D213-D215]: ../bootstrap/02-decision-log.md#d213-d215
[D214]: ../bootstrap/02-decision-log.md#d214
[D215]: ../bootstrap/02-decision-log.md#d215
[D216]: ../bootstrap/02-decision-log.md#d216
[D217]: ../bootstrap/02-decision-log.md#d217
[D218]: ../bootstrap/02-decision-log.md#d218
[D219]: ../bootstrap/02-decision-log.md#d219
[D222]: ../bootstrap/02-decision-log.md#d222
[D223]: ../bootstrap/02-decision-log.md#d223
[D62]: ../bootstrap/02-decision-log.md#d62
[D63]: ../bootstrap/02-decision-log.md#d63
[I100]: ../../issues/0100-address-the-repo-wide-review-findings.md
[I102]: ../../issues/0102-distinct-activity-names-can-skip-work.md
[I106]: ../../issues/0106-entries-that-do-not-say-what-a-thing-is.md
[I107]: ../../issues/0107-device-compaction.md
[I2]: ../../issues/0002-accept-the-log-store-guide.md
[I30]: ../../issues/0030-ideas-batch-glossary-entries-written-as-effects.md
[P04]: ../bootstrap/06-qualification-gates.md#p04
[P05]: ../bootstrap/06-qualification-gates.md#p05
[P09]: ../bootstrap/06-qualification-gates.md#p09
[P10]: ../bootstrap/06-qualification-gates.md#p10
[P11]: ../bootstrap/06-qualification-gates.md#p11
