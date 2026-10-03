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
- **Search on a build works.** `pnpm docs:prod` (`nx run docs:preview`: build, then serve `dist/`) built in 2 min 15 s; "datom log" found 48 results with sections. One result showed table text as "# Name Decision Why D31", so tables may be indexed poorly.
- **Script name.** The first script was `"docs"`, but `pnpm docs` is pnpm's own command (`pnpm docs <package>`) and never ran it; it is now `docs:dev`, with `docs:prod` beside it.

## Questions

- Why does the content sync take about 100 seconds, and why is its cache cleared on every start: is the config seen as changed each time (generated values in `astro.config`), or does `starlight-links-validator` invalidate it?
- Once the sync is fast, is the 60 s Vite timeout still reachable, or should the slow work move out of the module that Vite waits for?
- Is search in development worth having: a Starlight `Search` override that loads the `dist/pagefind/` index from the last build (stale until the next build), or is `docs:prod` enough?
- Should `docs:prod` reuse a cached build (the Nx `build` target is cached on its inputs) so a second start is fast?
- Should the docs scripts pass `--ignore-lock` in agent sessions, so agents get a foreground server and a real failure instead of a false success?
- Is the table text in the search index a Pagefind setting (`data-pagefind-ignore` on table headers) or a problem of how the site renders tables?

## Comments
