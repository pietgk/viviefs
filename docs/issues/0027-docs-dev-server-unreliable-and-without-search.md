# I27: The docs development server does not come up reliably, and has no search

Status: needs-triage

Category: bug

Found: 2026-10-03

## What

The docs development server (`pnpm docs:dev`, `nx run docs:serve`, `astro dev` in `apps/docs`) needs 100 to 120 seconds to start and then often never answers, and it has no search, so a reader who wants to browse the docs with search has to wait for a full build (`pnpm docs:prod`). Make the development server start fast and reliably, and decide how a reader gets search locally.

## Observed

Astro 7.3.5, Starlight 0.42.4, Node 22.23.2, on 2026-10-03 with a load average around 6. Three starts of the development server from Claude Code:

| Start | Content synced after | Result |
| --- | --- | --- |
| `astro dev`, agent variables removed | 99 s | Ready in 100 s; pages answered (first one in 11 s, then 10 ms). |
| `pnpm run docs --ignore-lock` | about 120 s | "Failed to create the dev server app: transport invoke timed out after 60000ms" (Vite `fetchModule` of `virtual:astro:manifest`), then "ready in 122599 ms"; no request answered in 90 s. |
| `astro dev`, agent variables removed | about 110 s | The same timeout, then "ready in 110931 ms"; no answer. |

Each start logged "Astro config changed" and "Clearing content store" before syncing, so the content layer cache was never reused. A build logs "[starlight-links-validator] Invalidating content layer cache..." the same way. Both may be why every start reads the whole repository again. Not yet tried in a plain terminal outside an agent session; the timeout does not depend on the session, so a person is expected to hit it too.

Around it:

- **Agent sessions.** Astro 7 detects an agent (through `am-i-vibing`, from many environment variables) and starts `astro dev` and `astro preview` in the background, giving up after 30 seconds: "Dev server failed to start within 30s". `--ignore-lock` turns that off. When a server is already running, a second start reuses it and starts nothing on the new port.
- **Nx reports success on failure.** After the 30 s failure, `nx run docs:serve` still prints "Successfully ran target serve for project docs".
- **No search in development.** Starlight's `Search.astro` shows "Search is only available in production builds" whenever `import.meta.env.DEV` is set; the index is Pagefind's, written to `dist/pagefind/` by `astro build`.
- **Search on a build works.** `pnpm docs:prod` (`nx run docs:preview`: build, then serve `dist/`) built in 2 min 15 s; "datom log" found 48 results with sections. One result showed table text as "# Name Decision Why [D31 One datom log][D31]", so tables may be indexed poorly.
- **Script name.** The first script was `"docs"`, but `pnpm docs` is pnpm's own command (`pnpm docs <package>`) and never ran it; it is now `docs:dev`, with `docs:prod` beside it.

## Questions

- Why does the content sync take about 100 seconds, and why is its cache cleared on every start: is the config seen as changed each time (generated values in `astro.config`), or does `starlight-links-validator` invalidate it?
- Once the sync is fast, is the 60 s Vite timeout still reachable, or should the slow work move out of the module that Vite waits for?
- Is search in development worth having: a Starlight `Search` override that loads the `dist/pagefind/` index from the last build (stale until the next build), or is `docs:prod` enough?
- Should `docs:prod` reuse a cached build (the Nx `build` target is cached on its inputs) so a second start is fast?
- Should the docs scripts pass `--ignore-lock` in agent sessions, so agents get a foreground server and a real failure instead of a false success?
- Is the table text in the search index a Pagefind setting (`data-pagefind-ignore` on table headers) or a problem of how the site renders tables?

## Comments

2026-10-09: The context since this was written, before anything is changed.

- **Versions.** Unchanged: Astro 7.3.5, Starlight 0.42.4, `starlight-links-validator` 0.26.0, Node 22.23.2 (`mise.toml`). Published since: Astro 7.3.8, Starlight 0.42.6, the validator 0.27.0.
- **References are now in the markdown.** [I65 Named references in markdown][I65] built [D86' Named references in every living document][D86']: living documents carry named reference-style links (`[D107 The Presenter pattern][D107]`) that `pnpm refs fix` writes, from one reference catalog in `libs/references` shared by the site and the tool (`12e023737`). Other commits since 2026-10-03 under `apps/docs`, `libs/references` and `tools/refs`: `2523f8bf2` (a curled prime after a decision id), `56c8afed8` and `4885853b4` (named references in the guides and the guide template).
- **What the site still does when it renders** (`reference-links.ts`, `references.ts`, `repo-docs-loader.ts`), and whether the markdown now carries it:
  - a bare id in prose becomes a named link: still needed, because evidence notes and research records are kept as written ([D86' Named references in every living document][D86'] scope) and the site renders them;
  - a reference-style link gets its name checked and its preview card ([D90 Hover previews][D90]): the check now repeats `verify`'s `references` step, the card only the site can add;
  - glossary terms ([D94 A glossary a newcomer can read][D94]) and inline-code repository paths ([D87 References resolved when rendered][D87]) are linked: [D86' Named references in every living document][D86'] does not cover them, so the markdown does not carry them.

  So the render-time work is still the site's. Which part of it is slow is to be measured, not assumed. One cost is new with [I65 Named references in markdown][I65]: every reference-style link looks its label up in the catalog, and each lookup checks the modification time of the catalog's sources (about 150 files).
- **More pages.** The site now builds 161 pages (issues up to [I70 Research: access from membership to enterprise][I70], more research records).
- **Questions.** All six still stand. "Astro config changed" on every start, the 100 s sync and the Vite timeout are to be reproduced again from a plain shell before any change.

