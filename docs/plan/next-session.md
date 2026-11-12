# Next session: lesson 1 of the log-store guide, as a prototype

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then [I2 Accept the log-store guide][I2] and
> [the lesson plan](log-store-guide/lesson-first.md). Do the one item in Now.
> Ask before deviating from an agreed decision and record a deviation as an
> ADR amendment.

## Three rules (D214)

- One item in Now.
- Every session ends with something to look at or run, not only decisions.
- Prototype before deciding. A question the current lesson does not need gets a `Decide when:`.

## Now

**[I2 Accept the log-store guide][I2]: make the log-store guide acceptable, one lesson at a time.** All four lessons are in the docs with diagrams and widgets checked against the real code, after round 5 ([D216 Every lesson shows its idea][D216]-[D223 Each reader keeps its own place][D223]; [the lesson plan](log-store-guide/lesson-first.md), Where it stands). Round 5 took compaction out of the log store. [P04 Log store conformance][P04], [P05 Changesets and projections][P05], [P09 Sync][P09], [P10 Trace projection][P10] and [P11 Identity][P11] then passed on `752513846` (2026-11-12, `pnpm ledger`). The human reads them, the concepts page and Before you start on the site (`mise exec -- pnpm docs:prod`) and says what still trips them; that reply becomes at most seven changes. Then [I100 Address the repo-wide review findings][I100]'s open findings for the lesson (R02, R03, R08, R09), then lessons 2-4, then acceptance ([D63 Acceptance on the guide][D63]).

## Next

In this order, and only after the guide is accepted:

1. Write "How a lesson is made" from what happened.
2. Open the build queue again ([D214 The build queue waits for the log-store guide][D214]): [I102 Distinct activity names can skip work][I102] first, then [I71 An append can land after a revocation][I71], [I69 Accept checks every change][I69], [I84 Build the access pattern][I84], [I80 Build the journal fence][I80], [I81 Build conflicts decided at accept][I81], [I85 Build the hash chain][I85], [I67 Minting entity id segments][I67], then the app shell
   ([P12 UI on every platform][P12], [P13 Links and routing][P13], with [I13 UI renders only in the DOM, never on a device][I13]), closed by one sequential run. [I104 Fresh qualification emits stale dependency versions][I104] goes with the first change to `tools/qualification`.
3. The changesets guide, made lesson first.

Open and not scheduled: [I21 Test the glossary with a reader outside software][I21] (the reader test, after the term format is chosen), [I73 Table text in the docs search index][I73], [I101 A reusable review path][I101]. [I6 Post the two upstream issue drafts][I6] waits for the human
to post the two upstream drafts.

## Parked

Every other open issue has a `Decide when:` line and nothing to do until it fires: [the issues](../issues/README.md),
or Reference > Issues on the docs site. The vivief review is closed ([I34 vivief as the source of ViViEfs's concepts][I34], [D213 The vivief review closes without maps 4-6][D213]); the inputs for its maps 5 and 6
stay with [I24 Ideas batch: understanding LLM output (Andrej Karpathy)][I24], [I25 Ideas batch: understanding and maintaining code bases][I25], [I29 Ideas batch: agents that record a replayable run][I29], [I32 Ideas batch: explain any word on demand][I32] and [I33 Ideas batch: abstractions that constrain agents][I33].

The XDevl research area is not on `main`: its pull request (pietgk/viviefs#2) was closed without merging on
2026-11-10, its branch `cursor/xdevl-living-research-2a01` is kept, and the closing comment says what a restart needs.

## Where things stand (2026-11-10)

- **Code**: `main` is clean. [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed in one sequential run on `8caa2e6c2` (2026-10-31, run
  `2026-10-31T09-01-54.836Z-0ec14573`). Nothing since changed a gate input.
- **Delivered patterns**: none. The log-store guide is a draft; why is on [I2 Accept the log-store guide][I2].
- **History**: this page was 200 lines of it until 2026-11-10. It is in git
  ([the last long handover](https://github.com/pietgk/viviefs/blob/2cf420b4fec2d1399c8b672b05ac9209b81475a5/docs/plan/next-session.md)),
  in the resolved issues and in [the decision log](bootstrap/02-decision-log.md).

## Working notes

- Run Node.js through mise: `mise exec -- pnpm verify`. A change that touches only prose runs the docs steps.
- Never run `pnpm qualify` as a quick check: every run appends to the ledger. The next run is [P04 Log store conformance][P04] and [P05 Changesets and projections][P05], once,
  on the committed tree, when the guide is accepted.
- `pnpm refs fix` names gate, ADR, decision and issue references in living documents; agents' write-time hooks run it.
- Browse the guides with `mise exec -- pnpm docs:prod`.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D213]: bootstrap/02-decision-log.md#d213
[D214]: bootstrap/02-decision-log.md#d214
[D216]: bootstrap/02-decision-log.md#d216
[D223]: bootstrap/02-decision-log.md#d223
[D63]: bootstrap/02-decision-log.md#d63
[I100]: ../issues/0100-address-the-repo-wide-review-findings.md
[I101]: ../issues/0101-a-reusable-review-path.md
[I102]: ../issues/0102-distinct-activity-names-can-skip-work.md
[I104]: ../issues/0104-fresh-qualification-emits-stale-dependency-versions.md
[I13]: ../issues/0013-ui-on-every-platform.md
[I2]: ../issues/0002-accept-the-log-store-guide.md
[I21]: ../issues/0021-test-the-glossary-with-a-reader.md
[I24]: ../issues/0024-ideas-batch-andrej-karpathy-understanding.md
[I25]: ../issues/0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I29]: ../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md
[I32]: ../issues/0032-ideas-batch-explain-any-word-on-demand.md
[I33]: ../issues/0033-ideas-batch-abstractions-that-constrain-agents.md
[I34]: ../issues/0034-vivief-as-the-source-of-viviefs-concepts.md
[I6]: ../issues/0006-post-the-upstream-issue-drafts.md
[I67]: ../issues/0067-minting-entity-id-segments.md
[I69]: ../issues/0069-accept-checks-every-change.md
[I71]: ../issues/0071-an-append-can-land-after-a-revocation.md
[I73]: ../issues/0073-table-text-in-the-docs-search-index.md
[I80]: ../issues/0080-build-the-journal-fence.md
[I81]: ../issues/0081-build-conflicts-decided-at-accept.md
[I84]: ../issues/0084-build-the-access-pattern.md
[I85]: ../issues/0085-build-the-hash-chain.md
[P01]: bootstrap/06-qualification-gates.md#p01
[P04]: bootstrap/06-qualification-gates.md#p04
[P05]: bootstrap/06-qualification-gates.md#p05
[P09]: bootstrap/06-qualification-gates.md#p09
[P10]: bootstrap/06-qualification-gates.md#p10
[P11]: bootstrap/06-qualification-gates.md#p11
[P12]: bootstrap/06-qualification-gates.md#p12
[P13]: bootstrap/06-qualification-gates.md#p13
