# Next session: Docs and teaching, from the Skills step

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then the
> "Docs and teaching (2026-09-29)" section of
> `docs/plan/bootstrap/02-decision-log.md` (D59-D74), the Schedule and the
> drift table in `docs/plan/bootstrap/10-open-items-and-risks.md`, and
> ADR-0026. Continue Docs and teaching with the Skills step: bring me the
> include/adapt list before anything lands. Ask before deviating from an
> agreed decision and record a deviation as an ADR amendment.

## Where things stand (2026-09-29)

- **P01-P11 pass** in one sequential run on `54e724786`. This commit renumbers
  the follow-on gates and touches `tools/qualification` and `libs/`, so every
  gate is stale from here on. That is expected: almost every step ahead changes
  gate inputs, and the Schedule closes them in batches.
- **The Docs and teaching grilling is done** and recorded as D59-D74. The
  overview used in it, with the drift audit, the crash-matrix explainer, the
  web-interview comparison and the measured costs, is
  [`.lavish/delivery-model.html`](../../.lavish/delivery-model.html). It becomes
  the site's first page in the Docs skeleton step (D68).
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

1. **Skills** (D69). Compare `skills-lock.json` with `mattpocock/skills`
   (`d81f3a18` on 2026-09-29; 37 skills). Read each engineering and
   productivity skill and `scaffold-exercises` against D30 and `CONTEXT.md`.
   Bring an include/adapt list (overlaps: `teach` with Teach, `grill-with-docs`
   with grilling and domain-modeling, `code-review` with a user-level skill,
   `setup-matt-pocock-skills` expects an issue tracker). Nothing lands before
   the review. Skills are not gate inputs.
2. **Docs skeleton** (D59-D61, D68): `apps/docs` on Starlight, samples,
   loaders, `llms.txt`, link and Mermaid checks, the docs-only rule, the
   `.lavish/` move to `docs/research/` with links updated.
3. **Evidence ownership** (D70, D71): a design review of the treatment list
   first; then treatments, coverage lockfile, `pnpm verify baseline`, the
   engine crash matrix in `integration`, Schema at every boundary; one
   sequential P01-P11 run closes it.
4. **Log-store guide**, which settles the template and what a lesson is.
5. **App shell**: one grilling for P12 and P13, then both gates, then one
   sequential run.
6. **Durable workflow guide**, then **identity guide**, then the rest.

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`; `mise exec -- pnpm
  qualify --through P11` for a sequential run on a committed tree.
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
- `chrome-devtools-axi eval` failed in this session with "pageId: expected
  number", so the overview's Mermaid rendering was not checked in a browser.
