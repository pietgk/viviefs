# Log-store guide: design review

Status: resolved (design review agreed 2026-10-01: D81-D86; built 2026-10-01; the guide is a draft until the human accepts it, D63)

The Log-store guide step of Docs and teaching (D62-D67, D74). The first guide, which settles the guide template
and what a lesson is (D62). This page is the design review before any of it is built: the guide's scope, the
template, the lesson shape, the exercise track, the checks `verify` gains, and the API reference. Decisions that
come out of it are D81-D86 in the decision log, the ADR-0026 amendment of 2026-10-01 (which amends D67) and the
terms in `GLOSSARY.md`. The review page is the research record
[2026-10-01 Log-store guide review](../../research/2026-10-01-log-store-guide-review.html).

## 1. What is there today (2026-10-01, on `aa0a4ab12`)

| Fact | Consequence |
| --- | --- |
| `apps/docs` renders the glossary, ADRs, evidence and research in place; `guides/index.mdx` says no guide exists | The guide pages are new MDX under `src/content/docs/guides/log-store/` |
| The log-store ADRs are 0006 (one datom log, P04), 0007 (HLC, P04) and 0011 (log store pattern, P04 and P05); all `Qualified` | The guide's `adrs`; its `gates` are P04 and P05, because 0011's read-model claim ("rebuild equals incremental") is a P05 check |
| One `LogStore` service over `SqlClient` in `libs/datom/src/log-store.ts`; each store project is a Layer recipe (`sqliteNodeLogStore`, `pgliteLogStore`, `sqliteNativeLogStore`, the wasm store) | "Add a store implementation" is: a `SqlClient` Layer, the shared `logStoreLayer`, and `log-store/conformance` run against it |
| `log-store/conformance` (`runLogStoreChecks`, 12 checks) lives in `@viviefs/datom/suites`; `verify` runs it on sqlite-node and PGlite (`integration`); P04 runs it on every store, devices included | The `testing` page maps each check to its gate and its verify step from code, not prose |
| `libs/datom` also holds the changesets and projections code (`projector.ts`, `manifest.ts`, `visibility.ts`, `catalog.ts`), which is a later guide (D65) | `libs/datom` is the exemplar of two guides; `metadata.guide` as one string cannot say that (question 2) |
| No exemplar project has a README; no project has `metadata.guide` | D67's links are new for `libs/datom` and the four stores |
| Exercise files would sit under `exercises/`, outside `isProductionFile` (`apps/`, `features/`, `libs/`, `tools/`) | Exercises need no registry entry; their own test is the positive control (D66). A `test` target puts the track in the `unit` producer as it is |
| `starlight-typedoc` 0.23.1 (MIT) peers on Starlight >= 0.39, Astro >= 6, `typedoc` >= 0.28; `typedoc` 0.28.20 (Apache-2.0) supports `typescript` 6.0.x, which is what the `typescript` name resolves to here (ADR-0028) | The API reference looks possible on the pinned stack; build time and output are measured in the build, not assumed |
| `teach` defines a lesson as one self-contained HTML page in its own workspace, with retrieval practice, one tangible win, a primary source and a reminder to ask the agent | Its pedagogy is input; its workspace layout is not (handover). Section 4 adapts it |

## 2. Scope: what the log-store guide owns (D82, D83)

Patterns build on each other; they do not nest. A candidate is a pattern when it has a contract code depends on, a
suite and a gate; otherwise it is a concept, and it lives in the guide of the pattern whose contract defines it and
whose suite checks it. Every ADR is named by exactly one guide. The pattern id is the guide folder, the suite prefix
and the `metadata.guides` value.

| Log-store guide (ADR-0006, ADR-0007, ADR-0011; P04, P05) | Changesets guide (ADR-0008 to ADR-0010; P05, later) |
| --- | --- |
| Datom (the six fields; append-only; dedup by `tx`) | Changeset, commit datom, manifest, abort, expiry, basis |
| HLC and `tx` (mint, receive, future skew, reboot) | Conflict policy, conflict datom |
| Envelope and acceptance time (`LogStore.append` stores them; P04 checks them) | Entity ids, defining attribute, prefix composition |
| Log position, acknowledged cursor, compaction horizon, `heldBy`, prefix scans | Read model, projector, Reactivity keys, draft view |
| The three kinds of tables (ADR-0006), naming read models with a link | |
| Log store implementation and `log-store/conformance` | `changesets/conformance` |

