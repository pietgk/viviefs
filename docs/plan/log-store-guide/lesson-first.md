# Lesson first: how the log-store guide gets accepted

Status: open (agreed with the human 2026-11-10, [D213-D215 A clean slate, then one lesson made great][D213-D215]; the work of [I2 Accept the log-store guide][I2])

The log-store guide has been a draft since 2026-10-01. Why the human does not accept it is recorded on [I2 Accept the log-store guide][I2]. This page is the plan that closes that gap, one lesson at a time. It replaces map 4 of the vivief review, which was never charted ([D213 The vivief review closes without maps 4-6][D213]).

**The core move: the dependency is inverted.** Until now the glossary had to be right before a lesson could be good. Now lesson 1 is the test of the glossary's term format, on the handful of terms it teaches. No other entry is touched until a lesson reaches it ([D215 The term format is settled on lesson 1's terms][D215]).

The lesson is `apps/docs/src/content/docs/guides/log-store/lessons/01-a-datom-is-one-fact.mdx`.

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
[D62]: ../bootstrap/02-decision-log.md#d62
[D63]: ../bootstrap/02-decision-log.md#d63
[I100]: ../../issues/0100-address-the-repo-wide-review-findings.md
[I102]: ../../issues/0102-distinct-activity-names-can-skip-work.md
[I2]: ../../issues/0002-accept-the-log-store-guide.md
[I30]: ../../issues/0030-ideas-batch-glossary-entries-written-as-effects.md
[P04]: ../bootstrap/06-qualification-gates.md#p04
[P05]: ../bootstrap/06-qualification-gates.md#p05
