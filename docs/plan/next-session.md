# Next session: Docs and teaching, accepting the log-store guide, then the app shell

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then
> `docs/plan/log-store-guide/spec.md` (with its build record), the
> "Log-store guide design review (2026-10-01)" section of
> `docs/plan/bootstrap/02-decision-log.md` (D81-D91), and the Schedule in
> `docs/plan/bootstrap/10-open-items-and-risks.md`. If the human has reviewed
> the log-store guide, record what they said; acceptance follows D63. Then
> start the app shell (P12, P13) with its grilling. Ask before deviating from
> an agreed decision and record a deviation as an ADR amendment.

## Where things stand (2026-10-01, afternoon)

- **The log-store guide is built, as a draft** (D81-D91; spec and build record
  in [log-store-guide/spec.md](log-store-guide/spec.md); review page
  [2026-10-01-log-store-guide-review.html](../research/2026-10-01-log-store-guide-review.html)).
  `pnpm verify all` is green with 18 steps. What is new:
  - **The guide template** is a skeleton guide in `apps/docs/src/guide-template/`,
    published under Reference. `verify`'s new `guides` step derives the
    required pages, `##` headings and frontmatter keys from it, and checks
    ADR and guide statuses (D63), exemplar links both ways (`metadata.guides`
    is a list, D84), the exercise layout (D66), lessons paired with exercise
    sections (D81), every ADR on one guide (D82), no bare gate or ADR id in a
    guide's prose (D86), and that the plan names each gate as `gates.ts` does.
  - **The guide** `apps/docs/src/content/docs/guides/log-store/`: index (with
    the generated status block), concepts, how-to, testing, review, four
    lessons, try-it. Samples are regions of the exemplar.
  - **References, names, previews** (D87-D91, review round 2, the same day):
    every gate, ADR and decision id on every page renders as its id and
    name, linked, with a preview card on hover; inline-code repository paths
    are links; an unknown id or a stale path fails the site build. Decisions
    have names, ADRs a `Summary:` line, and the decision log is Reference >
    Decisions. `pnpm exercise` prints a learner's verdict ("not yet" or
    "done") instead of Vitest's output.
  - **What a lesson is** (D81): one page, one idea, recall before and after,
    the gate that showed it, its exercise section, one primary source.
  - **Patterns build on each other** (D82): a concept lives in the guide of
    the pattern whose contract defines it and whose suite checks it. The
    changesets guide owns changesets, conflict policies, entity ids and read
    models; ADR-0011 stays on the log-store guide (D83).
  - **The exercise track** `exercises/log-store` (five exercises) runs in the
    new `exercises` step, without coverage; learners run
    `pnpm exercise log-store 02.01`. The harness is `@viviefs/testing/exercise`.
  - `metadata.guides`, a README and an entry-module TSDoc link on `libs/datom`
    and the four store projects.
- **Round 3 of the review (2026-10-02, D92-D94)**: open issues are files in
  `docs/issues/` (I1-I21, Reference > Issues); every gate shows the claim it
  proves (Reference > Claims; P is for proof); the glossary starts each
  definition with a plain sentence, and the first use of a term on a page
  links to it with a preview. The human is still reviewing the docs.
- **For the human to decide**: the open issues, each with its options in
  its file (Reference > Issues on the docs site):
  - I1 the `node-forge` advisory that fails `audit` (no fix released): ignore
    it with a reason, or stay red. `verify all` is red on this alone.
  - I2 accepting the log-store guide (D63: P04 and P05 on that commit).
  - I3 the API reference for Effect services (D61).
  - I4 the `effect-solutions` peer warning, I5 the suite catalogue, I6
    posting the two upstream drafts.
  - I21 the glossary reader test.
  - I22 the overlap in Claims and evidence (Claims page, evidence index and
    one note per gate): a short design review on how to present each level
    of detail before changing it.
- **Gates**: none ran in this step. Every gate is stale since the Evidence
  ownership commit's run (expected; the Schedule closes them in batches).

## Before this step (2026-10-01, morning)

- **The Evidence ownership step is built** (D70, D71, D75-D80; spec and build
  record in [evidence-ownership/spec.md](evidence-ownership/spec.md)). Every
  production file has one file treatment in
  `tools/verify/src/evidence-registry.ts`; suites ship with their contract
  (D80); `unit`, `integration` and `storybook` are one root Vitest run each
  with Istanbul coverage, judged by `evidence` against
  `evidence-baseline.json`; Schema at every boundary is a lint rule (D79).