ADR-0011's read-model sentence is stated as the log store's promise ("you may drop any read model") and links to
the changesets guide for how they are rebuilt (D83). Exemplar projects: `libs/datom`, `libs/store-sqlite-node`,
`libs/store-postgres`, `libs/store-sqlite-native`, `libs/store-sqlite-wasm`. The stores are not exemplars of the
changesets guide; they only run its suite.

## 3. The guide template (D62, D63)

A skeleton guide in `apps/docs/src/guide-template/`, published under Reference as "Guide template" through the
repo-docs loader. Its frontmatter keys, pages and `##` headings are the rules; the `guides` check (section 6) derives
them from it, so changing the template changes the rule.

| Page | Required `##` headings, in order |
| --- | --- |
| `index.mdx` | What it is; When to use it; When not to; Status (the generated block); Reading paths (discuss, design, implement, review) |
| `concepts.mdx` | one per concept, free; each names the ADR that is its why |
| `how-to.mdx` | one per task, free ("Add a store implementation", "Read the log from a cursor", "Register a consumer that holds compaction") |
| `testing.mdx` | Claims and their gates; Behaviours and their verify steps; When you extend it |
| `review.mdx` | Enforced by a tool; Needs judgment; Common mistakes |
| `lessons/NN-name.mdx` | the lesson shape (section 4) |
| `try-it.mdx` | Not yet (until P13, D73) |

`index` frontmatter (D63): `pattern`, `adrs`, `gates`, `exemplar`, `exercises`, `status` (`draft` \| `in review` \|
`accepted`), `accepted` (date, only when accepted). The Status block is an Astro component that renders, from the
frontmatter and the ADR files, each ADR's status, each gate with its evidence notes, the exemplar projects and the
exercise track. It does not read the ledger (D63). The frontmatter is also declared in `content.config.ts` by
extending Starlight's `docsSchema`, so the site build types it; the template stays the one source of which keys
are required.

The log-store guide starts at `status: draft`. Acceptance is the human's, in one commit after P04 and P05 pass on
it (D63).

## 4. What a lesson is (D62 left this open)

Proposed: **a lesson is one MDX page that teaches one key idea and ends in one tangible win, the exercise section
with its number.** Lesson `NN` and exercise section `NN.*` pair one to one. From `teach`: retrieval practice
(recall before and after), one tangible win, a primary source, short enough for working memory. Not from `teach`:
the workspace, the mission file, standalone HTML.

Frontmatter: `lesson` (NN), `evidence` (the notes it cites, at least one), `source` (one primary source: a paper,
an ADR, the Effect docs). Headings, in order:

1. **Recall first**: two or three questions on the previous lesson or the concepts it needs, answers folded
   (`<details>`). Spacing: lesson NN asks about NN-1.
2. **The idea**: the one idea, step by step, with samples embedded from the exemplar (`<Sample>`).
3. **What the gate showed**: the claim, the gate and a link to the evidence note. Never the source of the claim.
4. **Your turn**: the exercise `NN.MM`, what passing means, and the command that runs it against `problem/`.
5. **Check yourself**: two or three questions, answers folded, same length so the shape gives nothing away.
6. **Read next**: the primary source.

The feedback loop is the exercise's test, so the site needs no quiz component now.

Proposed lessons and track (`exercises/log-store/`):

| Lesson | Key idea | Exercise | Evidence |
| --- | --- | --- | --- |
| 01 A datom is one fact | Append-only; `tx` is identity, so a duplicate append is a no-op; the three kinds of tables | 01.01 append and stream: write datoms through a real `LogStore` on sqlite-node, read them back from a cursor, append the same batch again and get zero inserts | P04 (append, duplicate append, cursor streaming) |
| 02 Time without a trusted clock | HLC mint and receive; backwards wall clock, reboot, remote ahead, future skew | 02.01 `mintHlc` (counter tie-break, backwards clock, counter overflow); 02.02 `receiveHlc` (max, the 5000 ms bound) | P04 (HLC checks), ADR-0007's fractional-ms observation |
| 03 Who holds the log | Acknowledged cursors set the compaction horizon; `heldBy` names the consumer that is behind | 03.01 compaction: acknowledge two consumers, compact, show the slow one holds it, then release it | P04 (compaction horizon), P10 note on `trace/<sink>` |
| 04 One contract, many stores | A store is a `SqlClient` Layer plus the shared log store, qualified by one suite | 04.01 wire an in-memory sqlite-node log store Layer and pass `log-store/conformance` | P04 on five stores |

## 5. Exercises (D66)

