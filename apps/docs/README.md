# Docs site

The ViViEfs docs site (D59-D61): Starlight on Astro 7, in this project. It
renders `GLOSSARY.md`, the ADRs, the evidence notes and the research records in
place; guides live in `src/content/docs/guides/`.

## Run

From the repository root:

```sh
pnpm exec nx run docs:build      # what verify's docs step runs; links, anchors and samples fail it
pnpm docs:dev                    # development server on http://localhost:4321, reloads on change; no search
pnpm docs:prod                   # builds, then serves dist/ as it would be deployed, with search
pnpm docs:stop                   # stops both servers, wherever they were started
```

`verify`'s `docs-e2e` step then opens the built `dist/` in a browser
(`e2e/`, `vitest.e2e.config.ts`): it serves the files itself, as they are
deployed, and checks the preview card on a page link (I97). It launches the
installed Google Chrome, as qualification's web probes do, and falls back to
Playwright's own Chromium, which exits at start on macOS 26.

Search is Pagefind: `astro build` writes its index to `dist/pagefind/`, and
Starlight shows "Search is only available in production builds" instead of
the search box in the development server. Use `docs:prod` to search.

`astro` is a dependency of this project only, so `pnpm exec astro ...` works
in `apps/docs`, not at the root. In a terminal, both servers run in the
foreground (Ctrl-C stops them). Astro 7 runs them in the background when it
detects an agent session, and then reuses a server that is already running.
A port in use moves the server to the next free one (4322 next to a running
`docs:dev`).

Starting and stopping go through Astro's own lock file (`.astro/dev.json`,
`.astro/preview.json`):

- Astro refuses to start a second dev or preview server while its lock file
  names a live one. `docs:serve` and `docs:preview` therefore run `astro dev
  stop` or `astro preview stop` first, which also ends a server left behind
  by an agent session or a closed terminal. Astro checks that the process in
  the lock file is still Astro, stops it with SIGTERM (SIGKILL after five
  seconds) and removes the lock. `astro preview --force`, which the refusal
  suggests, only works with `--background` in Astro 7.3.5.
- So a second `docs:dev` or `docs:prod` replaces the server of the first,
  and the first terminal's command ends with a non-zero exit code.
- `pnpm docs:stop` stops both servers through the lock files. It cannot stop
  a server started with `--ignore-lock`, which writes no lock file; stop that
  one with Ctrl-C.
- `serve` and `preview` are not Nx continuous tasks: Nx reports a
  continuous task that nothing depends on as successful whatever its exit
  code, so a server that failed to start printed "Successfully ran target"
  (I27). As plain tasks, a failed start fails the command, in a terminal and
  in an agent session ("Dev server process exited before becoming ready";
  the reason is in `apps/docs/.astro/dev.log`).

The development server is ready in about 3 seconds and `docs:prod` in about
15 seconds, or 3 from the Nx cache when nothing changed (I27). The content
layer renders every repository page on every start, and a changed page
again: a page links names, glossary terms and paths taken from other files,
so its cached render cannot be trusted. Keep that render cheap; a start that
takes longer than 60 seconds fails inside Vite ("transport invoke timed out
after 60000ms") and leaves a server that says it is ready but never answers.

## How it is put together

- One content loader, `src/lib/repo-docs-loader.ts`, renders repository
  Markdown in place, including a subfolder of `docs/research/`. Those pages
  are not under `src/content/docs`, so Starlight's `autogenerate` cannot
  list them; `src/lib/repo-pages.ts` builds their sidebar groups, with ADR
  status badges. A research subfolder is a collapsed group.
- Relative file links in any rendered Markdown become site or GitHub links,
  and a link to a missing file fails the build (`src/lib/repo-links.ts`);
  `starlight-links-validator` checks site paths and anchors.
- `<Sample path region>` embeds a `// #region` from source and fails on a
  missing region (`src/lib/regions.ts`, D60).
- Astro 7's Markdown processor is Sätteri, not remark: plugins are
  `mdastPlugins` and `hastPlugins` (`satteri`).
- `astro.config.ts` and `src/content.config.ts` are checked by the build, not
  by `tsc`: the Starlight plugins ship TypeScript sources that do not compile
  under this repository's settings.
- Mermaid renders in the browser (`astro-mermaid`), so `verify`'s `diagrams`
  step checks the source.
- Guides live in `src/content/docs/guides/<pattern>/`, in the shape of the
  guide template in `src/guide-template/` (D62). The template is published
  under Reference by a second glob loader in `repo-docs-loader.ts`; its pages
  carry a `slug`, which is how `starlight-links-validator` learns pages
  outside `src/content/docs`. `src/lib/guides.ts` builds the guide sidebar.
- References are resolved when a page renders (D87, `src/lib/reference-links.ts`):
  every gate, ADR and decision id in prose becomes a link that reads as its id
  and name, and every inline-code repository path a link; an unknown id or a
  stale path fails the build. Names and summaries come from the reference
  catalog in `libs/references` (D86'), which `pnpm refs fix` also writes into
  the markdown as named reference-style links; `src/lib/references.ts` adds
  the site URLs, the glossary and the path links. A reference-style link keeps
  its preview card. The decision log is rendered as Reference > Decisions, a
  row anchor per decision.
- Issues (`docs/issues/`, D92) render as Reference > Issues with a status
  badge, and `I<n>` resolves like the other ids. Reference > Claims (D93) is
  generated (`src/lib/claims.ts`) from `gates.ts`, the plan's gate table, the
  ADRs and `docs/evidence`; a gate reference links to its claim there.
- Glossary terms (D94): the same plugin links the first use of each
  `GLOSSARY.md` term on a page to its entry (anchors from
  `glossaryAnchors`), with the entry's plain first sentence as preview.
  Words in `EVERYDAY_TERMS` link only capitalised mid-sentence; proper nouns
  have no plural; on the glossary page, terms link inside each entry, never
  the entry's own term or its Avoid list.
- The preview card (D90) is an override of Starlight's `MarkdownContent`
  (`src/components/MarkdownContent.astro`): one small script shows a
  reference's kind, name and summary on hover and on keyboard focus.
- `<GuideStatus data={frontmatter} />` and `<ReadNext source={frontmatter.source} />`
  take the frontmatter as a prop: `starlight-llms-txt` renders pages outside
  Starlight's route, where `Astro.locals.starlightRoute` does not exist.
- Guide and lesson frontmatter keys are declared in `content.config.ts`;
  which keys a guide must have comes from the template, checked by
  `verify`'s `guides` step.
