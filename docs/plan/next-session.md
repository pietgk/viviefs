# Next session: Docs and teaching, closing the Evidence ownership step

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then
> `docs/plan/evidence-ownership/spec.md`, the "Evidence ownership design
> review (2026-09-30)" section of `docs/plan/bootstrap/02-decision-log.md`
> (D75-D80), and the Schedule in
> `docs/plan/bootstrap/10-open-items-and-risks.md`. Close the Evidence
> ownership step with one sequential P01-P11 run, then start the log-store
> guide. Ask before deviating from an agreed decision and record a deviation
> as an ADR amendment.

## Where things stand (2026-10-01)

- **The Evidence ownership step is built** (D70, D71, D75-D80; spec and build
  record in [evidence-ownership/spec.md](evidence-ownership/spec.md)).
  `pnpm verify all` is green with 16 steps. What is new:
  - Every production file has one **file treatment** in
    `tools/verify/src/evidence-registry.ts` (226 files); `ownership` fails an
    unclassified, stale or mis-shaped entry. `metadata.evidenceOwner` is gone.
  - **Suites ship with their contract** (D80): `@viviefs/datom/suites`,
    `@viviefs/workflow-engine/suites`, `@viviefs/telemetry/suites`,
    `@viviefs/identity/suites`; `libs/testing` holds only helpers, the suite
    catalogue and the one Vitest config shape. The engine runs its own suites
    on sqlite-node and PGlite, with the memory-engine positive control.
  - `unit`, `integration` and `storybook` are **one root Vitest run each**
    with Istanbul coverage; `evidence` in `quality` judges the run against
    `evidence-baseline.json`, written only by `pnpm verify baseline`.
  - **Schema at every boundary** is a lint rule (D79); SQL rows decode
    through `rowsOf` in `libs/datom`.
  - Terms in `GLOSSARY.md`: file treatment, suite, verify step, gate step,
    coverage producer, verdict, owning producer, registry, evidence lockfile.
- **Not done in this step**: the closing sequential P01-P11 run. Every gate is
  stale: the suites moved, SQL rows decode through Schemas, and the evidence
  app's workers and P02 SQL checks changed.
- **For the human to confirm**: the suite catalogue as the one declaration
  place (build record); `effect-solutions` 0.5.3, the newest, pins `effect`
  4.0.0-beta.59 and leaves an unmet peer warning on install (dev-only CLI,
  upstream).

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

## Next steps (the Schedule, Docs and teaching part)

1. **Docs skeleton**: done 2026-09-30 (above).
2. **Evidence ownership** (D70, D71, D75-D80): built 2026-10-01. Close it with
   one sequential run: `mise exec -- pnpm qualify --through P11` on a
   committed, clean tree (device lab and Apple Container needed; see the lab
   facts below).
3. **Log-store guide**, which settles the template and what a lesson is.
   `teach`'s pedagogy (retrieval practice, one tangible win per lesson, a
   primary source per lesson) is input; its workspace layout is not.
4. **App shell**: one grilling for P12 and P13, then both gates, then one
   sequential run.
5. **Durable workflow guide**, then **identity guide**, then the rest.

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`; `mise exec -- pnpm
  qualify --through P11` for a sequential run on a committed tree.
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
- Lab facts for any device run are in [p11-next-session.md](p11-next-session.md)
  (steps P11.6 and P11.8).
- `chrome-devtools-axi` still fails with "pageId: expected number" (2026-09-30).
  Headless Chrome screenshots work: `"/Applications/Google
  Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,2600
  --virtual-time-budget=8000 --screenshot=/tmp/page.png <url>`. Its minimum
  window width is 500 px, so a narrower shot looks clipped.
- Docs site: `pnpm exec nx run docs:build`, then `pnpm exec astro preview` in
  `apps/docs` (Astro 7 runs it as a daemon: `astro preview stop`), or
  `pnpm exec nx run docs:serve`. Astro 7's Markdown processor is Sätteri, not
  remark: plugins are `mdastPlugins` / `hastPlugins` (`satteri`). Repository
  pages are not under `src/content/docs`, so Starlight's `autogenerate`
  cannot list them; `repo-pages.ts` builds those sidebar groups.