- **Closed**: P01-P11 passed in one sequential run on `9716b875d`, run
  `2026-10-01T05-58-55.362Z-02076418`. P07's visible notification tap still
  misses on both platforms and the relaunch fallback completes the deferred
  (open item, unchanged).

## Before 2026-10-01

- **The Docs skeleton step is done** (D59-D61, D68). `apps/docs` is a
  Starlight 0.42 site on Astro 7.3. It renders `GLOSSARY.md`, the ADRs, the
  evidence notes and the research records in place through one content
  loader (`apps/docs/src/lib/repo-docs-loader.ts`), with ADR status badges in
  the sidebar. Relative file links in any rendered Markdown become site or
  GitHub links, and a link to a missing file fails the build
  (`repo-links.ts`); `starlight-links-validator` checks site paths and
  anchors. `<Sample path region>` embeds a `// #region` from source and fails
  on a missing region; the first page embeds `datom` from
  `libs/datom/src/schema.ts`. `llms.txt` is generated. The first page is "How
  a pattern is delivered", rewritten from the grilling overview. `verify`
  gained `docs` (the site build) and `diagrams` (Mermaid edge integrity,
  adapted from web-interview) in `quality`, and the docs-only rule
  (`tools/verify/src/docs-only.ts`). The `.lavish/` pages moved to
  `docs/research/` with dated names; `.lavish/` is gitignored scratch.