- One Nx project, `exercises/log-store` (`kind:tool`), with an `exercise` target, run by the verify step `exercises`
  in the `unit` stage, without coverage (refined while building: as a `test` target the track ran in the `unit`
  producer and raised the coverage of `libs/datom`, so editing an exercise would have failed `evidence` on
  production files).
- Each `NN.MM-name/` has `problem/` and `solution/` exporting the same names, and one `exercise.test.ts` with a
  check function run against both: the solution must pass, the problem must fail with the expected assertion.
- Learners run `pnpm exercise log-store 02.01`: the same check against `problem/` only, reported as pass or the
  failing assertion. A thin process entry over a tested module, as `check-*.ts` are.
- Exercise files are not production files, so they have no registry entry; they are typechecked and linted like
  any other project (`lint-scope` must see them).
- D66 says the log-store track is written by hand; `scaffold-exercises` gets its layout step replaced by the
  `guides` check.

## 6. Checks in `verify`

A new verify step, `guides`, in `quality`, and in `DOCS_ONLY_STEPS` (a guide page is a docs-only path). A tested
module (`guides.ts`) and a thin entry (`check-guides.ts`), as `diagrams` is.

| Rule | Source |
| --- | --- |
| Every guide has the template's pages, `##` headings in order and frontmatter keys; every lesson has the lesson shape | D62 |
| `adrs` exist; `gates` are in the gate table; `exercises` names an existing track; each lesson's `evidence` exists under `docs/evidence/` | D62, D63 |
| An ADR is `Accepted` only if an accepted guide names it; an accepted guide's ADRs are all `Accepted`; an `Accepted` ADR names a qualifying gate and has an Observed entry | D63 |
| A guide's exemplar projects point back (`metadata.guide`), and their README and entry-module TSDoc link the guide page; a project's `metadata.guide` names an existing guide | D67 |
| Exercise layout: `NN.MM-name/{problem,solution}/` plus `exercise.test.ts`, numbers contiguous, sections paired with lessons | D66 |
| A guide's prose names gates and ADRs through `<Gate>` and `<Adr>`, never as a bare id; every ADR is named by at most one guide | D82, D86 |

Each rule has a failing case in `guides.test.ts`, the positive control.

## 7. API reference (D61)

`starlight-typedoc` over the exemplar projects the guides name (read from their frontmatter, so no second list),
generated at build time into a gitignored directory, listed under Reference > API. Pinned exactly: `starlight-typedoc`
0.23.1, `typedoc` 0.28.20, `typedoc-plugin-markdown` 4.13.1. If it does not build on Starlight 0.42 / Astro 7.3, the
API reference waits and the reason is recorded; the guide does not depend on it.

Measured 2026-10-01 on `libs/datom`: it builds (119 generated pages, links valid; the site build went from about 5 s
to 15 s). The output is poor for Effect services: `LogStore` renders as one unreadable `Shape<...>` type expression,
and its constructor and members come from `effect`'s `Context.Service` (`excludeExternals` removes the members, not
the constructor). The guide's embedded `service` region shows the contract more clearly. Not shipped; a question for
the human (build record).

## 7a. Build record (2026-10-01)

Choices made while building, inside the agreed decisions:

- **The template is published from `apps/docs/src/guide-template/`** by a second glob loader in the docs collection.
  Each glob loader sees only its own entries (a scoped view of the store), because a glob loader deletes every entry
  it did not load. Template pages carry a `slug` in their frontmatter, which is how `starlight-links-validator` learns
  pages outside `src/content/docs`; the `guides` check refuses a `slug` in a guide.
- **Components take the frontmatter as a prop** (`<GuideStatus data={frontmatter} />`,
  `<ReadNext source={frontmatter.source} />`): `starlight-llms-txt` renders pages outside Starlight's route.
- **Exercise tracks run in their own verify step, `exercises`, without coverage** (section 5).
- **Gate names**: `gates.ts` has a `name` per gate; the plan's gate table must show the same name, checked by
  `guides`, which also runs for a change that touches only the plan (a test in `tools/qualification` reading the plan
  would be skipped by the docs-only rule).
- **Statuses** (D63): an `Accepted` ADR needs an Observed entry and its P-gates in the gate table; ADR-0001 and
  ADR-0002 are accepted directly (D65). A guide's `gates` must equal its ADRs' qualifying gates.
- **Exercise 04.01**: the stub builds the store on `:memory:`, which fails `hlc reboot`; the learner gives it a file.
  An in-memory store that type-checks but cannot survive a restart is the lesson's point.