2026-10-09: Reproduced, measured and fixed. Every start below is `mise exec -- pnpm docs:dev` from a plain environment (`env -i` with only `HOME`, `USER`, `SHELL`, `TERM`, `LANG` and `PATH`, which `am-i-vibing` does not detect as an agent), in a fresh worktree, with a load average between 5 and 16.

Before:

| Start | Content synced after | Result |
| --- | --- | --- |
| First, no `apps/docs/dist` | did not finish | The Vite timeout about 124 s in, then at 167 s the sync threw on [I1 Advisories that fail audit with no fix released][I1]: `` `apps/docs/dist` names a repository path that does not exist (D87) ``. Nx printed "Successfully ran target serve" and exited 0. |
| Second, with a file in `apps/docs/dist` | 152 s | The Vite timeout, "ready in 153502 ms"; no request answered in 250 s. |
| Third, the same | 190 s | No "Astro config changed": the store was kept. The Vite timeout (`virtual:astro:server-app`), "ready in 193443 ms"; no request answered in 400 s. |

After:

| Start | Content synced after | Result |
| --- | --- | --- |
| First after the fix | 1 s | "ready in 2551 ms"; `/` answered 6.4 s after the command (pnpm and Nx included), the glossary in 11 ms. |
| Second | 1 s | "ready in 2538 ms"; `/` at 6.5 s. Editing an issue file showed on its page within 3 s. |
| In an agent session | - | Astro backgrounds it; the command ends in 4.1 s with exit 0 and the server URL. |
| A start that fails, terminal and agent session | - | "Running target serve for project docs failed", exit 1. |

`nx run docs:build --skip-nx-cache` takes 15 s (2 min 15 s on 2026-10-03). `pnpm docs:prod` serves in 16.5 s, and in 3.2 s the second time, from the Nx cache.

Causes, from a CPU profile of `astro sync` (170 s: 37 s user, 131 s system):

- **155 s: a whole directory tree read for each code span.** `holdsAFile` in `references.ts` (`b368795c6`, 2026-10-02, the day before this issue) counts a directory without files as missing, but read it with `readdirSync(..., { recursive: true })` before looking: a code span naming `apps/docs` or `libs/` read every file under it, `node_modules` included, on every page that names it. It now stops at the first file. This was the 100 s of 2026-10-03; the load decides how much more.
- **5 s: Git spawned 388 times per sync.** `isIgnored` asked `git check-ignore` for every code span shaped like a path, almost all of them code (`Effect.fn`, `@effect/vitest`). Git now lists the ignored paths once per process, and is asked about one path only when it is missing and under a checked root, where the answer decides whether the page fails.
- **A fresh clone could not start.** `git check-ignore apps/docs/dist` does not match the `dist/` pattern while `dist` does not exist, since Git cannot know it would be a directory, so [I1 Advisories that fail audit with no fix released][I1]'s `` `apps/docs/dist` `` was a missing path in every checkout that had not built yet: a new clone or worktree. Git is now asked about the path as a file and as a directory; a test covers it.
- **1.2 s: the reference-style links.** Since [I65 Named references in markdown][I65], each one checked the catalog's sources again. The catalog is now read once per page.
- **The Vite timeout follows from the slow sync.** The loader renders synchronously, so for those minutes Vite's `fetchModule` gets no answer; after 60 s Astro logs the error and keeps a server that never answers. With a 1 s sync it is not reached. The open case of a slow page is noted in `apps/docs/README.md`.
- **The cleared store is not the cause.** Consecutive starts kept it. It is cleared when a start in an agent session follows one in a terminal, or the other way round: Astro's agent mode sets `logger: { entrypoint: 'astro/logger/json' }`, and that is part of the configuration digest Astro compares (measured: the two stored digests differ in that key only). `starlight-links-validator` clears only the build's store (`node_modules/.astro`); the development server keeps its own (`.astro/data-store.json`). Keeping the store would not help anyway: `repo-docs-loader.ts` renders every repository page on every start, which is right, because a page shows names, glossary terms and paths from other files.
- **Nx reported a failed start as a success.** Nx 23.2.1 completes a continuous task that no other task needs as "fulfilled" whatever its exit code (`handleContinuousTaskExit`). Nothing depends on `docs:serve` or `docs:preview`, so they are plain tasks now and a failed start fails the command. One behaviour changes with it: a second `docs:dev` no longer waits for the first ("Waiting for docs:serve in another nx process") but replaces its server through `astro dev stop`, and the first terminal's command ends with exit 1.

Changed: `apps/docs/src/lib/references.ts`, `reference-links.ts` and `references.test.ts`; `apps/docs/project.json`; `apps/docs/README.md`.

On the questions:

- **Search in development: proposed, not built.** Starlight's `Search.astro` (488 lines) checks `import.meta.env.DEV` both in its markup and in its script, so a `Search` override would be a copy of it to keep in step with every Starlight release, or a Vite transform that edits the dependency's source; either also needs a middleware serving `dist/pagefind/` at `/pagefind/` and a notice that the index is as old as the last build. Not small. With `docs:prod` at 16 s, and 3 s from the Nx cache, I propose `docs:prod` is enough.
- **`docs:prod` from a cached build:** it already is. The `build` target is cached on its inputs ("existing outputs match the cache").
- **`--ignore-lock` in agent sessions:** not needed. A 3 s start fits Astro's 30 s background limit, and a failure now fails the command. Its reason is in `apps/docs/.astro/dev.log`.
- **Table text in the search index:** not looked at. It is the one question left open.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D31]: ../plan/bootstrap/02-decision-log.md#d31
[D86']: ../plan/bootstrap/02-decision-log.md#d86p
[D87]: ../plan/bootstrap/02-decision-log.md#d87
[D90]: ../plan/bootstrap/02-decision-log.md#d90
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I1]: 0001-advisories-that-fail-audit.md
[I65]: 0065-named-references-in-markdown.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