- **For the human to confirm** (choices made in the Docs skeleton step, not
  grilling decisions): the glossary is rendered under Reference (D61's sidebar
  does not list it); `site` is `http://localhost:4321` until deployment is
  decided (`starlight-llms-txt` needs one); the API reference and the guide
  template come with the log-store guide, because no guide names an exemplar
  yet; `docs/evidence/**` is not docs-only, because the P03 and P09-P11 probe
  tests read evidence notes, and a `verify` test fails if a test names any
  other docs-only file; `astro.config.ts` and `content.config.ts` are not
  checked by `tsc` (the Starlight plugins ship TypeScript sources that do not
  compile under this repo's settings), the build checks them; Mermaid renders
  in the browser (`astro-mermaid`), so `diagrams` checks the source, as in
  web-interview. Astro pulls in `sharp`, whose macOS binary bundles libvips
  under LGPL-3.0; it runs at build time only and is never shipped.

- **P01-P11 pass** in one sequential run on `54e724786`. The commit after it
  renumbered the follow-on gates and touched `tools/qualification` and
  `libs/`, so every gate is stale from there on. That is expected: almost every step ahead changes
  gate inputs, and the Schedule closes them in batches.
- **The Docs and teaching grilling is done** and recorded as D59-D74. The
  overview used in it, with the drift audit, the crash-matrix explainer, the
  web-interview comparison and the measured costs, is the research record
  [2026-09-29-delivery-model.html](../research/2026-09-29-delivery-model.html);
  its lasting parts are the site's first page (D68).
- **The Skills step is done** (D69). Every engineering and productivity skill
  of `mattpocock/skills` is vendored at `d81f3a18`, byte-identical and pinned
  by `ref` in `skills-lock.json`; adaptations live in `docs/agents/` and
  `AGENTS.md` ([ADR-0027](../adr/0027-developer-experience-planes.md)
  amendment). The glossary is now `GLOSSARY.md`
  ([ADR-0001](../adr/0001-record-architectural-decisions.md) amendment).
  Specs and tickets go to `docs/plan/<effort>/`. `scaffold-exercises` is a
  repo-owned fork (D66). Codex and Cursor load the tree from `.agents/skills/`
  (checked). The repo's `code-review` replaces Claude Code's built-in
  `/code-review` in this repo. `verify`'s `skills` step keeps the tree equal
  to the lock. Skills are not gate inputs.
- **No ADR is Accepted, no pattern is delivered.**

## The grilling in one table

| Topic | Decision |
| --- | --- |
| Docs site | Starlight on Astro 7, MDX; ADRs and evidence rendered in place; API reference for exemplar projects only; `llms.txt`; links, Mermaid integrity, docs-only rule in `verify`; not deployed yet (D59-D61) |
| Samples | Regions embedded from the exemplar's own source; teaching snippets in `apps/docs/src/samples/`; `tsc` 7 with `@effect/tsgo`; no Twoslash for now (D60) |
| Guide | `guides/<pattern>/`: `index`, `concepts`, `how-to`, `testing`, `review`, `lessons/`, `try-it`; the template is a skeleton guide that a `verify` check derives its rules from (D62) |
| Acceptance | Frontmatter status; one commit marks the guide and its ADRs Accepted after its gates pass on that commit; `verify` checks the statuses agree (D63) |
| Agents | Read the MDX sources; one Guides line in `AGENTS.md`; skills only for real procedures (D64) |
| Inventory | Log store, durable workflow, identity first; three non-pattern guides accept 0003-0005, 0024-0031 and 0026 (D65) |
| Exercises | `exercises/<pattern>/NN.MM-name/{problem,solution}`; solution passes, problem fails; generator with the second track (D66) |
| Exemplar link | `metadata.guide` plus README and TSDoc, checked both ways (D67) |
| `.lavish/` | Moves to `docs/research/` (D68) |
| Skills | Matt Pocock skills updated and extended after an include/adapt review (D69) |
| Verify vs Qualify | Split by what a check needs and produces, not speed; `pnpm verify baseline`; time reported, not gated (D70, ADR-0026 amended) |
| Evidence ownership | web-interview's per-file treatments and coverage lockfile, adapted; crash matrix into `verify`; Schema at every boundary (D71) |
| UI on every platform | One React Native component tree; stories in Chromium (`verify`) and on the simulators (P12); Storybook 11 alpha pinned (D72) |
| Links and routing | New pattern and gate P13, with the first Playwright journey and Lighthouse budgets (D73) |
| Order and gates | Schedule below; P12 and P13 new, quarantine, encrypted store, crypto-shredding and browser leader move to P14-P17 (D74) |
| Log-store guide | A lesson is one page paired with an exercise section; patterns build on each other; ADR-0011 on the log-store guide; `metadata.guides` a list; four lessons, five exercises, `pnpm exercise`; named, linked gate and ADR references (D81-D86); references, names, previews and the exercise verdict on every page (D87-D91) |

## Next steps (the Schedule, Docs and teaching part)

1. **Docs skeleton**: done 2026-09-30.
2. **Evidence ownership** (D70, D71, D75-D80): done 2026-10-01.
3. **Log-store guide** (D62-D67, D81-D91): built 2026-10-01 as a draft;
   accepted when the human accepts it (above).
4. **App shell**: one grilling for P12 and P13, then both gates, then one
   sequential run.
5. **Changesets guide** (it owns read models now, D82), **durable workflow
   guide**, then **identity guide**, then the rest. The durable workflow track
   brings the `exercise` generator (D66).

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`; `mise exec -- pnpm
  qualify --through P11` for a sequential run on a committed tree.
- Measured 2026-10-01 afternoon: `exercises` 3 s, `guides` under 1 s; the docs build 4 s.
- Measured 2026-10-01 with coverage: `unit` 9 s, `integration` 14 s,
  `storybook` 2 s, `evidence` under 1 s; `pnpm verify baseline` about 2.5
  minutes (three producer runs and the bundles).
- Measured 2026-09-29 (all projects, Nx cache skipped): `verify` about 2.5
  minutes (static 23 s, unit 10 s, integration 17 s, ui 3 s, quality 79 s).
  Qualify P01-P11 30 minutes, almost all devices and labs; P06 takes 6 s.
- The ledger's input fingerprint includes the lockfile, workspace, `nx.json`,
  `tsconfig*.json`, `eslint.config.js`, `tools/qualification` and most of
  `libs/`, `apps/evidence-*` and `features/evidence/*` (Markdown excluded).
- Facts for the app shell: `@storybook/addon-vitest` supports Vitest 5 only
  from `11.0.0-alpha.1`; `@storybook/react-native` 10.6 needs Reanimated 4.5.1,
  gesture-handler, bottom-sheet and safe-area-context 5.8.
- Device runs: how to run a probe alone and the lab facts are in
  [tools/qualification/README.md](../../tools/qualification/README.md).
- Docs site: how to run it and how it is put together are in
  [apps/docs/README.md](../../apps/docs/README.md).