- **Not shipped**: the API reference (section 7).
- **Final counts**: `verify` has 18 steps (`exercises` and `guides` new); 231 production files; 86 exact tuples
  (`apps/docs/src/lib/guides.ts`, `apps/docs/src/lib/references.ts` and `tools/verify/src/guides.ts` new). No gate ran:
  P04 and P05 run on the commit that accepts the guide (D63).

## 8. Also in this step

- Teaching snippets in `apps/docs/src/samples/` only where a lesson needs code simpler than the exemplar; then they
  get their own typecheck, lint and a Vitest test (D60).
- READMEs for `libs/datom` and the four stores, linking the guide (D67).
- `GLOSSARY.md`: "Lesson" gets the settled definition; "Guide template" names its location.
- Decisions recorded from D81; the Schedule row updated; the guide index page lists the guide.
- No ADR changes status in this step: acceptance is the human's, later (D63).

## 9. Questions for the review (answered 2026-10-01)

1. What a lesson is: agreed as proposed (D81).
2. One project, two guides: `metadata.guides` as a list, after a worked example (D84, ADR-0026 amendment).
3. Scope split: read models move to the changesets guide too; agreed after the pattern map and the concept rule
   (D82). ADR-0011 stays on the log-store guide, with gates P04 and P05 (D83).
4. Lessons and exercises: agreed as proposed (D85).
5. From a review comment: gate and ADR references read as their name and are links, through `<Gate>` and `<Adr>`,
   with gate names in `gates.ts` (D86).

## 10. Review round 2 (2026-10-01): references, names, previews, the exercise loop

From the human's review of the site with the guide: bare ids (`P09`, `D1`, `ADR-0026`) and file paths were not links,
and the exercise loop was not explained. Decided as D87-D91 (review page
[2026-10-01 References review](../../research/2026-10-01-references-review.html)); built the same day:

- **References resolved when rendered** (D87): `apps/docs/src/lib/reference-links.ts`, a Sätteri plugin on every page,
  over the index in `references.ts`. Measured before: about 760 bare ids and 171 path spans on 76 pages. After: every
  id resolves, none is unknown, no path is stale. Ranges (`P01-P11`) link both ends by id alone, since a name would break
  the range. A possessive (`D58's`) ends an id. The `<Gate>` and `<Adr>` components and the `guides` rule against
  bare ids are gone.
- **Names and summaries** (D88): a Name column for the 84 decisions (drafted by the agent, for the human to review as
  one list), a `Summary:` line in the 31 ADRs and the template.
- **Decisions in the reference** (D89): the decision log is rendered in place, a row anchor per decision (`#d33p` for
  D33'), the row a link lands on highlighted.
- **Hover previews** (D90): an override of Starlight's `MarkdownContent` with one small script; kind, name, summary and
  status or evidence date, on hover and on keyboard focus.
- **The exercise loop** (D91): `learnerReporter` in `@viviefs/testing` prints "not yet" (the assertion, expected and
  received, the file to edit, the lesson to reread) or "done" (the solution to compare, the next exercise or lesson);
  every lesson's Your turn has the same three steps, from the template.
- **What P stands for**: answered in round 3 (D93): proof.

## 11. Review round 3 (2026-10-02): issues, claims, the glossary

Decided as D92-D94 (review page
[2026-10-02 Claims, issues and glossary review](../../research/2026-10-02-claims-issues-glossary-review.html)); built
the same day, in the agreed order:

- **Issues as records** (D92): `docs/issues/`, 21 issues (I1-I6 open questions for the human, I7-I20 the deferred
  decisions moved from the open-items table, I21 the glossary reader test), Reference > Issues with a status badge per
  issue, `I<n>` references resolved by the same plugin; a malformed title, status or What section fails the build.
  `docs/agents/issue-tracker.md` and `AGENTS.md` adapted; the vendored skills unchanged.
- **Claims in front** (D93): a `claim` per gate in `gates.ts`, equal to the plan's "Fact to establish" (checked by
  `guides`); a generated Reference > Claims page (`apps/docs/src/lib/claims.ts`); gate references link to their claim
  and preview it; the Evidence chapter is Claims and evidence; P is for proof in the gate table and the glossary.
- **A glossary a newcomer can read** (D94): every one of the 101 entries starts with a plain sentence; ten terms added
  (contract, Effect, service, layer, decision, ADR, evidence note, qualified, accepted, delivered); the first use of each
  term on a page links to its entry with the plain sentence as preview; everyday words (`EVERYDAY_TERMS`) link only
  capitalised mid-sentence; proper nouns have no plural; Avoid lists and an entry's own term never link. "Green" left the
  rules (AGENTS.md, ADR design text, the first page); run records that quote GREEN stay as written.

## Comments
